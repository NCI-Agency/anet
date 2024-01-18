package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

public class AuthorizationGroupSearchQuery
    extends SubscribableObjectSearchQuery<AuthorizationGroupSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private String positionUuid;

  public AuthorizationGroupSearchQuery() {
    super(AuthorizationGroupSearchSortBy.NAME);
  }

  public String getPositionUuid() {
    return positionUuid;
  }

  public void setPositionUuid(String positionUuid) {
    this.positionUuid = positionUuid;
  }

  @Override
  public AuthorizationGroupSearchQuery clone() throws CloneNotSupportedException {
    return (AuthorizationGroupSearchQuery) super.clone();
  }

}
