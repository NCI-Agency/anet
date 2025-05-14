package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

public class AuthorizationGroupSearchQuery
    extends SubscribableObjectSearchQuery<AuthorizationGroupSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private Boolean distributionList;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean forSensitiveInformation;

  public AuthorizationGroupSearchQuery() {
    super(AuthorizationGroupSearchSortBy.NAME);
  }

  public Boolean getDistributionList() {
    return distributionList;
  }

  public void setDistributionList(Boolean distributionList) {
    this.distributionList = distributionList;
  }

  public Boolean getForSensitiveInformation() {
    return forSensitiveInformation;
  }

  public void setForSensitiveInformation(Boolean forSensitiveInformation) {
    this.forSensitiveInformation = forSensitiveInformation;
  }

  @Override
  public AuthorizationGroupSearchQuery clone() throws CloneNotSupportedException {
    return (AuthorizationGroupSearchQuery) super.clone();
  }

}
