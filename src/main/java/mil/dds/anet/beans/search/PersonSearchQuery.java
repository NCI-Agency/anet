package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.List;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;

public class PersonSearchQuery extends AbstractSearchQuery<PersonSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  String orgUuid;
  @GraphQLQuery
  @GraphQLInputField
  Role role;
  @GraphQLQuery
  @GraphQLInputField
  List<PersonStatus> status;
  @GraphQLQuery
  @GraphQLInputField
  RecurseStrategy orgRecurseStrategy;
  @GraphQLQuery
  @GraphQLInputField
  String rank;
  @GraphQLQuery
  @GraphQLInputField
  String country;
  @GraphQLQuery
  @GraphQLInputField
  Instant endOfTourDateStart;
  @GraphQLQuery
  @GraphQLInputField
  Instant endOfTourDateEnd;

  // Filter to people in positions at a certain location
  @GraphQLQuery
  @GraphQLInputField
  String locationUuid;

  // Also match on positions whose name or code matches text.
  @GraphQLQuery
  @GraphQLInputField
  Boolean matchPositionName;

  // Find people who are pending verification
  @GraphQLQuery
  @GraphQLInputField
  Boolean pendingVerification;

  // Find people who (don't) have the biography filled in
  @GraphQLQuery
  @GraphQLInputField
  Boolean hasBiography;

  public PersonSearchQuery() {
    super(PersonSearchSortBy.NAME);
    this.setPageSize(100);
  }

  @GraphQLQuery
  public String getOrgUuid() {
    return orgUuid;
  }

  public void setOrgUuid(String orgUuid) {
    this.orgUuid = orgUuid;
  }

  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public List<PersonStatus> getStatus() {
    return status;
  }

  public void setStatus(List<PersonStatus> status) {
    this.status = status;
  }

  public RecurseStrategy getOrgRecurseStrategy() {
    return orgRecurseStrategy;
  }

  public void setOrgRecurseStrategy(RecurseStrategy orgRecurseStrategy) {
    this.orgRecurseStrategy = orgRecurseStrategy;
  }

  public String getRank() {
    return rank;
  }

  public void setRank(String rank) {
    this.rank = rank;
  }

  public String getCountry() {
    return country;
  }

  public void setCountry(String country) {
    this.country = country;
  }

  public String getLocationUuid() {
    return locationUuid;
  }

  public void setLocationUuid(String locationUuid) {
    this.locationUuid = locationUuid;
  }

  public boolean getMatchPositionName() {
    return Boolean.TRUE.equals(matchPositionName);
  }

  public void setMatchPositionName(Boolean matchPositionName) {
    this.matchPositionName = matchPositionName;
  }

  public Boolean getPendingVerification() {
    return pendingVerification;
  }

  public void setPendingVerification(Boolean pendingVerification) {
    this.pendingVerification = pendingVerification;
  }

  public Instant getEndOfTourDateStart() {
    return endOfTourDateStart;
  }

  public void setEndOfTourDateStart(Instant endOfTourDateStart) {
    this.endOfTourDateStart = endOfTourDateStart;
  }

  public Instant getEndOfTourDateEnd() {
    return endOfTourDateEnd;
  }

  public void setEndOfTourDateEnd(Instant endOfTourDateEnd) {
    this.endOfTourDateEnd = endOfTourDateEnd;
  }

  public Boolean getHasBiography() {
    return hasBiography;
  }

  public void setHasBiography(Boolean hasBiography) {
    this.hasBiography = hasBiography;
  }

}
