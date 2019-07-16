package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.search.FkBatchParams;
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
  @GraphQLIgnore
  public static final String DUMMY_ORG_UUID = "-1";

  public static enum OrganizationStatus {
    ACTIVE, INACTIVE
  }

  public static enum OrganizationType {
    ADVISOR_ORG, PRINCIPAL_ORG
  }

  String shortName;
  String longName;
  private OrganizationStatus status;
  private String identificationCode;
  private ForeignObjectHolder<Organization> parentOrg = new ForeignObjectHolder<>();
  OrganizationType type;

  /* The following are all Lazy Loaded */
  List<Position> positions; /* Positions in this Org */
  List<ApprovalStep> approvalSteps; /* Approval process for this Org */
  List<Organization> childrenOrgs; /* Immediate children */
  List<Organization> descendants; /* All descendants (children of children..) */
  List<Task> tasks;

  @GraphQLQuery(name = "shortName")
  public String getShortName() {
    return shortName;
  }

  public void setShortName(String shortName) {
    this.shortName = Utils.trimStringReturnNull(shortName);
  }

  @GraphQLQuery(name = "longName")
  public String getLongName() {
    return longName;
  }

  public void setLongName(String longName) {
    this.longName = Utils.trimStringReturnNull(longName);
  }

  @GraphQLQuery(name = "status")
  public OrganizationStatus getStatus() {
    return status;
  }

  public void setStatus(OrganizationStatus status) {
    this.status = status;
  }

  @GraphQLQuery(name = "identificationCode")
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
  @GraphQLIgnore
  public void setParentOrgUuid(String parentOrgUuid) {
    this.parentOrg = new ForeignObjectHolder<>(parentOrgUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getParentOrgUuid() {
    return parentOrg.getForeignUuid();
  }

  @GraphQLIgnore
  public Organization getParentOrg() {
    return parentOrg.getForeignObject();
  }

  public void setParentOrg(Organization parentOrg) {
    this.parentOrg = new ForeignObjectHolder<>(parentOrg);
  }

  @GraphQLQuery(name = "type")
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
    if (positions != null) {
      return CompletableFuture.completedFuture(positions);
    }
    if (query == null) {
      query = new PositionSearchQuery();
      query.setPageSize(0);
    }
    // Note: no recursion, only direct children!
    query.setBatchParams(
        new FkBatchParams<Position, PositionSearchQuery>("positions", "\"organizationUuid\""));
    return AnetObjectEngine.getInstance().getPositionDao()
        .getPositionsBySearch(context, uuid, query).thenApply(o -> {
          positions = o;
          return o;
        });
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

  @GraphQLIgnore
  public List<ApprovalStep> getApprovalSteps() {
    return approvalSteps;
  }

  public void setApprovalSteps(List<ApprovalStep> steps) {
    this.approvalSteps = steps;
  }

  @GraphQLQuery(name = "childrenOrgs")
  public CompletableFuture<List<Organization>> loadChildrenOrgs(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    if (childrenOrgs != null) {
      return CompletableFuture.completedFuture(childrenOrgs);
    }
    if (query == null) {
      query = new OrganizationSearchQuery();
      query.setPageSize(0);
    }
    // Note: no recursion, only direct children!
    query.setBatchParams(new FkBatchParams<Organization, OrganizationSearchQuery>("organizations",
        "\"parentOrgUuid\""));
    return AnetObjectEngine.getInstance().getOrganizationDao()
        .getOrganizationsBySearch(context, uuid, query).thenApply(o -> {
          childrenOrgs = o;
          return o;
        });
  }

  @GraphQLQuery(name = "descendantOrgs")
  public CompletableFuture<List<Organization>> loadDescendantOrgs(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    if (descendants != null) {
      return CompletableFuture.completedFuture(descendants);
    }
    if (query == null) {
      query = new OrganizationSearchQuery();
      query.setPageSize(0);
    }
    // Note: recursion, includes transitive children!
    query.setBatchParams(new RecursiveFkBatchParams<Organization, OrganizationSearchQuery>(
        "organizations", "\"parentOrgUuid\"", "organizations", "\"parentOrgUuid\""));
    return AnetObjectEngine.getInstance().getOrganizationDao()
        .getOrganizationsBySearch(context, uuid, query).thenApply(o -> {
          descendants = o;
          return o;
        });
  }

  @GraphQLQuery(name = "tasks")
  public CompletableFuture<List<Task>> loadTasks(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") TaskSearchQuery query) {
    if (tasks != null) {
      return CompletableFuture.completedFuture(tasks);
    }
    if (query == null) {
      query = new TaskSearchQuery();
      query.setPageSize(0);
    }
    // Note: no recursion, only direct children!
    query.setBatchParams(new FkBatchParams<Task, TaskSearchQuery>("tasks", "\"organizationUuid\""));
    return AnetObjectEngine.getInstance().getTaskDao().getTasksBySearch(context, uuid, query)
        .thenApply(o -> {
          tasks = o;
          return o;
        });
  }

  @GraphQLIgnore
  public List<Task> getTasks() {
    return tasks;
  }

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
