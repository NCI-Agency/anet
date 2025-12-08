package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;

public class EngagementsBetweenCommunitiesSearchQuery {
  @GraphQLQuery
  @GraphQLInputField
  private String advisorAuthorizationGroupUuid;
  @GraphQLQuery
  @GraphQLInputField
  private String interlocutorAuthorizationGroupUuid;
  @GraphQLQuery
  @GraphQLInputField
  private boolean plannedEngagements;

  public String getAdvisorAuthorizationGroupUuid() {
    return advisorAuthorizationGroupUuid;
  }

  public void setAdvisorAuthorizationGroupUuid(String advisorAuthorizationGroupUuid) {
    this.advisorAuthorizationGroupUuid = advisorAuthorizationGroupUuid;
  }

  public String getInterlocutorAuthorizationGroupUuid() {
    return interlocutorAuthorizationGroupUuid;
  }

  public void setInterlocutorAuthorizationGroupUuid(String interlocutorAuthorizationGroupUuid) {
    this.interlocutorAuthorizationGroupUuid = interlocutorAuthorizationGroupUuid;
  }

  public boolean getPlannedEngagements() {
    return plannedEngagements;
  }

  public void setPlannedEngagements(boolean plannedEngagements) {
    this.plannedEngagements = plannedEngagements;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), advisorAuthorizationGroupUuid,
        interlocutorAuthorizationGroupUuid);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof EngagementsBetweenCommunitiesSearchQuery other)) {
      return false;
    }
    return super.equals(obj)
        && Objects.equals(getAdvisorAuthorizationGroupUuid(),
            other.getAdvisorAuthorizationGroupUuid())
        && Objects.equals(getInterlocutorAuthorizationGroupUuid(),
            other.getInterlocutorAuthorizationGroupUuid());
  }

  @Override
  public EngagementsBetweenCommunitiesSearchQuery clone() throws CloneNotSupportedException {
    return (EngagementsBetweenCommunitiesSearchQuery) super.clone();
  }
}
