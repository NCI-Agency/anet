package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.github.borewit.sanitize.SVGSanitizer;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AttachmentSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.SecurityUtils;
import mil.dds.anet.utils.Utils;
import org.apache.tika.Tika;
import org.apache.tika.io.TikaInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/api/attachment")
public class AttachmentResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // Attachment contents (for view/download) can safely be cached
  private static final CacheControl cacheControl =
      CacheControl.maxAge(72, TimeUnit.HOURS).cachePublic();

  public static final String IMAGE_SVG_XML = "image/svg+xml";

  private final AnetObjectEngine engine;
  private final AttachmentDao dao;

  public AttachmentResource(AnetObjectEngine anetObjectEngine, AttachmentDao dao) {
    this.engine = anetObjectEngine;
    this.dao = dao;
  }

  @GraphQLQuery(name = "attachment")
  public Attachment getByUuid(@GraphQLRootContext GraphQLContext ignoredContext,
      @GraphQLArgument(name = "uuid") String uuid) {
    assertAttachmentEnabled();
    return getAttachment(uuid);
  }

  @GraphQLQuery(name = "attachmentList")
  public AnetBeanList<Attachment> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") AttachmentSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  @GraphQLMutation(name = "createAttachment")
  public String createAttachment(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "attachment") Attachment attachment) {
    assertAttachmentEnabled();
    final Person user = DaoUtils.getUserFromContext(context);
    assertAttachmentPermission(user, null, "You don't have permission to create attachments");
    assertAllowedMimeType(attachment.getMimeType());
    ResourceUtils.assertAllowedClassification(attachment.getClassification());
    assertAllowedRelatedObjects(user, attachment.getAttachmentRelatedObjects(), false);

    attachment.setAuthorUuid(DaoUtils.getUuid(user));
    attachment = dao.insert(attachment);
    AnetAuditLogger.log("Attachment {} created by {}", DaoUtils.getUuid(attachment), user);
    return DaoUtils.getUuid(attachment);
  }

  @PostMapping(path = "/uploadAttachmentContent/{uuid}",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Void> uploadAttachmentContent(final Principal principal,
      @PathVariable(name = "uuid") String uuid,
      @RequestParam("file") MultipartFile attachmentContent) {
    assertAttachmentEnabled();
    final Attachment attachment = getAttachment(uuid);
    final Person user = SecurityUtils.getPersonFromPrincipal(principal);
    assertAttachmentPermission(user, attachment,
        "You don't have permission to upload content for this attachment");
    try (final InputStream inputStream =
        checkMimeType(attachment, attachmentContent.getInputStream())) {
      dao.saveContentBlob(uuid, inputStream);
    } catch (IOException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Saving attachment content failed", e);
    }
    return ResponseEntity.noContent().build();
  }

  private InputStream checkMimeType(final Attachment attachment,
      final InputStream attachmentContent) throws ResponseStatusException {
    final TikaInputStream tikaInputStream = TikaInputStream.get(attachmentContent);
    final String detectedMimeType;
    try {
      detectedMimeType = new Tika().detect(tikaInputStream, attachment.getFileName());
    } catch (IOException e) {
      return attachmentContent;
    }
    if (!detectedMimeType.equals(attachment.getMimeType())) {
      if (getAllowedMimeTypes().contains(detectedMimeType)) {
        logger.info(
            "Attachment content upload for attachment {} (\"{}\"): "
                + "updated stated mimeType \"{}\" to detected mimeType \"{}\"",
            attachment.getUuid(), attachment.getFileName(), attachment.getMimeType(),
            detectedMimeType);
        attachment.setMimeType(detectedMimeType);
        dao.updateMimeType(attachment);
      } else {
        logger.error(
            "Attachment content upload rejected for attachment {} (\"{}\"): "
                + "stated mimeType \"{}\" differs from detected mimeType \"{}\"",
            attachment.getUuid(), attachment.getFileName(), attachment.getMimeType(),
            detectedMimeType);
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Attachment content does not match the MIME type");
      }
    }
    if (IMAGE_SVG_XML.equals(detectedMimeType)) {
      try {
        logger.debug("Detected SVG upload, sanitizing!");
        return SVGSanitizer.sanitize(tikaInputStream);
      } catch (Exception e) {
        logger.error("Error while sanitizing SVG", e);
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Problem with SVG upload");
      }
    } else {
      return tikaInputStream;
    }
  }

  @GraphQLMutation(name = "updateAttachment")
  public String updateAttachment(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "attachment") Attachment attachment,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    assertAttachmentEnabled();
    final Person user = DaoUtils.getUserFromContext(context);
    final Attachment existing = getAttachment(DaoUtils.getUuid(attachment));
    assertAttachmentPermission(user, existing,
        "You don't have permission to update this attachment");
    DaoUtils.assertObjectIsFresh(attachment, existing, force);

    assertAllowedMimeType(attachment.getMimeType());
    ResourceUtils.assertAllowedClassification(attachment.getClassification());

    final int numRows = dao.update(attachment);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process attachment update");
    }

    if (attachment.getAttachmentRelatedObjects() != null) {
      logger.debug("Editing related objects for {}", attachment);
      final List<GenericRelatedObject> existingRelatedObjects =
          existing.loadAttachmentRelatedObjects(engine.getContext()).join();
      Utils.updateElementsByKey(existingRelatedObjects, attachment.getAttachmentRelatedObjects(),
          GenericRelatedObject::getRelatedObjectUuid, newRelatedObject -> {
            final List<GenericRelatedObject> newRelatedObjects = List.of(newRelatedObject);
            assertAllowedRelatedObjects(user, newRelatedObjects, false);
            dao.insertAttachmentRelatedObjects(DaoUtils.getUuid(attachment), newRelatedObjects);
          }, oldRelatedObject -> {
            final List<GenericRelatedObject> oldRelatedObjects = List.of(oldRelatedObject);
            assertAllowedRelatedObjects(user, oldRelatedObjects, true);
            dao.deleteAttachmentRelatedObjects(DaoUtils.getUuid(attachment), oldRelatedObjects);
          }, null);
    }

    AnetAuditLogger.log("Attachment {} updated by {}", DaoUtils.getUuid(attachment), user);
    return DaoUtils.getUuid(attachment);
  }

  @GraphQLMutation(name = "deleteAttachment")
  public Integer deleteAttachment(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String attachmentUuid) {
    assertAttachmentEnabled();
    final Person user = DaoUtils.getUserFromContext(context);
    final Attachment existing = getAttachment(attachmentUuid);
    assertAttachmentPermission(user, existing,
        "You don't have permission to delete this attachment");
    assertAllowedRelatedObjects(user,
        existing.loadAttachmentRelatedObjects(engine.getContext()).join(), true);

    final int numRows = dao.delete(attachmentUuid);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process attachment delete");
    }
    AnetAuditLogger.log("Attachment {} deleted by {}", attachmentUuid, user);
    return numRows;
  }

  @GetMapping(path = "/download/{uuid}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
  public ResponseEntity<StreamingResponseBody> downloadAttachment(final Principal ignoredPrincipal,
      @PathVariable(name = "uuid") String uuid) {
    assertAttachmentEnabled();
    final Attachment attachment = getAttachment(uuid);
    final HttpHeaders headers = new HttpHeaders();
    headers.setContentDisposition(getContentDisposition("attachment", attachment));
    return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).headers(headers)
        .cacheControl(cacheControl).body(streamContentBlob(uuid));
  }

  @GetMapping(path = "/view/{uuid}")
  public ResponseEntity<StreamingResponseBody> viewAttachment(final Principal ignoredPrincipal,
      @PathVariable(name = "uuid") String uuid) {
    assertAttachmentEnabled();
    final Attachment attachment = getAttachment(uuid);
    final HttpHeaders headers = new HttpHeaders();
    headers.setContentDisposition(getContentDisposition("inline", attachment));
    return ResponseEntity.ok().contentType(MediaType.parseMediaType(attachment.getMimeType()))
        .headers(headers).cacheControl(cacheControl).body(streamContentBlob(uuid));
  }

  private Attachment getAttachment(final String uuid) {
    final Attachment attachment = dao.getByUuid(uuid);
    if (attachment == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
    }
    return attachment;
  }

  private StreamingResponseBody streamContentBlob(final String uuid) {
    return output -> dao.streamContentBlob(uuid, output);
  }

  private static ContentDisposition getContentDisposition(String disposition,
      Attachment attachment) {
    return ContentDisposition.builder(disposition)
        .filename(attachment.getFileName(), StandardCharsets.UTF_8).build();
  }

  private void assertAllowedRelatedObjects(final Person user,
      final List<GenericRelatedObject> relatedObjects, boolean forDelete) {
    if (Utils.isEmptyOrNull(relatedObjects)) {
      return;
    }
    relatedObjects.forEach(aro -> {
      if (!isAllowedRelatedObject(user, aro)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.format(
            "You are not allowed to %1$s the attachment %2$s one of the requested objects [%3$s:%4$s]",
            forDelete ? "unlink" : "link", forDelete ? "from" : "to", aro.getRelatedObjectType(),
            aro.getRelatedObjectUuid()));
      }
    });
  }

  private boolean isAllowedRelatedObject(final Person user,
      final GenericRelatedObject relatedObject) {
    // Check whether the user is allowed to link to the attachmentRelatedObjects!
    return switch (relatedObject.getRelatedObjectType()) {
      case LocationDao.TABLE_NAME ->
        LocationResource.hasPermission(user, relatedObject.getRelatedObjectUuid());
      case OrganizationDao.TABLE_NAME ->
        OrganizationResource.hasPermission(user, relatedObject.getRelatedObjectUuid());
      case ReportDao.TABLE_NAME ->
        ReportResource.hasPermission(user, relatedObject.getRelatedObjectUuid());
      case PersonDao.TABLE_NAME ->
        PersonResource.hasPermission(user, relatedObject.getRelatedObjectUuid());
      case EventDao.TABLE_NAME ->
        EventResource.hasPermission(user, relatedObject.getRelatedObjectUuid());
      case EventSeriesDao.TABLE_NAME ->
        EventSeriesResource.hasPermission(user, relatedObject.getRelatedObjectUuid());
      case PositionDao.TABLE_NAME ->
        PositionResource.hasPermission(user, relatedObject.getRelatedObjectUuid());
      // TODO: add other object types if and when attachments to them are allowed
      default -> false;
    };
  }

  private void assertAllowedMimeType(final String mimeType) {
    final var allowedMimeTypes = getAllowedMimeTypes();
    if (!allowedMimeTypes.contains(mimeType)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          String.format("Files of type \"%s\" are not allowed", mimeType));
    }
  }

  private void assertAttachmentEnabled() {
    final var attachmentSettings = getAttachmentSettings();
    final Boolean attachmentDisabled = (Boolean) attachmentSettings.get("featureDisabled");
    if (Boolean.TRUE.equals(attachmentDisabled)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Attachment feature is disabled");
    }
  }

  private void assertAttachmentPermission(final Person user, final Attachment attachment,
      final String message) {
    if (AuthUtils.isAdmin(user)) {
      return;
    }
    final var attachmentSettings = getAttachmentSettings();
    final Boolean restrictToAdmins = (Boolean) attachmentSettings.get("restrictToAdmins");
    final boolean isAuthor =
        attachment == null || Objects.equals(attachment.getAuthorUuid(), DaoUtils.getUuid(user));
    if (Boolean.TRUE.equals(restrictToAdmins) || !isAuthor) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }
  }

  @SuppressWarnings("unchecked")
  public static Map<String, Object> getAttachmentSettings() {
    return (Map<String, Object>) ApplicationContextProvider.getDictionary()
        .getDictionaryEntry("fields.attachment");
  }

  public static List<String> getAllowedMimeTypes() {
    // Get the allowed file types from dictionary
    @SuppressWarnings("unchecked")
    final var fileTypes = (List<Map<String, ?>>) getAttachmentSettings().get("fileTypes");
    // Extract MIME type
    return fileTypes.stream().map(element -> (String) element.get("mimeType")).toList();
  }
}
