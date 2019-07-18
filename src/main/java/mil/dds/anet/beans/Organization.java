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
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.PositionSearchQuery;
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

  // TODO: batch load? (used in organizations/Show.js)
  @GraphQLQuery(name = "positions")
  public synchronized List<Position> loadPositions() {
    if (positions == null) {
      final PositionSearchQuery query = new PositionSearchQuery();
      query.setPageSize(0);
      query.setOrganizationUuid(uuid);
      positions = AnetObjectEngine.getInstance().getPositionDao().search(query).getList();
    }
    return positions;
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

  // TODO: batch load? (used in organizations/Show.js)
  @GraphQLQuery(name = "childrenOrgs")
  public synchronized List<Organization> loadChildrenOrgs(
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    if (childrenOrgs == null) {
      query.setParentOrgUuid(uuid);
      query.setParentOrgRecursively(false);
      childrenOrgs = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
    }
    return childrenOrgs;
  }

  // TODO: batch load? (used in App.js for me → position → organization)
  @GraphQLQuery(name = "descendantOrgs")
  public synchronized List<Organization> loadDescendantOrgs(
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    if (descendants == null) {
      query.setParentOrgUuid(uuid);
      query.setParentOrgRecursively(true);
      descendants = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
    }
    return descendants;
  }

  // TODO: batch load? (used in organizations/Edit.js)
  @GraphQLQuery(name = "tasks")
  public synchronized List<Task> loadTasks() {
    if (tasks == null) {
      final TaskSearchQuery query = new TaskSearchQuery();
      query.setPageSize(0);
      query.setResponsibleOrgUuid(uuid);
      tasks = AnetObjectEngine.getInstance().getTaskDao().search(query).getList();
    }
    return tasks;
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
