package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.security.Principal;
import java.time.Instant;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.recentActivity.Activity;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.graphql.RestrictToAuthorizationGroups;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.InsertionOrderLinkedList;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractEmailableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Person extends AbstractEmailableAnetBean
    implements Principal, RelatableObject, SubscribableObject, WithStatus, Comparable<Person> {

  private static final Comparator<Person> COMPARATOR =
      Comparator.comparing(Person::getName).thenComparing(Person::getUuid);

  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private Status status = Status.ACTIVE;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean user = false;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean pendingVerification = false;
  @GraphQLQuery
  @GraphQLInputField
  private String phoneNumber;
  @GraphQLQuery
  @GraphQLInputField
  private String gender;
  @GraphQLQuery
  @GraphQLInputField
  private String obsoleteCountry;
  // annotated below
  private ForeignObjectHolder<Location> country = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  private Instant endOfTourDate;
  @GraphQLQuery
  @GraphQLInputField
  private String rank;
  @GraphQLQuery
  @GraphQLInputField
  private String biography;
  @GraphQLQuery
  @GraphQLInputField
  private String domainUsername;
  @GraphQLQuery
  @GraphQLInputField
  private String openIdSubject;
  // annotated below
  private Position position;
  // annotated below
  private List<PersonPositionHistory> previousPositions;
  // annotated below
  private List<AuthorizationGroup> authorizationGroups;
  @GraphQLQuery
  @GraphQLInputField
  private String code;
  // annotated below
  private EntityAvatar entityAvatar;

  // non-GraphQL
  private Deque<Activity> recentActivities;
  private Set<String> authorizationGroupUuids;

  @Override
  @AllowUnverifiedUsers
  public String getUuid() {
    return super.getUuid();
  }

  @Override
  @AllowUnverifiedUsers
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  @Override
  @AllowUnverifiedUsers
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  @AllowUnverifiedUsers
  public Boolean getUser() {
    return user;
  }

  public void setUser(Boolean user) {
    this.user = user;
  }

  @AllowUnverifiedUsers
  public Boolean getPendingVerification() {
    return pendingVerification;
  }

  public void setPendingVerification(Boolean pendingVerification) {
    this.pendingVerification = pendingVerification;
  }

  @AllowUnverifiedUsers
  @RestrictToAuthorizationGroups(
      authorizationGroupSetting = "fields.person.phoneNumber.authorizationGroupUuids")
  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = Utils.trimStringReturnNull(phoneNumber);
  }

  @AllowUnverifiedUsers
  public String getGender() {
    return gender;
  }

  public void setGender(String gender) {
    this.gender = Utils.trimStringReturnNull(gender);
  }

  @AllowUnverifiedUsers
  public String getObsoleteCountry() {
    return obsoleteCountry;
  }

  public void setObsoleteCountry(String obsoleteCountry) {
    this.obsoleteCountry = obsoleteCountry;
  }

  @GraphQLQuery(name = "country")
  @AllowUnverifiedUsers
  public CompletableFuture<Location> loadCountry(@GraphQLRootContext Map<String, Object> context) {
    if (country.hasForeignObject()) {
      return CompletableFuture.completedFuture(country.getForeignObject());
    }
    return new UuidFetcher<Location>()
        .load(context, IdDataLoaderKey.LOCATIONS, country.getForeignUuid()).thenApply(o -> {
          country.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setCountryUuid(String countryUuid) {
    this.country = new ForeignObjectHolder<>(countryUuid);
  }

  @JsonIgnore
  public String getCountryUuid() {
    return country.getForeignUuid();
  }

  @GraphQLInputField(name = "country")
  public void setCountry(Location country) {
    this.country = new ForeignObjectHolder<>(country);
  }

  public Location getCountry() {
    return country.getForeignObject();
  }

  @AllowUnverifiedUsers
  public Instant getEndOfTourDate() {
    return endOfTourDate;
  }

  public void setEndOfTourDate(Instant endOfTourDate) {
    this.endOfTourDate = endOfTourDate;
  }

  @AllowUnverifiedUsers
  public String getRank() {
    return rank;
  }

  public void setRank(String rank) {
    this.rank = Utils.trimStringReturnNull(rank);
  }

  @AllowUnverifiedUsers
  public String getBiography() {
    return biography;
  }

  public void setBiography(String biography) {
    this.biography = Utils.trimStringReturnNull(biography);
  }

  @AllowUnverifiedUsers
  public String getDomainUsername() {
    return domainUsername;
  }

  public void setDomainUsername(String domainUsername) {
    this.domainUsername = domainUsername;
  }

  @AllowUnverifiedUsers
  public String getOpenIdSubject() {
    return openIdSubject;
  }

  public void setOpenIdSubject(String openIdSubject) {
    this.openIdSubject = openIdSubject;
  }

  @GraphQLQuery(name = "position")
  public CompletableFuture<Position> loadPositionBatched(
      @GraphQLRootContext Map<String, Object> context) {
    if (position != null) {
      return CompletableFuture.completedFuture(position);
    }
    return AnetObjectEngine.getInstance().getPositionDao()
        .getCurrentPositionForPerson(context, uuid).thenApply(o -> {
          position = o;
          return o;
        });
  }

  /* When loaded through means other than GraphQL */
  public synchronized Position loadPosition() {
    if (position != null) {
      return position;
    }
    position = AnetObjectEngine.getInstance().getPositionDao().getCurrentPositionForPerson(uuid);
    return position;
  }

  @GraphQLInputField(name = "position")
  public void setPosition(Position position) {
    this.position = position;
  }

  public Position getPosition() {
    return position;
  }

  @GraphQLQuery(name = "previousPositions")
  public CompletableFuture<List<PersonPositionHistory>> loadPreviousPositions(
      @GraphQLRootContext Map<String, Object> context) {
    if (previousPositions != null) {
      return CompletableFuture.completedFuture(previousPositions);
    }
    return AnetObjectEngine.getInstance().getPersonDao().getPositionHistory(context, uuid)
        .thenApply(o -> {
          previousPositions = o;
          return o;
        });
  }

  public List<PersonPositionHistory> getPreviousPositions() {
    return previousPositions;
  }

  @GraphQLInputField(name = "previousPositions")
  public void setPreviousPositions(List<PersonPositionHistory> previousPositions) {
    this.previousPositions = previousPositions;
  }

  // TODO: batch load? (used in admin/MergePeople.js)
  @GraphQLQuery(name = "authoredReports")
  public CompletableFuture<AnetBeanList<Report>> loadAuthoredReports(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    if (query == null) {
      query = new ReportSearchQuery();
    }
    query.setAuthorUuid(uuid);
    query.setUser(DaoUtils.getUserFromContext(context));
    return AnetObjectEngine.getInstance().getReportDao().search(context, query);
  }

  // TODO: batch load? (used in admin/MergePeople.js)
  @GraphQLQuery(name = "attendedReports")
  public CompletableFuture<AnetBeanList<Report>> loadAttendedReports(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    if (query == null) {
      query = new ReportSearchQuery();
    }
    query.setAttendeeUuid(uuid);
    query.setUser(DaoUtils.getUserFromContext(context));
    return AnetObjectEngine.getInstance().getReportDao().search(context, query);
  }

  @JsonIgnore
  public Set<String> getAuthorizationGroupUuids() {
    if (authorizationGroupUuids == null) {
      authorizationGroupUuids = AnetObjectEngine.getInstance().getAuthorizationGroupDao()
          .getAuthorizationGroupUuidsForRelatedObject(PersonDao.TABLE_NAME, uuid);
    }
    return authorizationGroupUuids;
  }

  @GraphQLQuery(name = "authorizationGroups")
  public List<AuthorizationGroup> loadAuthorizationGroups() {
    if (authorizationGroups == null) {
      final Set<String> agUuids = getAuthorizationGroupUuids();
      if (agUuids != null) {
        authorizationGroups = AnetObjectEngine.getInstance().getAuthorizationGroupDao()
            .getByIds(agUuids.stream().toList());
      }
    }
    return authorizationGroups;
  }

  @GraphQLQuery(name = "entityAvatar")
  public CompletableFuture<EntityAvatar> loadEntityAvatar(
      @GraphQLRootContext Map<String, Object> context) {
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

  @AllowUnverifiedUsers
  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  @JsonIgnore
  public Deque<Activity> getRecentActivities() {
    if (recentActivities == null) {
      return new InsertionOrderLinkedList<>();
    }
    return new InsertionOrderLinkedList<>(recentActivities);
  }

  @JsonIgnore
  public void setRecentActivities(Deque<Activity> recentActivities) {
    this.recentActivities = recentActivities;
  }

  @Override
  @GraphQLQuery(name = "emailAddresses")
  @AllowUnverifiedUsers
  @RestrictToAuthorizationGroups(
      authorizationGroupSetting = "fields.person.emailAddresses.authorizationGroupUuids")
  public CompletableFuture<List<EmailAddress>> loadEmailAddresses(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "network") String network) {
    return super.loadEmailAddresses(context, network);
  }

  @Override
  public int compareTo(Person o) {
    // Used by Collections.sort() in AdminResource::recentActivities
    return COMPARATOR.compare(this, o);
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Person)) {
      return false;
    }
    final Person other = (Person) o;
    return super.equals(o) && Objects.equals(uuid, other.getUuid())
        && Objects.equals(other.getName(), name) && Objects.equals(other.getStatus(), status)
        && Objects.equals(other.getUser(), user)
        && Objects.equals(other.getPhoneNumber(), phoneNumber)
        && Objects.equals(other.getRank(), rank) && Objects.equals(other.getBiography(), biography)
        && Objects.equals(other.getDomainUsername(), domainUsername)
        && Objects.equals(other.getOpenIdSubject(), openIdSubject)
        && Objects.equals(other.getPendingVerification(), pendingVerification)
        && Objects.equals(other.getCode(), code)
        && (createdAt != null ? createdAt.equals(other.getCreatedAt())
            : (other.getCreatedAt() == null && updatedAt != null)
                ? updatedAt.equals(other.getUpdatedAt())
                : other.getUpdatedAt() == null);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), uuid, name, status, user, phoneNumber, rank, biography,
        domainUsername, openIdSubject, pendingVerification, code, createdAt, updatedAt);
  }

  @Override
  public String toString() {
    // Only use the uuid, no personal information
    return String.format("[uuid:%s]", uuid);
  }

  public static Person createWithUuid(String uuid) {
    if (uuid == null) {
      return null;
    }
    final Person p = new Person();
    p.setUuid(uuid);
    return p;
  }
}
