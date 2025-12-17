package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.beans.AuditTrail;

public class AuditTrailSearchQuery extends AbstractSearchQuery<AuditTrailSearchSortBy> {
  @GraphQLQuery
  @GraphQLInputField
  private AuditTrail.AuditTrailUpdateType updateType;
  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectUuid;
  @GraphQLQuery
  @GraphQLInputField
  private String personUuid;

  public AuditTrailSearchQuery() {
    super(AuditTrailSearchSortBy.CREATED_AT);
    setSortOrder(SortOrder.DESC);
  }

  public AuditTrail.AuditTrailUpdateType getUpdateType() {
    return updateType;
  }

  public void setUpdateType(AuditTrail.AuditTrailUpdateType updateType) {
    this.updateType = updateType;
  }

  public String getRelatedObjectUuid() {
    return relatedObjectUuid;
  }

  public void setRelatedObjectUuid(String relatedObjectUuid) {
    this.relatedObjectUuid = relatedObjectUuid;
  }

  public String getPersonUuid() {
    return personUuid;
  }

  public void setPersonUuid(String personUuid) {
    this.personUuid = personUuid;
  }
}
