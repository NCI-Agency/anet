package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.mail.internet.ContentDisposition;
import jakarta.mail.internet.ParameterList;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
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
import org.glassfish.jersey.media.multipart.FormDataParam;

@Path("/api/attachment")
public class AttachmentResource {

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

  // @Consumes(MediaType.MULTIPART_FORM_DATA)
  @GraphQLMutation(name = "createAttachment")
  public String createAttachment(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "attachment") Attachment attachment) {
    if (DaoUtils.getEnumId(attachment.getClassification()) != 0) {
      // classification is not "undefined"
      throw new WebApplicationException("Classification cannot be set", Status.FORBIDDEN);
    }
    final Person user = DaoUtils.getUserFromContext(context);

    if (hasUploadPermission(user, attachment.getMimeType())) {
      attachment.setAuthorUuid(DaoUtils.getUuid(user));
      attachment = dao.insert(attachment);
      AnetAuditLogger.log("Attachment {} created by {}", DaoUtils.getUuid(attachment), user);
      return DaoUtils.getUuid(attachment);
    }
    return null;
  }

  @POST
  @Timed
  @Path("/uploadAttachmentContent/{uuid}")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  public Response uploadAttachmentContent(final @Auth Person user, @PathParam("uuid") String uuid,
      @FormDataParam("file") InputStream attachmentContent) {
    dao.saveContentBlob(uuid, attachmentContent);
    return Response.ok().build();
  }

  @GraphQLMutation(name = "updateAttachment")
  public String updateAttachment(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "attachment") Attachment attachment) {
    final Attachment original = getAttachment(DaoUtils.getUuid(attachment));
    final Person user = DaoUtils.getUserFromContext(context);
    if (!AuthUtils.isAdmin(user)
        && !Objects.equals(original.getAuthorUuid(), DaoUtils.getUuid(user))) {
      // only admin or owner can update attachment
      throw new WebApplicationException("You don't have permission to update this attachment",
          Status.FORBIDDEN);
    }

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
    final Attachment original = getAttachment(attachmentUuid);
    final Person user = DaoUtils.getUserFromContext(context);

    if (!AuthUtils.isAdmin(user)
        && !Objects.equals(original.getAuthorUuid(), DaoUtils.getUuid(user))) {
      // only admin or owner can update attachment
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

  private boolean hasUploadPermission(final Person user, final String mimeType) {
    final String keyPath = "fields.attachment";
    final Map<String, Object> uploadPermission =
        (Map<String, Object>) AnetObjectEngine.getConfiguration().getDictionaryEntry(keyPath);
    final Boolean userPermission = (Boolean) uploadPermission.get("disabled");

    if (userPermission && !AuthUtils.isAdmin(user)) {
      throw new WebApplicationException("You don't have permission to upload attachment",
          Response.Status.FORBIDDEN);
    }

    final List<String> allowedMimetypes = ((List<String>) uploadPermission.get("mimeType")).stream()
        .map(String::toString).collect(Collectors.toList());
    if (!allowedMimetypes.contains(mimeType)) {
      throw new WebApplicationException("File extension is not allowed",
          Response.Status.NOT_ACCEPTABLE);
    }

    return true;
  }
}
