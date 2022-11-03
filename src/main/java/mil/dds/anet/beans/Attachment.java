package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.views.AbstractAnetBean;

public class Attachment extends AbstractAnetBean {

  public static enum Classification {
    NATO_UNCLASSIFIED, NATO_UNCLASSIFIED_Releasable_to_EU
  }

  @GraphQLQuery
  @GraphQLInputField
  private String mimeType;

  @GraphQLQuery
  @GraphQLInputField
  private byte[] content;

  @GraphQLQuery
  @GraphQLInputField
  private String fileName;

  @GraphQLQuery
  @GraphQLInputField
  private String description;

  @GraphQLQuery
  @GraphQLInputField
  private String classificationUuid;

  @GraphQLQuery
  @GraphQLInputField
  private Classification classification;

  // annotated below
  private List<AttachmentRelatedObject> attachmentRelatedObjects;

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public byte[] getContent() {
    return content;
  }

  public void setContent(byte[] content) {
    this.content = content;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getClassificationUuid() {
    return classificationUuid;
  }

  public void setClassificationUuid(String classificationUuid) {
    this.classificationUuid = classificationUuid;
  }

  public void setClassification(Classification classification) {
    this.classification = classification;
  }

  public Classification getClassification() {
    return classification;
  }

  @GraphQLQuery(name = "attachmentRelatedObject")
  public CompletableFuture<List<AttachmentRelatedObject>> loadAttachmentRelatedObjects(
      @GraphQLRootContext Map<String, Object> context) {
    if (attachmentRelatedObjects != null) {
      return CompletableFuture.completedFuture(attachmentRelatedObjects);
    }
    return AnetObjectEngine.getInstance().getAttachmentDao().getRelatedObjects(context, this)
        .thenApply(o -> {
          attachmentRelatedObjects = o;
          return o;
        });
  }

  public List<AttachmentRelatedObject> getAttachmentRelatedObjects() {
    return attachmentRelatedObjects;
  }

  @GraphQLInputField(name = "attachmentRelatedObjects")
  public void setAttachmentRelatedObjects(List<AttachmentRelatedObject> attachmentRelatedObjects) {
    this.attachmentRelatedObjects = attachmentRelatedObjects;
  }

  @Override
  public String toString() {
    return attachmentRelatedObjects.toString();
  }

}
