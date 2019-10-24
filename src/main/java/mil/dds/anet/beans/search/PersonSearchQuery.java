package mil.dds.anet.beans.search;

import java.time.Instant;
import java.util.List;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;

public class PersonSearchQuery extends SubscribableObjectSearchQuery<PersonSearchSortBy> {

  String orgUuid;
  Role role;
  List<PersonStatus> status;
  Boolean includeChildOrgs;
  String rank;
  String country;
  Instant endOfTourDateStart;
  Instant endOfTourDateEnd;

  // Filter to people in positions at a certain location
  String locationUuid;

  // Also match on positions whose name or code matches text.
  Boolean matchPositionName;

  // Find people who are pending verification
  Boolean pendingVerification;

  // Find people who (don't) have the biography filled in
  Boolean hasBiography;

  public PersonSearchQuery() {
    super(PersonSearchSortBy.NAME);
    this.setPageSize(100);
    // FIXME: Explicitly set sorting by name (ascending) to reinstate pre-SOUNDEX search behaviour.
    this.setSortBy(PersonSearchSortBy.NAME);
  }

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

  public boolean getIncludeChildOrgs() {
    return Boolean.TRUE.equals(includeChildOrgs);
  }

  public void setIncludeChildOrgs(Boolean includeChildOrgs) {
    this.includeChildOrgs = includeChildOrgs;
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
