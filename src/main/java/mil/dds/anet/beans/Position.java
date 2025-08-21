package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.search.M2mBatchParams;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.graphql.RestrictToAuthorizationGroups;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractEmailableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Position extends AbstractEmailableAnetBean
    implements RelatableObject, SubscribableObject, WithStatus {

  public static enum PositionType {
    REGULAR, // -
    @Deprecated
    _PLACEHOLDER_1_, // Should no longer be used but remain in place to keep the correct values
    SUPERUSER, ADMINISTRATOR
  }

  public static enum SuperuserType {
    REGULAR, CAN_CREATE_TOP_LEVEL_ORGANIZATIONS_OR_TASKS,
    CAN_CREATE_OR_EDIT_ANY_ORGANIZATION_OR_TASK
  }

  public static enum PositionRole {
    MEMBER, DEPUTY, LEADER
  }

  @GraphQLQuery
  @GraphQLInputField
  String name;
  @GraphQLQuery
  @GraphQLInputField
  String code;
  @GraphQLQuery
  @GraphQLInputField
  PositionType type;
  @GraphQLQuery
  @GraphQLInputField
  SuperuserType superuserType;
  @GraphQLQuery
  @GraphQLInputField
  private Status status;
  @GraphQLQuery
  @GraphQLInputField
  private PositionRole role;
  @GraphQLQuery
  @GraphQLInputField
  private String description;
  // annotated below
  private EntityAvatar entityAvatar;
  // Lazy Loaded
  // annotated below
  private ForeignObjectHolder<Organization> organization = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>(); // The Current person.
  // annotated below
  private List<Position> associatedPositions;
  // annotated below
  private ForeignObjectHolder<Location> location = new ForeignObjectHolder<>();
  // annotated below
  private List<PersonPositionHistory> previousPeople;
  // annotated below
  private Boolean isApprover;
  // annotated below
  private List<Task> responsibleTasks;
  // annotated below
  private List<Organization> organizationsAdministrated;
  // annotated below
  private List<AuthorizationGroup> authorizationGroupsAdministrated;
  // annotated below
  private List<AuthorizationGroup> authorizationGroups;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = Utils.trimStringReturnNull(code);
  }

  public PositionType getType() {
    return type;
  }

  public void setType(PositionType type) {
    this.type = type;
  }

  public SuperuserType getSuperuserType() {
    return superuserType;
  }

  public void setSuperuserType(SuperuserType superuserType) {
    this.superuserType = superuserType;
  }

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  public PositionRole getRole() {
    return role;
  }

  public void setRole(PositionRole role) {
    this.role = role;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  @GraphQLQuery(name = "organization")
  public CompletableFuture<Organization> loadOrganization(
      @GraphQLRootContext GraphQLContext context) {
    if (organization.hasForeignObject()) {
      return CompletableFuture.completedFuture(organization.getForeignObject());
    }
    return new UuidFetcher<Organization>()
        .load(context, IdDataLoaderKey.ORGANIZATIONS, organization.getForeignUuid())
        .thenApply(o -> {
          organization.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setOrganizationUuid(String organizationUuid) {
    this.organization = new ForeignObjectHolder<>(organizationUuid);
  }

  @JsonIgnore
  public String getOrganizationUuid() {
    return organization.getForeignUuid();
  }

  @GraphQLInputField(name = "organization")
  public void setOrganization(Organization ao) {
    this.organization = new ForeignObjectHolder<>(ao);
  }

  public Organization getOrganization() {
    return organization.getForeignObject();
  }

  @GraphQLQuery(name = "person")
  public CompletableFuture<Person> loadPerson(@GraphQLRootContext GraphQLContext context) {
    if (person.hasForeignObject()) {
      return CompletableFuture.completedFuture(person.getForeignObject());
    }
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, person.getForeignUuid())
        .thenApply(o -> {
          person.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setPersonUuid(String personUuid) {
    this.person = new ForeignObjectHolder<>(personUuid);
  }

  @JsonIgnore
  public String getPersonUuid() {
    return person.getForeignUuid();
  }

  @GraphQLInputField(name = "person")
  public void setPerson(Person p) {
    this.person = new ForeignObjectHolder<>(p);
  }

  public Person getPerson() {
    return person.getForeignObject();
  }

  // for easy access through reflection in {@link PersonDao#copyPerson}
  @JsonIgnore
  public void setCurrentPersonUuid(String personUuid) {
    setPersonUuid(personUuid);
  }

  // for easy access through reflection in {@link PersonDao#copyPerson}
  @JsonIgnore
  public String getCurrentPersonUuid() {
    return getPersonUuid();
  }

  @GraphQLQuery(name = "associatedPositions")
  public CompletableFuture<List<Position>> loadAssociatedPositions(
      @GraphQLRootContext GraphQLContext context) {
    if (associatedPositions != null) {
      return CompletableFuture.completedFuture(associatedPositions);
    }
    return engine().getPositionDao().getAssociatedPositions(context, uuid).thenApply(o -> {
      associatedPositions = o;
      return o;
    });
  }

  public List<Position> getAssociatedPositions() {
    return associatedPositions;
  }

  @GraphQLInputField(name = "associatedPositions")
  public void setAssociatedPositions(List<Position> associatedPositions) {
    this.associatedPositions = associatedPositions;
  }

  @GraphQLQuery(name = "location")
  public CompletableFuture<Location> loadLocation(@GraphQLRootContext GraphQLContext context) {
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

  @GraphQLInputField(name = "organizationsAdministrated")
  public void setOrganizationsAdministrated(List<Organization> organizationsAdministrated) {
    this.organizationsAdministrated = organizationsAdministrated;
  }

  public List<Organization> getOrganizationsAdministrated() {
    return organizationsAdministrated;
  }

  @GraphQLQuery(name = "previousPeople")
  public CompletableFuture<List<PersonPositionHistory>> loadPreviousPeople(
      @GraphQLRootContext GraphQLContext context) {
    if (previousPeople != null) {
      return CompletableFuture.completedFuture(previousPeople);
    }
    return engine().getPositionDao().getPositionHistory(context, uuid).thenApply(o -> {
      previousPeople = o;
      return o;
    });
  }

  public List<PersonPositionHistory> getPreviousPeople() {
    return previousPeople;
  }

  @GraphQLInputField(name = "previousPeople")
  public void setPreviousPeople(List<PersonPositionHistory> previousPeople) {
    this.previousPeople = previousPeople;
  }

  @GraphQLQuery(name = "isApprover")
  public synchronized Boolean loadIsApprover() {
    if (this.isApprover == null) {
      this.isApprover = engine().getPositionDao().getIsApprover(uuid);
    }
    return isApprover;
  }

  @GraphQLQuery(name = "responsibleTasks")
  public CompletableFuture<List<Task>> loadResponsibleTasks(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") TaskSearchQuery query) {
    if (responsibleTasks != null) {
      return CompletableFuture.completedFuture(responsibleTasks);
    }
    if (query == null) {
      query = new TaskSearchQuery();
    }
    query.setBatchParams(new M2mBatchParams<Task, TaskSearchQuery>("tasks", "uuid",
        "\"taskResponsiblePositions\"", "\"taskUuid\"", "\"positionUuid\""));
    return engine().getTaskDao().getTasksBySearch(context, uuid, query).thenApply(o -> {
      responsibleTasks = o;
      return o;
    });
  }

  @GraphQLQuery(name = "organizationsAdministrated")
  public CompletableFuture<List<Organization>> loadOrganizationsAdministrated(
      @GraphQLRootContext GraphQLContext context) {
    if (organizationsAdministrated != null) {
      return CompletableFuture.completedFuture(organizationsAdministrated);
    }
    final OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setBatchParams(
        new M2mBatchParams<Organization, OrganizationSearchQuery>("organizations", "uuid",
            "\"organizationAdministrativePositions\"", "\"organizationUuid\"", "\"positionUuid\""));
    return engine().getOrganizationDao().getOrganizationsBySearch(context, uuid, query)
        .thenApply(o -> {
          organizationsAdministrated = o;
          return o;
        });
  }

  @GraphQLQuery(name = "authorizationGroupsAdministrated")
  public List<AuthorizationGroup> getAuthorizationGroupsAdministrated() {
    if (authorizationGroupsAdministrated == null) {
      authorizationGroupsAdministrated =
          engine().getAuthorizationGroupDao().getAuthorizationGroupsAdministratedByPosition(uuid);
    }
    return authorizationGroupsAdministrated;
  }

  @GraphQLQuery(name = "authorizationGroups")
  public List<AuthorizationGroup> loadAuthorizationGroups() {
    if (authorizationGroups == null) {
      AuthorizationGroupDao authorizationGroupDao = engine().getAuthorizationGroupDao();
      final Set<String> authorizationGroupUuids = authorizationGroupDao
          .getAuthorizationGroupUuidsForRelatedObject(PositionDao.TABLE_NAME, uuid);
      if (authorizationGroupUuids != null) {
        authorizationGroups =
            engine().getAuthorizationGroupDao().getByIds(authorizationGroupUuids.stream().toList());
      }
    }
    return authorizationGroups;
  }

  @GraphQLQuery(name = "entityAvatar")
  public CompletableFuture<EntityAvatar> loadEntityAvatar(
      @GraphQLRootContext GraphQLContext context) {
    if (entityAvatar != null) {
      return CompletableFuture.completedFuture(entityAvatar);
    }
    return new UuidFetcher<EntityAvatar>().load(context, IdDataLoaderKey.ENTITY_AVATAR, uuid)
        .thenApply(o -> {
          entityAvatar = o;
          return o;
        });
  }

  @GraphQLInputField(name = "entityAvatar")
  public void setEntityAvatar(EntityAvatar entityAvatar) {
    this.entityAvatar = entityAvatar;
  }

  public EntityAvatar getEntityAvatar() {
    return this.entityAvatar;
  }

  @Override
  @GraphQLQuery(name = "emailAddresses")
  @AllowUnverifiedUsers
  @RestrictToAuthorizationGroups(
      authorizationGroupSetting = "fields.position.emailAddresses.authorizationGroupUuids")
  public CompletableFuture<List<EmailAddress>> loadEmailAddresses(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "network") String network) {
    return super.loadEmailAddresses(context, network);
  }

  @Override
  public String customFieldsKey() {
    return "fields.position.customFields";
  }

  @Override
  public String customSensitiveInformationKey() {
    return "fields.position.customSensitiveInformation";
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Position)) {
      return false;
    }
    final Position other = (Position) o;
    return super.equals(o) && Objects.equals(uuid, other.getUuid())
        && Objects.equals(name, other.getName()) && Objects.equals(code, other.getCode())
        && Objects.equals(type, other.getType()) && Objects.equals(status, other.getStatus())
        && Objects.equals(superuserType, other.getSuperuserType())
        && Objects.equals(role, other.getRole())
        && Objects.equals(description, other.getDescription())
        && Objects.equals(getOrganizationUuid(), other.getOrganizationUuid());
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), uuid, name, code, type, superuserType, status, role,
        organization, description);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s name:%s orgUuid:%s]", uuid, name, getOrganizationUuid());
  }
}
