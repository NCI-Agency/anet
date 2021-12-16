package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.FileUpload;
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
      @GraphQLArgument(name = "file") FileUpload fileUpload) {
    // get byte[] from fileUpload.getContent();
    // Use Attachment.dao to persist the data received from fileUpload into the database
    return true;
  }
}
