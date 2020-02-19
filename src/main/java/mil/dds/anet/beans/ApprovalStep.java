package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
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

  public static enum ApprovalStepType {
    PLANNING_APPROVAL, REPORT_APPROVAL
  }

  @GraphQLQuery
  @GraphQLInputField
  ApprovalStepType type;
  // annotated below
  List<Position> approvers;
  @GraphQLQuery
  @GraphQLInputField
  String nextStepUuid;
  @GraphQLQuery
  @GraphQLInputField
  String relatedObjectUuid;
  @GraphQLQuery
  @GraphQLInputField
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

  public List<Position> getApprovers() {
    return approvers;
  }

  @GraphQLInputField(name = "approvers")
  public void setApprovers(List<Position> approvers) {
    this.approvers = approvers;
  }

  public String getNextStepUuid() {
    return nextStepUuid;
  }

  public void setNextStepUuid(String nextStepUuid) {
    this.nextStepUuid = nextStepUuid;
  }

  public String getRelatedObjectUuid() {
    return relatedObjectUuid;
  }

  public void setRelatedObjectUuid(String relatedObjectUuid) {
    this.relatedObjectUuid = relatedObjectUuid;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  public ApprovalStepType getType() {
    return type;
  }

  public void setType(ApprovalStepType type) {
    this.type = type;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof ApprovalStep)) {
      return false;
    }
    ApprovalStep as = (ApprovalStep) o;
    return Objects.equals(uuid, as.getUuid()) && Objects.equals(name, as.getName())
        && Objects.equals(nextStepUuid, as.getNextStepUuid()) && Objects.equals(type, as.getType())
        && Objects.equals(relatedObjectUuid, as.getRelatedObjectUuid());
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, approvers, name, nextStepUuid, relatedObjectUuid, type);
  }

  @Override
  public String toString() {
    return String.format("%s - %s, aoid: %s, nsid: %s", uuid, name, relatedObjectUuid,
        nextStepUuid);
  }

}
