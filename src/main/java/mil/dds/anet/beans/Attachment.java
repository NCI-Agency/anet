package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Attachment extends AbstractAnetBean {

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

  // annotated below
  private AttachmentClassification classification;

  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectType;

  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectUuid;

  // annotated below
  private RelatableObject relatedObject;

  public byte[] getContent() {
    return content;
  }

  public void setContent(byte[] content) {
    this.content = content;
  }

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
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

  public String getRelatedObjectType() {
    return relatedObjectType;
  }

  public void setRelatedObjectType(String relatedObjectType) {
    this.relatedObjectType = relatedObjectType;
  }

  public String getRelatedObjectUuid() {
    return relatedObjectUuid;
  }

  public void setRelatedObjectUuid(String relatedObjectUuid) {
    this.relatedObjectUuid = relatedObjectUuid;
  }

  @GraphQLQuery(name = "classification")
  public CompletableFuture<AttachmentClassification> loadAttachmentClassification(
      @GraphQLRootContext Map<String, Object> context) {
    if (classification != null) {
      return CompletableFuture.completedFuture(classification);
    }
    return new UuidFetcher<AbstractAnetBean>()
        .load(context, IdDataLoaderKey.ATTACHMENT_CLASSIFICATION, classificationUuid)
        .thenApply(o -> {
          classification = (AttachmentClassification) o;
          return classification;
        });
  }

  @GraphQLQuery(name = "relatedObject")
  public CompletableFuture<RelatableObject> loadRelatedObject(
      @GraphQLRootContext Map<String, Object> context) {
    if (relatedObject != null) {
      return CompletableFuture.completedFuture(relatedObject);
    }
    return new UuidFetcher<AbstractAnetBean>()
        .load(context, IdDataLoaderKey.valueOfTableName(relatedObjectType), relatedObjectUuid)
        .thenApply(o -> {
          relatedObject = (RelatableObject) o;
          return relatedObject;
        });
  }

  @Override
  public String toString() {
    return String.format(
        "[uuid:%s fileName:%s mime:%s description:%s relatedObjectType:%s relatedObjectUuid:%s]",
        uuid, fileName, mimeType, description, relatedObjectType, relatedObjectUuid);
  }
}
