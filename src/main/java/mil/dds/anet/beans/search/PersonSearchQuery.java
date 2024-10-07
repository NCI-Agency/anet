package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import mil.dds.anet.beans.Position.PositionType;

public class PersonSearchQuery extends SubscribableObjectSearchQuery<PersonSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  List<String> orgUuid;
  @GraphQLQuery
  @GraphQLInputField
  RecurseStrategy orgRecurseStrategy;
  @GraphQLQuery
  @GraphQLInputField
  String rank;
  @GraphQLQuery
  @GraphQLInputField
  String countryUuid;
  @GraphQLQuery
  @GraphQLInputField
  Instant endOfTourDateStart;
  @GraphQLQuery
  @GraphQLInputField
  Instant endOfTourDateEnd;
  @GraphQLQuery
  @GraphQLInputField
  private AssessmentSearchQuery assessment;

  // Filter to people in positions at a certain location
  @GraphQLQuery
  @GraphQLInputField
  private List<String> locationUuid;
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy locationRecurseStrategy;

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

  // Find people whose current position is of the given type
  @GraphQLQuery
  @GraphQLInputField
  List<PositionType> positionType;

  public PersonSearchQuery() {
    super(PersonSearchSortBy.NAME);
    this.setPageSize(100);
  }

  @GraphQLQuery
  public List<String> getOrgUuid() {
    return orgUuid;
  }

  public void setOrgUuid(List<String> orgUuid) {
    this.orgUuid = orgUuid;
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

  public String getCountryUuid() {
    return countryUuid;
  }

  public void setCountryUuid(String countryUuid) {
    this.countryUuid = countryUuid;
  }

  public List<String> getLocationUuid() {
    return locationUuid;
  }

  public void setLocationUuid(List<String> locationUuid) {
    this.locationUuid = locationUuid;
  }

  public RecurseStrategy getLocationRecurseStrategy() {
    return locationRecurseStrategy;
  }

  public void setLocationRecurseStrategy(RecurseStrategy locationRecurseStrategy) {
    this.locationRecurseStrategy = locationRecurseStrategy;
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

  public List<PositionType> getPositionType() {
    return positionType;
  }

  public void setPositionType(List<PositionType> positionType) {
    this.positionType = positionType;
  }

  public AssessmentSearchQuery getAssessment() {
    return assessment;
  }

  public void setAssessment(AssessmentSearchQuery assessment) {
    this.assessment = assessment;
  }

  @Override
  public PersonSearchQuery clone() throws CloneNotSupportedException {
    final PersonSearchQuery clone = (PersonSearchQuery) super.clone();
    if (orgUuid != null) {
      clone.setOrgUuid(new ArrayList<>(orgUuid));
    }
    if (locationUuid != null) {
      clone.setLocationUuid(new ArrayList<>(locationUuid));
    }
    if (assessment != null) {
      clone.setAssessment(
          new AssessmentSearchQuery(assessment.key(), new HashMap<>(assessment.filters())));
    }
    return clone;
  }

}
