package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class ApprovalStep extends AbstractAnetBean {

  List<Position> approvers;
  String nextStepUuid;
  String advisorOrganizationUuid;
  String name;

  @GraphQLQuery(name = "approvers")
  public CompletableFuture<List<Position>> loadApprovers(
      @GraphQLRootContext Map<String, Object> context) {
    if (approvers != null) {
      return CompletableFuture.completedFuture(approvers);
    }
    return AnetObjectEngine.getInstance().getApprovalStepDao().getApproversForStep(context, uuid)
        .thenApply(o -> {
          approvers = o;
          return o;
        });
  }

  @GraphQLIgnore
  public List<Position> getApprovers() {
    return approvers;
  }

  public void setApprovers(List<Position> approvers) {
    this.approvers = approvers;
  }

  @GraphQLQuery(name = "nextStepUuid")
  public String getNextStepUuid() {
    return nextStepUuid;
  }

  public void setNextStepUuid(String nextStepUuid) {
    this.nextStepUuid = nextStepUuid;
  }

  @GraphQLQuery(name = "advisorOrganizationUuid")
  public String getAdvisorOrganizationUuid() {
    return advisorOrganizationUuid;
  }

  public void setAdvisorOrganizationUuid(String advisorOrganizationUuid) {
    this.advisorOrganizationUuid = advisorOrganizationUuid;
  }

  @GraphQLQuery(name = "name")
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || o.getClass() != this.getClass()) {
      return false;
    }
    ApprovalStep as = (ApprovalStep) o;
    return Objects.equals(uuid, as.getUuid()) && Objects.equals(name, as.getName())
        && Objects.equals(nextStepUuid, as.getNextStepUuid())
        && Objects.equals(advisorOrganizationUuid, as.getAdvisorOrganizationUuid());
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, approvers, name, nextStepUuid, advisorOrganizationUuid);
  }

  @Override
  public String toString() {
    return String.format("%s - %s, aoid: %s, nsid: %s", uuid, name, advisorOrganizationUuid,
        nextStepUuid);
  }

}
