package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.security.Principal;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Person extends AbstractAnetBean implements Principal {

  public static enum PersonStatus {
    ACTIVE, INACTIVE, NEW_USER
  }

  public static enum Role {
    ADVISOR, PRINCIPAL
  }

  private static final String DEFAULT_AVATAR_PATH =
      "src/main/resources/assets/avatars/default_avatar.png";

  private String name;
  private PersonStatus status;
  private Role role;
  private Boolean pendingVerification;

  private String emailAddress;
  private String phoneNumber;
  private String gender;
  private String country;
  private Instant endOfTourDate;

  private String rank;
  private String biography;
  private String domainUsername;

  private Position position;

  private List<PersonPositionHistory> previousPositions;

  private String avatar;

  public Person() {
    this.pendingVerification = false; // Defaults
  }

  @GraphQLQuery(name = "name")
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  @GraphQLQuery(name = "status")
  public PersonStatus getStatus() {
    return status;
  }

  public void setStatus(PersonStatus status) {
    this.status = status;
  }

  @GraphQLQuery(name = "role")
  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  @GraphQLQuery(name = "pendingVerification")
  public Boolean getPendingVerification() {
    return pendingVerification;
  }

  public void setPendingVerification(Boolean pendingVerification) {
    this.pendingVerification = pendingVerification;
  }

  @GraphQLQuery(name = "emailAddress")
  public String getEmailAddress() {
    return emailAddress;
  }

  public void setEmailAddress(String emailAddress) {
    this.emailAddress = Utils.trimStringReturnNull(emailAddress);
  }

  @GraphQLQuery(name = "phoneNumber")
  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = Utils.trimStringReturnNull(phoneNumber);
  }

  @GraphQLQuery(name = "gender")
  public String getGender() {
    return gender;
  }

  public void setGender(String gender) {
    this.gender = Utils.trimStringReturnNull(gender);
  }

  @GraphQLQuery(name = "country")
  public String getCountry() {
    return country;
  }

  public void setCountry(String country) {
    this.country = Utils.trimStringReturnNull(country);
  }

  @GraphQLQuery(name = "endOfTourDate")
  public Instant getEndOfTourDate() {
    return endOfTourDate;
  }

  public void setEndOfTourDate(Instant endOfTourDate) {
    this.endOfTourDate = endOfTourDate;
  }

  @GraphQLQuery(name = "rank")
  public String getRank() {
    return rank;
  }

  public void setRank(String rank) {
    this.rank = Utils.trimStringReturnNull(rank);
  }

  @GraphQLQuery(name = "biography")
  public String getBiography() {
    return biography;
  }

  public void setBiography(String biography) {
    this.biography = Utils.trimStringReturnNull(biography);
  }

  @GraphQLQuery(name = "domainUsername")
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

  public void setPosition(Position position) {
    this.position = position;
  }

  @GraphQLIgnore
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

  @GraphQLIgnore
  public List<PersonPositionHistory> getPreviousPositions() {
    return previousPositions;
  }

  public void setPreviousPositions(List<PersonPositionHistory> previousPositions) {
    this.previousPositions = previousPositions;
  }

  // TODO: batch load? (used in admin/MergePeople.js)
  @GraphQLQuery(name = "authoredReports")
  public AnetBeanList<Report> loadAuthoredReports(
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    query.setAuthorUuid(uuid);
    return AnetObjectEngine.getInstance().getReportDao().search(query);
  }

  // TODO: batch load? (used in admin/MergePeople.js)
  @GraphQLQuery(name = "attendedReports")
  public AnetBeanList<Report> loadAttendedReports(
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    query.setAttendeeUuid(uuid);
    return AnetObjectEngine.getInstance().getReportDao().search(query);
  }

  @GraphQLQuery(name = "avatar")
  public String getAvatar() throws IOException {
    // Load the default image
    byte[] fileContent = Files.readAllBytes(new File(DEFAULT_AVATAR_PATH).toPath());
    String defaultAvatarData = Base64.getEncoder().encodeToString(fileContent);

    return avatar == null ? defaultAvatarData : avatar;
  }

  public void setAvatar(String avatar) {
    this.avatar = avatar;
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || !(o instanceof Person)) {
      return false;
    }
    Person other = (Person) o;
    boolean b = Objects.equals(uuid, other.getUuid()) && Objects.equals(other.getName(), name)
        && Objects.equals(other.getStatus(), status) && Objects.equals(other.getRole(), role)
        && Objects.equals(other.getEmailAddress(), emailAddress)
        && Objects.equals(other.getPhoneNumber(), phoneNumber)
        && Objects.equals(other.getRank(), rank) && Objects.equals(other.getBiography(), biography)
        && Objects.equals(other.getPendingVerification(), pendingVerification)
        && (createdAt != null)
            ? (createdAt.equals(other.getCreatedAt()))
            : (other.getCreatedAt() == null) && (updatedAt != null)
                ? (updatedAt.equals(other.getUpdatedAt()))
                : (other.getUpdatedAt() == null);
    return b;
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, name, status, role, emailAddress, phoneNumber, rank, biography,
        createdAt, updatedAt, pendingVerification);
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
