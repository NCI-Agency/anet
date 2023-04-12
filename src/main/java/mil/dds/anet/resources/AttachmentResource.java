package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;

@Path("/api/attachment")
public class AttachmentResource {

  private final AttachmentDao dao;

  public AttachmentResource(AnetObjectEngine engine) {
    this.dao = engine.getAttachmentDao();
  }

  @GraphQLQuery(name = "attachment")
  public Attachment getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final Attachment a = dao.getByUuid(uuid);
    if (a == null) {
      throw new WebApplicationException("Attachment not found", Status.NOT_FOUND);
    }
    return a;
  }

  @GraphQLQuery(name = "getAttachmentsForRelatedObject")
  public List<Attachment> getAttachmentsForRelatedObject(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid) {
    final List<List<Attachment>> attachments =
        dao.getAttachmentsOfRelatedObject(Collections.singletonList(uuid));
    return attachments.get(0);
  }

  // @Consumes(MediaType.MULTIPART_FORM_DATA)
  @GraphQLMutation(name = "createAttachment")
  public String createAttachment(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "attachment") Attachment attachment) {
    final Person user = DaoUtils.getUserFromContext(context);
    attachment = dao.insert(attachment);
    AnetAuditLogger.log("Attachment {} created by {}", DaoUtils.getUuid(attachment), user);
    return DaoUtils.getUuid(attachment);
  }

  @GraphQLMutation(name = "updateAttachment")
  public String updateAttachment(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "attachment") Attachment attachment) {
    final Attachment original = dao.getByUuid(DaoUtils.getUuid(attachment));
    if (original == null) {
      throw new WebApplicationException("Attachment not found", Status.NOT_FOUND);
    }

    final Person user = DaoUtils.getUserFromContext(context);

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
    final Attachment attachment = dao.getByUuid(attachmentUuid);
    if (attachment == null) {
      throw new WebApplicationException("Attachment not found", Status.NOT_FOUND);
    }
    final Person user = DaoUtils.getUserFromContext(context);
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
  public Response downloadAttachment(@PathParam("uuid") String uuid) {
    final Attachment attachment = dao.getByUuid(uuid);
    if (attachment == null) {
      throw new WebApplicationException("Attachment not found", Status.NOT_FOUND);
    }
    if (attachment.getContent() == null) {
      throw new WebApplicationException("Invalid attachment", Status.NOT_FOUND);
    }
    ResponseBuilder response =
        Response.ok(attachment.getContent(), MediaType.APPLICATION_OCTET_STREAM);
    response.header("Content-Disposition", "attachment; filename=" + attachment.getFileName());
    return response.build();
  }
}
