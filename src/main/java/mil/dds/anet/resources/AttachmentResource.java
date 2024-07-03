package mil.dds.anet.resources;

import static mil.dds.anet.AnetObjectEngine.getConfiguration;

import com.codahale.metrics.annotation.Timed;
import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.mail.internet.ContentDisposition;
import jakarta.mail.internet.ParameterList;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.ResponseBuilder;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AttachmentSearchQuery;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.Utils;
import org.apache.tika.Tika;
import org.apache.tika.io.TikaInputStream;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Path("/api/attachment")
public class AttachmentResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AttachmentDao dao;
  private final AnetObjectEngine engine;

  public AttachmentResource(AnetObjectEngine engine) {
    this.dao = engine.getAttachmentDao();
    this.engine = engine;
  }

  @GraphQLQuery(name = "attachment")
  public Attachment getByUuid(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid) {
    assertAttachmentEnabled();
    return getAttachment(uuid);
  }

  @GraphQLQuery(name = "attachmentList")
  public AnetBeanList<Attachment> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") AttachmentSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  @GraphQLMutation(name = "createAttachment")
  public String createAttachment(@GraphQLRootContext Map<String, Object> context,
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

  @POST
  @Timed
  @Path("/uploadAttachmentContent/{uuid}")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  public Response uploadAttachmentContent(final @Auth Person user, @PathParam("uuid") String uuid,
      @FormDataParam("file") InputStream attachmentContent) {
    assertAttachmentEnabled();
    final Attachment attachment = getAttachment(uuid);
    assertAttachmentPermission(user, attachment,
        "You don't have permission to upload content for this attachment");
    dao.saveContentBlob(uuid, checkMimeType(attachment, attachmentContent));
    return Response.noContent().build();
  }

  private InputStream checkMimeType(final Attachment attachment,
      final InputStream attachmentContent) {
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
        throw new WebApplicationException("Attachment content does not match the MIME type",
            Status.BAD_REQUEST);
      }
    }
    return tikaInputStream;
  }

  @GraphQLMutation(name = "updateAttachment")
  public String updateAttachment(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "attachment") Attachment attachment) {
    assertAttachmentEnabled();
    final Person user = DaoUtils.getUserFromContext(context);
    final Attachment existing = getAttachment(DaoUtils.getUuid(attachment));
    assertAttachmentPermission(user, existing,
        "You don't have permission to update this attachment");
    assertAllowedMimeType(attachment.getMimeType());
    ResourceUtils.assertAllowedClassification(attachment.getClassification());

    final int numRows = dao.update(attachment);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process attachment update", Status.NOT_FOUND);
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
  public Integer deleteAttachment(@GraphQLRootContext Map<String, Object> context,
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
      throw new WebApplicationException("Couldn't process attachment delete", Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Attachment {} deleted by {}", attachmentUuid, user);
    return numRows;
  }

  @GET
  @Timed
  @Path("/download/{uuid}")
  @Produces(MediaType.APPLICATION_OCTET_STREAM)
  public Response downloadAttachment(final @Auth Person user, @PathParam("uuid") String uuid) {
    assertAttachmentEnabled();
    final Attachment attachment = getAttachment(uuid);
    final ResponseBuilder response =
        Response.ok(streamContentBlob(uuid)).type(MediaType.APPLICATION_OCTET_STREAM)
            .header("Content-Disposition", getContentDisposition("attachment", attachment));
    return response.build();
  }

  @GET
  @Timed
  @Path("/view/{uuid}")
  public Response viewAttachment(final @Auth Person user, @PathParam("uuid") String uuid) {
    assertAttachmentEnabled();
    final Attachment attachment = getAttachment(uuid);
    final ResponseBuilder response =
        Response.ok(streamContentBlob(uuid)).type(attachment.getMimeType())
            .header("Content-Disposition", getContentDisposition("inline", attachment));
    return response.build();
  }

  private Attachment getAttachment(final String uuid) {
    final Attachment attachment = dao.getByUuid(uuid);
    if (attachment == null) {
      throw new WebApplicationException("Attachment not found", Status.NOT_FOUND);
    }
    return attachment;
  }

  private StreamingOutput streamContentBlob(final String uuid) {
    return output -> dao.streamContentBlob(uuid, output);
  }

  private static String getContentDisposition(String disposition, Attachment attachment) {
    final ParameterList parameterList = new ParameterList();
    parameterList.set("filename", attachment.getFileName(), StandardCharsets.UTF_8.toString());
    return new ContentDisposition(disposition, parameterList).toString();
  }

  private void assertAllowedRelatedObjects(final Person user,
      final List<GenericRelatedObject> relatedObjects, boolean forDelete) {
    if (Utils.isEmptyOrNull(relatedObjects)) {
      return;
    }
    relatedObjects.forEach(aro -> {
      if (!isAllowedRelatedObject(user, aro)) {
        throw new WebApplicationException(String.format(
            "You are not allowed to %1$s the attachment %2$s one of the requested objects [%3$s:%4$s]",
            forDelete ? "unlink" : "link", forDelete ? "from" : "to", aro.getRelatedObjectType(),
            aro.getRelatedObjectUuid()), Status.BAD_REQUEST);
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
      // TODO: add other object types if and when attachments to them are allowed
      default -> false;
    };
  }

  private void assertAllowedMimeType(final String mimeType) {
    final var allowedMimeTypes = getAllowedMimeTypes();
    if (!allowedMimeTypes.contains(mimeType)) {
      throw new WebApplicationException(
          String.format("Files of type \"%s\" are not allowed", mimeType), Status.BAD_REQUEST);
    }
  }

  private void assertAttachmentEnabled() {
    final var attachmentSettings = getAttachmentSettings();
    final Boolean attachmentDisabled = (Boolean) attachmentSettings.get("featureDisabled");
    if (Boolean.TRUE.equals(attachmentDisabled)) {
      throw new WebApplicationException("Attachment feature is disabled", Status.FORBIDDEN);
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
      throw new WebApplicationException(message, Status.FORBIDDEN);
    }
  }

  @SuppressWarnings("unchecked")
  public static Map<String, Object> getAttachmentSettings() {
    return (Map<String, Object>) getConfiguration().getDictionaryEntry("fields.attachment");
  }

  @SuppressWarnings("unchecked")
  public static List<String> getAllowedMimeTypes() {
    // Get the allowed mime types from dictionary
    final var mimeTypes = (List<HashMap<String, ?>>) getAttachmentSettings().get("mimeTypes");
    // Extract names
    return mimeTypes.stream().map(element -> (String) element.get("name")).toList();
  }
}
