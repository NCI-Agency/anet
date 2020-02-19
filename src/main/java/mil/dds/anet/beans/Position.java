package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Position extends AbstractAnetBean implements SubscribableObject {

  public static enum PositionType {
    ADVISOR, PRINCIPAL, SUPER_USER, ADMINISTRATOR
  }

  public static enum PositionStatus {
    ACTIVE, INACTIVE
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
  PositionStatus status;
  // Lazy Loaded
  // annotated below
  private ForeignObjectHolder<Organization> organization = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>(); // The Current person.
  // annotated below
  List<Position> associatedPositions;
  // annotated below
  private ForeignObjectHolder<Location> location = new ForeignObjectHolder<>();
  // annotated below
  List<PersonPositionHistory> previousPeople;
  // annotated below
  Boolean isApprover;

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

  public PositionStatus getStatus() {
    return status;
  }

  public void setStatus(PositionStatus status) {
    this.status = status;
  }

  @GraphQLQuery(name = "organization")
  public CompletableFuture<Organization> loadOrganization(
      @GraphQLRootContext Map<String, Object> context) {
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
  public CompletableFuture<Person> loadPerson(@GraphQLRootContext Map<String, Object> context) {
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

  @GraphQLQuery(name = "associatedPositions")
  public CompletableFuture<List<Position>> loadAssociatedPositions(
      @GraphQLRootContext Map<String, Object> context) {
    if (associatedPositions != null) {
      return CompletableFuture.completedFuture(associatedPositions);
    }
    return AnetObjectEngine.getInstance().getPositionDao().getAssociatedPositions(context, uuid)
        .thenApply(o -> {
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

  @GraphQLQuery(name = "previousPeople")
  public CompletableFuture<List<PersonPositionHistory>> loadPreviousPeople(
      @GraphQLRootContext Map<String, Object> context) {
    if (previousPeople != null) {
      return CompletableFuture.completedFuture(previousPeople);
    }
    return AnetObjectEngine.getInstance().getPositionDao().getPositionHistory(context, uuid)
        .thenApply(o -> {
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
      this.isApprover = AnetObjectEngine.getInstance().getPositionDao().getIsApprover(uuid);
    }
    return isApprover;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Position)) {
      return false;
    }
    Position other = (Position) o;
    return Objects.equals(uuid, other.getUuid()) && Objects.equals(name, other.getName())
        && Objects.equals(code, other.getCode()) && Objects.equals(type, other.getType())
        && Objects.equals(getOrganizationUuid(), other.getOrganizationUuid());
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, name, code, type, organization);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s name:%s orgUuid:%s]", uuid, name, getOrganizationUuid());
  }
}
