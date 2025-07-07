package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.views.AbstractAnetBean;

public class User extends AbstractAnetBean {
  @GraphQLQuery
  @GraphQLInputField
  private String domainUsername;
  // Not exposed through GraphQL
  private String personUuid;

  @AllowUnverifiedUsers
  public String getDomainUsername() {
    return domainUsername;
  }

  public void setDomainUsername(String domainUsername) {
    this.domainUsername = domainUsername;
  }

  public String getPersonUuid() {
    return personUuid;
  }

  public void setPersonUuid(String personUuid) {
    this.personUuid = personUuid;
  }
}
