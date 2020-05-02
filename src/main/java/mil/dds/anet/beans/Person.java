package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.security.Principal;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Person extends AbstractCustomizableAnetBean implements Principal {

  public static enum PersonStatus {
    ACTIVE, INACTIVE, NEW_USER
  }

  public static enum Role {
    ADVISOR, PRINCIPAL
  }

  private static final String AVATAR_TYPE = "png";

  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private PersonStatus status;
  @GraphQLQuery
  @GraphQLInputField
  private Role role;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean pendingVerification;
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
  // annotated below
  private Position position;
  // annotated below
  private List<PersonPositionHistory> previousPositions;
  // annotated below
  private Optional<byte[]> avatar;
  @GraphQLQuery
  @GraphQLInputField
  private String code;

  public Person() {
    this.pendingVerification = false; // Defaults
  }

  @Override
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  public PersonStatus getStatus() {
    return status;
  }

  public void setStatus(PersonStatus status) {
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
    query.setAuthorUuid(uuid);
    query.setUser(DaoUtils.getUserFromContext(context));
    return AnetObjectEngine.getInstance().getReportDao().search(context, query);
  }

  // TODO: batch load? (used in admin/MergePeople.js)
  @GraphQLQuery(name = "attendedReports")
  public CompletableFuture<AnetBeanList<Report>> loadAttendedReports(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    query.setAttendeeUuid(uuid);
    query.setUser(DaoUtils.getUserFromContext(context));
    return AnetObjectEngine.getInstance().getReportDao().search(context, query);
  }

  @GraphQLQuery(name = "avatar")
  public CompletableFuture<String> loadAvatar(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "size", defaultValue = "256") int size) {
    if (avatar != null) {
      return CompletableFuture.completedFuture(resizeAvatar(size));
    }
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE_AVATARS, uuid)
        .thenApply(o -> {
          avatar = Optional.ofNullable(o.getAvatar());
          return resizeAvatar(size);
        });
  }

  public String resizeAvatar(int size) {
    try {
      return String.format("data:image/%1$s;base64,%2$s", AVATAR_TYPE, Base64.getEncoder()
          .encodeToString(Utils.resizeImage(getAvatar(), size, size, AVATAR_TYPE)));
    } catch (Exception e) {
      return null;
    }
  }

  public byte[] getAvatar() {
    return avatar == null ? null : avatar.orElse(null);
  }

  public void setAvatar(byte[] avatar) {
    this.avatar = Optional.ofNullable(avatar);
  }

  @GraphQLInputField(name = "avatar")
  public void setAvatar(String avatar) {
    if (avatar == null) {
      this.avatar = Optional.ofNullable(null);
    } else {
      try {
        final String[] parts = avatar.split(",", 2);
        final String dataPart = parts.length == 1 ? parts[0] : parts[1];
        this.avatar = Optional.ofNullable(Base64.getDecoder().decode(dataPart));
      } catch (Exception e) {
        this.avatar = Optional.ofNullable(null);
      }
    }
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Person)) {
      return false;
    }
    Person other = (Person) o;
    boolean b = Objects.equals(uuid, other.getUuid()) && Objects.equals(other.getName(), name)
        && Objects.equals(other.getStatus(), status) && Objects.equals(other.getRole(), role)
        && Objects.equals(other.getEmailAddress(), emailAddress)
        && Objects.equals(other.getPhoneNumber(), phoneNumber)
        && Objects.equals(other.getRank(), rank) && Objects.equals(other.getBiography(), biography)
        && Objects.equals(other.getPendingVerification(), pendingVerification)
        && Objects.equals(other.getAvatar(), getAvatar()) && Objects.equals(other.getCode(), code)
        && (createdAt != null)
            ? (createdAt.equals(other.getCreatedAt()))
            : (other.getCreatedAt() == null) && (updatedAt != null)
                ? (updatedAt.equals(other.getUpdatedAt()))
                : (other.getUpdatedAt() == null)
                    && Objects.equals(other.getCustomFields(), customFields);
    return b;
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, name, status, role, emailAddress, phoneNumber, rank, biography,
        pendingVerification, avatar, code, createdAt, updatedAt);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s, name:%s, emailAddress:%s]", uuid, name, emailAddress);
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
