package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.UuidFetcher;

public class Event extends EventSeries {
  @GraphQLQuery
  @GraphQLInputField
  String type;
  @GraphQLQuery
  @GraphQLInputField
  Instant startDate;
  @GraphQLQuery
  @GraphQLInputField
  Instant endDate;
  @GraphQLQuery
  @GraphQLInputField
  String outcomes;

  // Lazy Loaded
  // annotated below
  List<Task> tasks;

  private ForeignObjectHolder<EventSeries> eventSeries = new ForeignObjectHolder<>();
  private ForeignObjectHolder<Location> location = new ForeignObjectHolder<>();

  @GraphQLQuery(name = "eventSeries")
  public CompletableFuture<EventSeries> loadEventSeries(
      @GraphQLRootContext Map<String, Object> context) {
    if (eventSeries.hasForeignObject()) {
      return CompletableFuture.completedFuture(eventSeries.getForeignObject());
    }
    return new UuidFetcher<EventSeries>()
        .load(context, IdDataLoaderKey.EVENT_SERIES, eventSeries.getForeignUuid()).thenApply(o -> {
          eventSeries.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setEventSeriesUuid(String eventSeriesUuid) {
    this.eventSeries = new ForeignObjectHolder<>(eventSeriesUuid);
  }

  @JsonIgnore
  public String getEventSeriesUuid() {
    return eventSeries.getForeignUuid();
  }

  @GraphQLInputField(name = "eventSeries")
  public void setEventSeries(EventSeries es) {
    this.eventSeries = new ForeignObjectHolder<>(es);
  }

  public EventSeries getEventSeries() {
    return eventSeries.getForeignObject();
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

  @GraphQLQuery(name = "tasks")
  public CompletableFuture<List<Task>> loadTasks(@GraphQLRootContext Map<String, Object> context) {
    if (tasks != null) {
      return CompletableFuture.completedFuture(tasks);
    }
    return AnetObjectEngine.getInstance().getEventDao().getTasksForEvent(context, uuid)
        .thenApply(o -> {
          tasks = o;
          return o;
        });
  }

  @GraphQLInputField(name = "tasks")
  public void setTasks(List<Task> tasks) {
    this.tasks = tasks;
  }

  public List<Task> getTasks() {
    return tasks;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
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

  public String getOutcomes() {
    return outcomes;
  }

  public void setOutcomes(String outcomes) {
    this.outcomes = outcomes;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    if (!super.equals(o))
      return false;
    Event event = (Event) o;
    return Objects.equals(type, event.type) && Objects.equals(startDate, event.startDate)
        && Objects.equals(endDate, event.endDate) && Objects.equals(outcomes, event.outcomes)
        && Objects.equals(tasks, event.tasks) && Objects.equals(eventSeries, event.eventSeries)
        && Objects.equals(location, event.location);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), type, startDate, endDate, outcomes, tasks, eventSeries,
        location);
  }
}
