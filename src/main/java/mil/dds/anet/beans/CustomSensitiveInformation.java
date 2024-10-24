package mil.dds.anet.beans;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class CustomSensitiveInformation extends AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  private String customFieldName;
  @GraphQLQuery
  @GraphQLInputField
  private String customFieldValue;
  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectType;
  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectUuid;
  // annotated below
  private RelatableObject relatedObject;

  public String getCustomFieldName() {
    return customFieldName;
  }

  public void setCustomFieldName(String customFieldName) {
    this.customFieldName = customFieldName;
  }

  public String getCustomFieldValue() {
    return customFieldValue;
  }

  public void setCustomFieldValue(String customFieldValue) {
    this.customFieldValue = customFieldValue;
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

  @GraphQLQuery(name = "relatedObject")
  public CompletableFuture<RelatableObject> loadRelatedObject(
      @GraphQLRootContext GraphQLContext context) {
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
    return String.format("[uuid:%s customFieldName:%s relatedObjectType:%s relatedObjectUuid:%s]",
        uuid, customFieldName, relatedObjectType, relatedObjectUuid);
  }

}
