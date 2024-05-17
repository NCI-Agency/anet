package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

public class AttachmentSearchQuery extends SubscribableObjectSearchQuery<AttachmentSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private String mimeType;
  @GraphQLQuery
  @GraphQLInputField
  private String classification;
  @GraphQLQuery
  @GraphQLInputField
  private String authorUuid;

  public AttachmentSearchQuery() {
    super(AttachmentSearchSortBy.CREATED_AT);
    this.setSortOrder(SortOrder.DESC);
  }

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public void setClassification(String classification) {
    this.classification = classification;
  }

  public String getClassification() {
    return classification;
  }

  public String getAuthorUuid() {
    return authorUuid;
  }

  public void setAuthorUuid(String authorUuid) {
    this.authorUuid = authorUuid;
  }

  @Override
  public AttachmentSearchQuery clone() throws CloneNotSupportedException {
    return (AttachmentSearchQuery) super.clone();
  }
}
