package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Report;

public class EventSearchQuery extends AbstractCommonEventSearchQuery<EventSearchSortBy> {
  @GraphQLQuery
  @GraphQLInputField
  private String eventSeriesUuid;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> locationUuid;
  @GraphQLQuery
  @GraphQLInputField
  List<String> taskUuid;
  @GraphQLQuery
  @GraphQLInputField
  Instant includeDate;
  @GraphQLQuery
  @GraphQLInputField
  Instant startDate;
  @GraphQLQuery
  @GraphQLInputField
  Instant endDate;
  @GraphQLQuery
  @GraphQLInputField
  Instant startDateStart;
  @GraphQLQuery
  @GraphQLInputField
  Instant startDateEnd;
  @GraphQLQuery
  @GraphQLInputField
  Instant endDateStart;
  @GraphQLQuery
  @GraphQLInputField
  Instant endDateEnd;
  @GraphQLQuery
  @GraphQLInputField
  String eventTypeUuid;
  @GraphQLQuery
  @GraphQLInputField
  List<String> attendeeRanks;

  public EventSearchQuery() {
    super(EventSearchSortBy.START_DATE);
    setSortOrder(SortOrder.DESC);
  }

  public String getEventSeriesUuid() {
    return eventSeriesUuid;
  }

  public void setEventSeriesUuid(String eventSeriesUuid) {
    this.eventSeriesUuid = eventSeriesUuid;
  }

  public List<String> getLocationUuid() {
    return locationUuid;
  }

  public void setLocationUuid(List<String> locationUuid) {
    this.locationUuid = locationUuid;
  }

  public List<String> getTaskUuid() {
    return taskUuid;
  }

  public void setTaskUuid(List<String> taskUuid) {
    this.taskUuid = taskUuid;
  }

  public Instant getIncludeDate() {
    return includeDate;
  }

  public void setIncludeDate(Instant includeDate) {
    this.includeDate = includeDate;
  }

  public Instant getStartDate() {
    return startDate;
  }

  public void setStartDate(Instant startDate) {
    this.startDate = startDate;
  }

  public Instant getEndDate() {
    return endDate;
  }

  public void setEndDate(Instant endDate) {
    this.endDate = endDate;
  }

  public String getEventTypeUuid() {
    return eventTypeUuid;
  }

  public void setEventTypeUuid(String eventTypeUuid) {
    this.eventTypeUuid = eventTypeUuid;
  }

  public Instant getStartDateStart() {
    return startDateStart;
  }

  public void setStartDateStart(Instant startDateStart) {
    this.startDateStart = startDateStart;
  }

  public Instant getStartDateEnd() {
    return startDateEnd;
  }

  public void setStartDateEnd(Instant startDateEnd) {
    this.startDateEnd = startDateEnd;
  }

  public Instant getEndDateStart() {
    return endDateStart;
  }

  public void setEndDateStart(Instant endDateStart) {
    this.endDateStart = endDateStart;
  }

  public Instant getEndDateEnd() {
    return endDateEnd;
  }

  public void setEndDateEnd(Instant endDateEnd) {
    this.endDateEnd = endDateEnd;
  }

  public List<String> getAttendeeRanks() {
    return attendeeRanks;
  }

  public void setAttendeeRanks(List<String> attendeeRanks) {
    this.attendeeRanks = attendeeRanks;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), eventSeriesUuid, locationUuid, taskUuid, includeDate,
        startDate, endDate, startDateStart, startDateEnd, endDateStart, endDateEnd, eventTypeUuid,
        attendeeRanks);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof EventSearchQuery other)) {
      return false;
    }
    return super.equals(obj) && Objects.equals(getEventSeriesUuid(), other.getEventSeriesUuid())
        && Objects.equals(getLocationUuid(), other.getLocationUuid())
        && Objects.equals(getTaskUuid(), other.getTaskUuid())
        && Objects.equals(getIncludeDate(), other.getIncludeDate())
        && Objects.equals(getStartDate(), other.getStartDate())
        && Objects.equals(getEndDate(), other.getEndDate())
        && Objects.equals(getStartDateStart(), other.getStartDateStart())
        && Objects.equals(getStartDateEnd(), other.getStartDateEnd())
        && Objects.equals(getEndDateStart(), other.getEndDateStart())
        && Objects.equals(getEndDateEnd(), other.getEndDateEnd())
        && Objects.equals(getEventTypeUuid(), other.getEventTypeUuid())
        && Objects.equals(getAttendeeRanks(), other.getAttendeeRanks());
  }

  @Override
  public EventSearchQuery clone() throws CloneNotSupportedException {
    final EventSearchQuery clone = (EventSearchQuery) super.clone();
    if (locationUuid != null) {
      clone.setLocationUuid(new ArrayList<>(locationUuid));
    }
    if (taskUuid != null) {
      clone.setTaskUuid(new ArrayList<>(taskUuid));
    }
    return clone;
  }
}
