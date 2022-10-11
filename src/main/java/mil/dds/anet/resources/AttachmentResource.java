package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.FileUpload;
import mil.dds.anet.beans.Report;
import mil.dds.anet.database.AttachmentDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AttachmentResource {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AnetObjectEngine engine;

  public AttachmentResource(AnetObjectEngine engine) {
    this.engine = engine;
  }

  // @Consumes(MediaType.MULTIPART_FORM_DATA)
  @GraphQLMutation(name = "uploadFile")
  public boolean fileUpload(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "file") Attachment attachment) {
    // get byte[] from fileUpload.getContent();
    AttachmentDao dao = new AttachmentDao();
    dao.insert(attachment);
    // Use Attachment.dao to persist the data received from fileUpload into the database
    return true;
  }
}
