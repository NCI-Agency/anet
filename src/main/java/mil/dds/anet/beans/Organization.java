package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.search.FkBatchParams;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.M2mBatchParams;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.beans.search.RecursiveFkBatchParams;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.graphql.RestrictToAuthorizationGroups;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractEmailableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Organization extends AbstractEmailableAnetBean
    implements RelatableObject, SubscribableObject, WithStatus {

  /** Pseudo uuid to represent all/top-level organization(s). */
  public static final String DUMMY_ORG_UUID = "-1";

  @GraphQLQuery
  @GraphQLInputField
  String shortName;
  @GraphQLQuery
  @GraphQLInputField
  String longName;
  @GraphQLQuery
  @GraphQLInputField
  private Status status;
  @GraphQLQuery
  @GraphQLInputField
  private String identificationCode;
  @GraphQLQuery
  @GraphQLInputField
  private String profile;
  @GraphQLQuery
  @GraphQLInputField
  private String app6context;
  @GraphQLQuery
  @GraphQLInputField
  private String app6standardIdentity;
  @GraphQLQuery
  @GraphQLInputField
  private String app6symbolSet;
  @GraphQLQuery
  @GraphQLInputField
  private String app6hq;
  @GraphQLQuery
  @GraphQLInputField
  private String app6amplifier;
  // annotated below
  private ForeignObjectHolder<Organization> parentOrg = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Location> location = new ForeignObjectHolder<>();
  /* The following are all Lazy Loaded */
  // annotated below
  List<ApprovalStep> planningApprovalSteps; /* Planning approval process for this Org */
  // annotated below
  List<ApprovalStep> approvalSteps; /* Approval process for this Org */
  // annotated below
  List<Task> tasks;
  // annotated below
  List<Position> administratingPositions;
  // annotated below
  private List<AuthorizationGroup> authorizationGroups;
  // annotated below
  private EntityAvatar entityAvatar;

  @GraphQLQuery(name = "location")
  public CompletableFuture<Location> loadLocation(@GraphQLRootContext Map<String, Object> context) {
    if (location.hasForeignObject()) {
      return CompletableFuture.completedFuture(location.getForeignObject());
    }
    return new UuidFetcher<Location>()
        .load(context, IdDataLoaderKey.LOCATIONS, location.getForeignUuid()).thenApply(o -> {
          location.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setLocationUuid(String locationUuid) {
    this.location = new ForeignObjectHolder<>(locationUuid);
  }

  @JsonIgnore
  public String getLocationUuid() {
    return location.getForeignUuid();
  }

  @GraphQLInputField(name = "location")
  public void setLocation(Location location) {
    this.location = new ForeignObjectHolder<>(location);
  }

  public Location getLocation() {
    return location.getForeignObject();
  }

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

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  public String getIdentificationCode() {
    return identificationCode;
  }

  public void setIdentificationCode(String identificationCode) {
    this.identificationCode = Utils.trimStringReturnNull(identificationCode);
  }

  public String getProfile() {
    return profile;
  }

  public void setProfile(String profile) {
    this.profile = Utils.trimStringReturnNull(profile);
  }

  public String getApp6context() {
    return app6context;
  }

  public void setApp6context(String app6context) {
    this.app6context = app6context;
  }

  public String getApp6standardIdentity() {
    return app6standardIdentity;
  }

  public void setApp6standardIdentity(String app6standardIdentity) {
    this.app6standardIdentity = app6standardIdentity;
  }

  public String getApp6symbolSet() {
    return app6symbolSet;
  }

  public void setApp6symbolSet(String app6symbolSet) {
    this.app6symbolSet = app6symbolSet;
  }

  public String getApp6hq() {
    return app6hq;
  }

  public void setApp6hq(String app6hq) {
    this.app6hq = app6hq;
  }

  public String getApp6amplifier() {
    return app6amplifier;
  }

  public void setApp6amplifier(String app6amplifier) {
    this.app6amplifier = app6amplifier;
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

  @GraphQLQuery(name = "entityAvatar")
  public EntityAvatar loadEntityAvatar(@GraphQLRootContext Map<String, Object> context) {
    if (entityAvatar == null) {
      entityAvatar = AnetObjectEngine.getInstance().getEntityAvatarDao()
          .getByRelatedObject(OrganizationDao.TABLE_NAME, uuid).orElse(null);
    }
    return entityAvatar;
  }

  @GraphQLInputField(name = "entityAvatar")
  public void setEntityAvatar(EntityAvatar entityAvatar) {
    this.entityAvatar = entityAvatar;
  }

  public EntityAvatar getEntityAvatar() {
    return this.entityAvatar;
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
    return AnetObjectEngine.getInstance().getPlanningApprovalStepsForRelatedObject(context, uuid)
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
    return AnetObjectEngine.getInstance().getApprovalStepsForRelatedObject(context, uuid)
        .thenApply(o -> {
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
    query.setBatchParams(
        new RecursiveFkBatchParams<Organization, OrganizationSearchQuery>("organizations",
            "\"parentOrgUuid\"", "organizations", "\"parentOrgUuid\"", RecurseStrategy.CHILDREN));
    return AnetObjectEngine.getInstance().getOrganizationDao().getOrganizationsBySearch(context,
        uuid, query);
  }

  @GraphQLQuery(name = "ascendantOrgs")
  public CompletableFuture<List<Organization>> loadAscendantOrgs(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    if (query == null) {
      query = new OrganizationSearchQuery();
    }
    // Note: recursion, includes transitive parents!
    query.setBatchParams(new RecursiveFkBatchParams<Organization, OrganizationSearchQuery>(
        "organizations", "uuid", "organizations", "\"parentOrgUuid\"", RecurseStrategy.PARENTS));
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
        "\"taskTaskedOrganizations\"", "\"taskUuid\"", "\"organizationUuid\""));
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

  @GraphQLQuery(name = "administratingPositions")
  public CompletableFuture<List<Position>> loadAdministratingPositions(
      @GraphQLRootContext Map<String, Object> context) {
    if (administratingPositions != null) {
      return CompletableFuture.completedFuture(administratingPositions);
    }
    return AnetObjectEngine.getInstance().getOrganizationDao()
        .getAdministratingPositionsForOrganization(context, uuid).thenApply(o -> {
          administratingPositions = o;
          return o;
        });
  }

  public List<Position> getAdministratingPositions() {
    return administratingPositions;
  }

  @GraphQLInputField(name = "administratingPositions")
  public void setAdministratingPositions(List<Position> administratingPositions) {
    this.administratingPositions = administratingPositions;
  }

  @GraphQLQuery(name = "authorizationGroups")
  public List<AuthorizationGroup> loadAuthorizationGroups() {
    if (authorizationGroups == null) {
      AuthorizationGroupDao authorizationGroupDao =
          AnetObjectEngine.getInstance().getAuthorizationGroupDao();
      final Set<String> authorizationGroupUuids = authorizationGroupDao
          .getAuthorizationGroupUuidsForRelatedObject(OrganizationDao.TABLE_NAME, uuid);
      if (authorizationGroupUuids != null) {
        authorizationGroups = AnetObjectEngine.getInstance().getAuthorizationGroupDao()
            .getByIds(authorizationGroupUuids.stream().toList());
      }
    }
    return authorizationGroups;
  }

  @Override
  @GraphQLQuery(name = "emailAddresses")
  @AllowUnverifiedUsers
  @RestrictToAuthorizationGroups(
      authorizationGroupSetting = "fields.organization.emailAddresses.authorizationGroupUuids")
  public CompletableFuture<List<EmailAddress>> loadEmailAddresses(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "network") String network) {
    return super.loadEmailAddresses(context, network);
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Organization)) {
      return false;
    }
    final Organization other = (Organization) o;
    return super.equals(o) && Objects.equals(other.getUuid(), uuid)
        && Objects.equals(other.getShortName(), shortName)
        && Objects.equals(other.getLongName(), longName)
        && Objects.equals(other.getStatus(), status)
        && Objects.equals(other.getIdentificationCode(), identificationCode)
        && Objects.equals(other.getProfile(), profile)
        && Objects.equals(other.getApp6context(), app6context)
        && Objects.equals(other.getApp6standardIdentity(), app6standardIdentity)
        && Objects.equals(other.getApp6symbolSet(), app6symbolSet)
        && Objects.equals(other.getApp6hq(), app6hq)
        && Objects.equals(other.getApp6amplifier(), app6amplifier);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), uuid, shortName, longName, status, identificationCode,
        profile, app6context, app6standardIdentity, app6symbolSet, app6hq, app6amplifier, createdAt,
        updatedAt);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s shortName:%s longName:%s identificationCode:%s]", uuid,
        shortName, longName, identificationCode);
  }
}
