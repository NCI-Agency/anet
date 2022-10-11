package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Attachment extends AbstractAnetBean {

  private List<AttachmentRelatedObject> attachmentRelatedObjects;





  @GraphQLQuery(name = "attachmentRelatedObject")
  public CompletableFuture<List<AttachmentRelatedObject>> loadRelatedObject(
      @GraphQLRootContext Map<String, Object> context) {
    if (attachmentRelatedObjects != null) {
      return CompletableFuture.completedFuture(attachmentRelatedObjects);
    }
    return AnetObjectEngine.getInstance().getNoteDao().getRelatedObjects(context, this)
            .thenApply(o -> {
              attachmentRelatedObjects = o;
              return o;
            });
  }

  @Override
  public String toString() {
    return String.format(
        "[uuid:%s fileName:%s mime:%s description:%s relatedObjectType:%s relatedObjectUuid:%s]",
        uuid, fileName, mimeType, description, relatedObjectType, relatedObjectUuid);
  }
}
