package mil.dds.anet.beans;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
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
  // annotated below
  private Boolean restrictedApproval;

  @GraphQLQuery(name = "approvers")
  public CompletableFuture<List<Position>> loadApprovers(
      @GraphQLRootContext GraphQLContext context) {
    if (approvers != null) {
      return CompletableFuture.completedFuture(approvers);
    }
    return engine().getApprovalStepDao().getApproversForStep(context, uuid).thenApply(o -> {
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

  @GraphQLQuery
  public boolean isRestrictedApproval() {
    return Boolean.TRUE.equals(restrictedApproval);
  }

  @GraphQLInputField
  public void setRestrictedApproval(Boolean restrictedApproval) {
    this.restrictedApproval = restrictedApproval;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof ApprovalStep)) {
      return false;
    }
    ApprovalStep as = (ApprovalStep) o;
    return Objects.equals(getUuid(), as.getUuid()) && Objects.equals(getName(), as.getName())
        && Objects.equals(getNextStepUuid(), as.getNextStepUuid())
        && Objects.equals(getType(), as.getType())
        && Objects.equals(getRelatedObjectUuid(), as.getRelatedObjectUuid())
        && Objects.equals(isRestrictedApproval(), as.isRestrictedApproval());
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, approvers, name, nextStepUuid, relatedObjectUuid, type,
        restrictedApproval);
  }

  @Override
  public String toString() {
    return String.format("%s - %s, aoid: %s, nsid: %s", uuid, name, relatedObjectUuid,
        nextStepUuid);
  }

  @Override
  protected ApprovalStep clone() {
    final ApprovalStep clone = new ApprovalStep();
    clone.setUuid(uuid);
    clone.setName(name);
    clone.setNextStepUuid(nextStepUuid);
    clone.setType(type);
    clone.setRelatedObjectUuid(relatedObjectUuid);
    clone.setRestrictedApproval(restrictedApproval);
    clone.setCreatedAt(createdAt);
    clone.setUpdatedAt(updatedAt);
    return clone;
  }

  public static boolean isPlanningStep(ApprovalStep step) {
    return step != null && ApprovalStepType.PLANNING_APPROVAL.equals(step.getType());
  }

}
