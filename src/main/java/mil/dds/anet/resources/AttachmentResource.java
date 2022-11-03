package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
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

@Path("/api/attachments")
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

  @GraphQLQuery(name = "attachments")
  public List<Attachment> getAttachmentsForRelatedObject(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid) {
    final CompletableFuture<List<Attachment>> attachments =
        dao.getAttachmentsForRelatedObject(context, uuid);
    return attachments.join();
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
  @Produces(MediaType.MULTIPART_FORM_DATA)
  public Response downloadAttachment(@PathParam("uuid") String uuid) {
    final Attachment attachment = dao.getByUuid(uuid);
    ResponseBuilder response = Response.ok((Object) attachment);
    return response.build();
  }
}
