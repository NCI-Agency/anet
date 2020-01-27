package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

public class RollupGraph {

  @GraphQLQuery
  @GraphQLInputField
  Organization org;
  @GraphQLQuery
  @GraphQLInputField
  int published;
  @GraphQLQuery
  @GraphQLInputField
  int cancelled;

  public Organization getOrg() {
    return org;
  }

  public void setOrg(Organization org) {
    this.org = org;
  }

  public int getPublished() {
    return published;
  }

  public void setPublished(int published) {
    this.published = published;
  }

  public int getCancelled() {
    return cancelled;
  }

  public void setCancelled(int cancelled) {
    this.cancelled = cancelled;
  }

}
