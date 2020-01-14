package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.search.FkBatchParams;
import mil.dds.anet.beans.search.M2mBatchParams;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.beans.search.RecursiveFkBatchParams;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Organization extends AbstractAnetBean {

  /** Pseudo uuid to represent all/top-level organization(s). */
  public static final String DUMMY_ORG_UUID = "-1";

  public static enum OrganizationStatus {
    ACTIVE, INACTIVE
  }

  public static enum OrganizationType {
    ADVISOR_ORG, PRINCIPAL_ORG
  }

  @GraphQLQuery
  @GraphQLInputField
  String shortName;
  @GraphQLQuery
  @GraphQLInputField
  String longName;
  @GraphQLQuery
  @GraphQLInputField
  private OrganizationStatus status;
  @GraphQLQuery
  @GraphQLInputField
  private String identificationCode;
  // annotated below
  private ForeignObjectHolder<Organization> parentOrg = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  OrganizationType type;

  /* The following are all Lazy Loaded */
  // annotated below
  List<ApprovalStep> planningApprovalSteps; /* Planning approval process for this Org */
  // annotated below
  List<ApprovalStep> approvalSteps; /* Approval process for this Org */
  // annotated below
  List<Task> tasks;

  public String getShortName() {
    return shortName;
  }

  public void setShortName(String shortName) {
    this.shortName = Utils.trimStringReturnNull(shortName);
  }

  public String getLongName() {
    return longName;
  }

  public void setLongName(String longName) {
    this.longName = Utils.trimStringReturnNull(longName);
  }

  public OrganizationStatus getStatus() {
    return status;
  }

  public void setStatus(OrganizationStatus status) {
    this.status = status;
  }

  public String getIdentificationCode() {
    return identificationCode;
  }

  public void setIdentificationCode(String identificationCode) {
    this.identificationCode = Utils.trimStringReturnNull(identificationCode);
  }

  @GraphQLQuery(name = "parentOrg")
  public CompletableFuture<Organization> loadParentOrg(
      @GraphQLRootContext Map<String, Object> context) {
    if (parentOrg.hasForeignObject()) {
      return CompletableFuture.completedFuture(parentOrg.getForeignObject());
    }
    return new UuidFetcher<Organization>()
        .load(context, IdDataLoaderKey.ORGANIZATIONS, parentOrg.getForeignUuid()).thenApply(o -> {
          parentOrg.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setParentOrgUuid(String parentOrgUuid) {
    this.parentOrg = new ForeignObjectHolder<>(parentOrgUuid);
  }

  @JsonIgnore
  public String getParentOrgUuid() {
    return parentOrg.getForeignUuid();
  }

  public Organization getParentOrg() {
    return parentOrg.getForeignObject();
  }

  @GraphQLInputField(name = "parentOrg")
  public void setParentOrg(Organization parentOrg) {
    this.parentOrg = new ForeignObjectHolder<>(parentOrg);
  }

  public OrganizationType getType() {
    return type;
  }

  public void setType(OrganizationType type) {
    this.type = type;
  }

  @GraphQLQuery(name = "positions")
  public CompletableFuture<List<Position>> loadPositions(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") PositionSearchQuery query) {
    if (query == null) {
      query = new PositionSearchQuery();
    }
    // Note: no recursion, only direct children!
    query.setBatchParams(
        new FkBatchParams<Position, PositionSearchQuery>("positions", "\"organizationUuid\""));
    return AnetObjectEngine.getInstance().getPositionDao().getPositionsBySearch(context, uuid,
        query);
  }

  @GraphQLQuery(name = "planningApprovalSteps")
  public CompletableFuture<List<ApprovalStep>> loadPlanningApprovalSteps(
      @GraphQLRootContext Map<String, Object> context) {
    if (planningApprovalSteps != null) {
      return CompletableFuture.completedFuture(planningApprovalSteps);
    }
    return AnetObjectEngine.getInstance().getPlanningApprovalStepsForOrg(context, uuid)
        .thenApply(o -> {
          planningApprovalSteps = o;
          return o;
        });
  }

  public List<ApprovalStep> getPlanningApprovalSteps() {
    return planningApprovalSteps;
  }

  @GraphQLInputField(name = "planningApprovalSteps")
  public void setPlanningApprovalSteps(List<ApprovalStep> steps) {
    this.planningApprovalSteps = steps;
  }

  @GraphQLQuery(name = "approvalSteps")
  public CompletableFuture<List<ApprovalStep>> loadApprovalSteps(
      @GraphQLRootContext Map<String, Object> context) {
    if (approvalSteps != null) {
      return CompletableFuture.completedFuture(approvalSteps);
    }
    return AnetObjectEngine.getInstance().getApprovalStepsForOrg(context, uuid).thenApply(o -> {
      approvalSteps = o;
      return o;
    });
  }

  public List<ApprovalStep> getApprovalSteps() {
    return approvalSteps;
  }

  @GraphQLInputField(name = "approvalSteps")
  public void setApprovalSteps(List<ApprovalStep> steps) {
    this.approvalSteps = steps;
  }

  @GraphQLQuery(name = "childrenOrgs")
  public CompletableFuture<List<Organization>> loadChildrenOrgs(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    if (query == null) {
      query = new OrganizationSearchQuery();
    }
    // Note: no recursion, only direct children!
    query.setBatchParams(new FkBatchParams<Organization, OrganizationSearchQuery>("organizations",
        "\"parentOrgUuid\""));
    return AnetObjectEngine.getInstance().getOrganizationDao().getOrganizationsBySearch(context,
        uuid, query);
  }

  @GraphQLQuery(name = "descendantOrgs")
  public CompletableFuture<List<Organization>> loadDescendantOrgs(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    if (query == null) {
      query = new OrganizationSearchQuery();
    }
    // Note: recursion, includes transitive children!
    query.setBatchParams(new RecursiveFkBatchParams<Organization, OrganizationSearchQuery>(
        "organizations", "\"parentOrgUuid\"", "organizations", "\"parentOrgUuid\""));
    return AnetObjectEngine.getInstance().getOrganizationDao().getOrganizationsBySearch(context,
        uuid, query);
  }


  @GraphQLQuery(name = "tasks")
  public CompletableFuture<List<Task>> loadTasks(@GraphQLRootContext Map<String, Object> context) {
    if (tasks != null) {
      return CompletableFuture.completedFuture(tasks);
    }
    final TaskSearchQuery query = new TaskSearchQuery();
    query.setBatchParams(new M2mBatchParams<Task, TaskSearchQuery>("tasks",
        "\"taskTaskedOrganizations\"", "\"organizationUuid\"", "\"taskUuid\""));
    return AnetObjectEngine.getInstance().getTaskDao().getTasksBySearch(context, uuid, query)
        .thenApply(o -> {
          tasks = o;
          return o;
        });
  }

  public List<Task> getTasks() {
    return tasks;
  }

  @GraphQLInputField(name = "tasks")
  public void setTasks(List<Task> tasks) {
    this.tasks = tasks;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Organization)) {
      return false;
    }
    Organization other = (Organization) o;
    return Objects.equals(other.getUuid(), uuid) && Objects.equals(other.getShortName(), shortName)
        && Objects.equals(other.getLongName(), longName)
        && Objects.equals(other.getStatus(), status)
        && Objects.equals(other.getIdentificationCode(), identificationCode)
        && Objects.equals(other.getType(), type);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, shortName, longName, status, identificationCode, type, createdAt,
        updatedAt);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s shortName:%s longName:%s identificationCode:%s type:%s]", uuid,
        shortName, longName, identificationCode, type);
  }
}
