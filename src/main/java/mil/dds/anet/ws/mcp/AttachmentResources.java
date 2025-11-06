package mil.dds.anet.ws.mcp;

import io.modelcontextprotocol.spec.McpSchema;
import java.io.ByteArrayOutputStream;
import java.lang.invoke.MethodHandles;
import java.util.Base64;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.resources.GraphQLResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springaicommunity.mcp.annotation.McpResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AttachmentResources {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());


  private final GraphQLResource graphQLResource;
  private final AttachmentDao attachmentDao;

  public AttachmentResources(GraphQLResource graphQLResource, AttachmentDao attachmentDao) {
    logger.info("Constructing EngagementResources");
    this.graphQLResource = graphQLResource;
    this.attachmentDao = attachmentDao;
  }

  /**
   * Retrieves an engagement report by UUID and exposes it as an MCP resource.
   */
  @McpResource(name = "attachment", description = "Access attachments (mostly images and PDFs)",
      uri = "anet:attachment:{uuid}")
  public McpSchema.ResourceContents getAttachment(String uuid) {
    logger.info("MCP/resources anet:attachment:{}", uuid);

    final Attachment attachment = this.attachmentDao.getByUuid(uuid);
    if (attachment == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
    }

    final var baos = new ByteArrayOutputStream();
    this.attachmentDao.streamContentBlob(uuid, baos);
    final String base64Content = Base64.getEncoder().encodeToString(baos.toByteArray());

    return new McpSchema.TextResourceContents("anet:attachment:" + uuid, attachment.getMimeType(),
        base64Content);
  }
}
