package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.mail.internet.ContentDisposition;
import jakarta.mail.internet.ParameterList;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.core.StreamingOutput;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
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

  public AttachmentResource(AnetObjectEngine engine) {
    this.dao = engine.getAttachmentDao();
  }

  @GraphQLQuery(name = "attachment")
  public Attachment getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    return getAttachment(uuid);
  }

  @GraphQLQuery(name = "relatedObjectAttachments")
  public List<Attachment> getRelatedObjectAttachments(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid) {
    final List<List<Attachment>> attachments =
        dao.getRelatedObjectAttachments(Collections.singletonList(uuid));
    return attachments.get(0);
  }

  @GraphQLMutation(name = "createAttachment")
  public String createAttachment(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "attachment") Attachment attachment) {
    assertAttachmentEnabled();

    final Person user = DaoUtils.getUserFromContext(context);
    if (!hasAttachmentPermission(user, null)) {
      throw new WebApplicationException("You don't have permission to upload attachments",
          Status.FORBIDDEN);

    }
    assertAllowedMimeType(attachment.getMimeType());

    if (attachment.getClassification() != null) {
      // if the classification is set, control if the classification is valid
      assertAllowedClassification(attachment.getClassification());
    }

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
    dao.saveContentBlob(uuid, checkMimeType(attachment, attachmentContent));
    return Response.ok().build();
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
      logger.error(
          "Attachment content upload rejected for attachment {} (\"{}\"): "
              + "stated mimeType \"{}\" differs from detected mimeType \"{}\"",
          attachment.getUuid(), attachment.getFileName(), attachment.getMimeType(),
          detectedMimeType);
      throw new WebApplicationException("Attachment content does not match the MIME type",
          Status.BAD_REQUEST);
    }
    return tikaInputStream;
  }

  @GraphQLMutation(name = "updateAttachment")
  public String updateAttachment(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "attachment") Attachment attachment) {
    final Attachment existing = getAttachment(DaoUtils.getUuid(attachment));
    final Person user = DaoUtils.getUserFromContext(context);
    if (!hasAttachmentPermission(user, existing)) {
      throw new WebApplicationException("You don't have permission to update this attachment",
          Status.FORBIDDEN);

    }
    assertAllowedMimeType(attachment.getMimeType());
    assertAllowedClassification(attachment.getClassification());

    final int numRows = dao.update(attachment);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process attachment update", Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Attachment {} updated by {}", DaoUtils.getUuid(attachment), user);
    return DaoUtils.getUuid(attachment);
  }

  @GraphQLMutation(name = "deleteAttachment")
  public Integer deleteAttachment(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String attachmentUuid) {
    final Attachment existing = getAttachment(attachmentUuid);
    final Person user = DaoUtils.getUserFromContext(context);
    if (!hasAttachmentPermission(user, existing)) {
      throw new WebApplicationException("You don't have permission to delete this attachment",
          Status.FORBIDDEN);
    }

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

  private boolean hasAttachmentPermission(final Person user, final Attachment existingAttachment) {
    final Map<String, Object> attachmentSettings = getAttachmentSettings();
    final Boolean userUploadDisabled = (Boolean) attachmentSettings.get("disabled");

    if (Boolean.TRUE.equals(userUploadDisabled) && !AuthUtils.isAdmin(user)) {
      return false;
    }

    // only admin or owner can update attachment
    return existingAttachment == null || AuthUtils.isAdmin(user)
        || Objects.equals(existingAttachment.getAuthorUuid(), DaoUtils.getUuid(user));
  }

  private void assertAllowedMimeType(final String mimeType) {
    final Map<String, Object> attachmentSettings = getAttachmentSettings();
    final var allowedMimeTypes = (List<String>) attachmentSettings.get("mimeTypes");
    if (!allowedMimeTypes.contains(mimeType)) {
      throw new WebApplicationException(
          String.format("Files of type \"%s\" are not allowed", mimeType), Status.NOT_ACCEPTABLE);
    }
  }

  private void assertAllowedClassification(final String classificationKey) {
    final Map<String, String> allowedClassifications = getAllowedClassifications();
    if (!allowedClassifications.containsKey(classificationKey)) {
      throw new WebApplicationException("Classification is not allowed", Status.BAD_REQUEST);
    }
  }

  private void assertAttachmentEnabled() {
    final Map<String, Object> attachmentSettings = getAttachmentSettings();
    final Boolean attachmentDisabled = (Boolean) attachmentSettings.get("featureDisabled");

    if (attachmentDisabled) {
      throw new WebApplicationException("Attachment feature is disabled", Status.FORBIDDEN);
    }
  }

  public static Map<String, Object> getAttachmentSettings() {
    return (Map<String, Object>) AnetObjectEngine.getConfiguration()
        .getDictionaryEntry("fields.attachment");
  }

  public static Map<String, String> getAllowedClassifications() {
    final Map<String, Object> attachmentSettings = getAttachmentSettings();
    final Map<String, Object> classification =
        (Map<String, Object>) attachmentSettings.get("classification");
    return (Map<String, String>) classification.get("choices");
  }
}