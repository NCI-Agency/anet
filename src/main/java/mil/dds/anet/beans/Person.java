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
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.recentActivity.Activity;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.InsertionOrderLinkedList;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Person extends AbstractCustomizableAnetBean
    implements Principal, RelatableObject, SubscribableObject, WithStatus, Comparable<Person> {

  private static final Comparator<Person> COMPARATOR =
      Comparator.comparing(Person::getName).thenComparing(Person::getUuid);

  public static enum Role {
    ADVISOR, PRINCIPAL
  }

  private static final String AVATAR_TYPE = "png";

  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private Status status = Status.ACTIVE;
  @GraphQLQuery
  @GraphQLInputField
  private Role role;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean pendingVerification = false;
  @GraphQLQuery
  @GraphQLInputField
  private String emailAddress;
  @GraphQLQuery
  @GraphQLInputField
  private String phoneNumber;
  @GraphQLQuery
  @GraphQLInputField
  private String gender;
  @GraphQLQuery
  @GraphQLInputField
  private String country;
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
  private ForeignObjectHolder<Attachment> avatar = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  private String code;

  // non-GraphQL
  private Deque<Activity> recentActivities;

  @Override
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public Boolean getPendingVerification() {
    return pendingVerification;
  }

  public void setPendingVerification(Boolean pendingVerification) {
    this.pendingVerification = pendingVerification;
  }

  public String getEmailAddress() {
    return emailAddress;
  }

  public void setEmailAddress(String emailAddress) {
    this.emailAddress = Utils.trimStringReturnNull(emailAddress);
  }

  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = Utils.trimStringReturnNull(phoneNumber);
  }

  public String getGender() {
    return gender;
  }

  public void setGender(String gender) {
    this.gender = Utils.trimStringReturnNull(gender);
  }

  public String getCountry() {
    return country;
  }

  public void setCountry(String country) {
    this.country = Utils.trimStringReturnNull(country);
  }

  public Instant getEndOfTourDate() {
    return endOfTourDate;
  }

  public void setEndOfTourDate(Instant endOfTourDate) {
    this.endOfTourDate = endOfTourDate;
  }

  public String getRank() {
    return rank;
  }

  public void setRank(String rank) {
    this.rank = Utils.trimStringReturnNull(rank);
  }

  public String getBiography() {
    return biography;
  }

  public void setBiography(String biography) {
    this.biography = Utils.trimStringReturnNull(biography);
  }

  public String getDomainUsername() {
    return domainUsername;
  }

  public void setDomainUsername(String domainUsername) {
    this.domainUsername = domainUsername;
  }

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

  @JsonIgnore
  public void setAvatarUuid(String avatarUuid) {
    this.avatar = new ForeignObjectHolder<>(avatarUuid);
  }

  @JsonIgnore
  public String getAvatarUuid() {
    return avatar.getForeignUuid();
  }

  @GraphQLInputField(name = "avatar")
  public void setAvatar(Attachment avatar) {
    this.avatar = new ForeignObjectHolder<>(avatar);
  }

  public Attachment getAvatar() {
    return avatar.getForeignObject();
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

  @GraphQLQuery(name = "avatar")
  public CompletableFuture<Attachment> loadAvatar(@GraphQLRootContext Map<String, Object> context) {
    if (avatar != null) {
      return CompletableFuture.completedFuture(avatar.getForeignObject());
    }
    return new UuidFetcher<Attachment>()
        .load(context, IdDataLoaderKey.PEOPLE_AVATARS, avatar.getForeignUuid()).thenApply(o -> {
          // Careful, `o` might be null
          avatar.setForeignObject(o);
          return o;
        });
  }

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
        && Objects.equals(other.getRole(), role)
        && Objects.equals(other.getEmailAddress(), emailAddress)
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
    return Objects.hash(super.hashCode(), uuid, name, status, role, emailAddress, phoneNumber, rank,
        biography, domainUsername, openIdSubject, pendingVerification, code, createdAt, updatedAt);
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
