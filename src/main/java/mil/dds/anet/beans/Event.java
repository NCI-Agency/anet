package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.search.FkBatchParams;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.UuidFetcher;

public class Event extends EventSeries {
  public enum EventType {
    CONFERENCE("CONFERENCE"), // -
    EXERCISE("EXERCISE"), // -
    VISIT_BAN("VISIT_BAN"), // -
    OTHER("OTHER"); // -

    private static final Map<String, Event.EventType> BY_CODE = new HashMap<>();
    static {
      for (final Event.EventType e : values()) {
        BY_CODE.put(e.code, e);
      }
    }

    public static Event.EventType valueOfCode(String code) {
      return BY_CODE.get(code);
    }

    private final String code;

    EventType(String code) {
      this.code = code;
    }

    @Override
    public String toString() {
      return code;
    }
  }

  @GraphQLQuery
  @GraphQLInputField
  EventType type;
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

  // Lazy Loaded
  // annotated below
  List<Organization> organizations;

  // Lazy Loaded
  // annotated below
  List<Person> people;

  private ForeignObjectHolder<EventSeries> eventSeries = new ForeignObjectHolder<>();
  private ForeignObjectHolder<Location> location = new ForeignObjectHolder<>();

  @GraphQLQuery(name = "eventSeries")
  public CompletableFuture<EventSeries> loadEventSeries(
      @GraphQLRootContext GraphQLContext context) {
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
  public CompletableFuture<Location> loadLocation(@GraphQLRootContext GraphQLContext context) {
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
  public CompletableFuture<List<Task>> loadTasks(@GraphQLRootContext GraphQLContext context) {
    if (tasks != null) {
      return CompletableFuture.completedFuture(tasks);
    }
    return engine().getEventDao().getTasksForEvent(context, uuid).thenApply(o -> {
      tasks = o;
      return o;
    });
  }

  @GraphQLQuery(name = "organizations")
  public CompletableFuture<List<Organization>> loadOrganizations(
      @GraphQLRootContext GraphQLContext context) {
    if (organizations != null) {
      return CompletableFuture.completedFuture(organizations);
    }
    return engine().getEventDao().getOrganizationsForEvent(context, uuid).thenApply(o -> {
      organizations = o;
      return o;
    });
  }

  @GraphQLQuery(name = "people")
  public CompletableFuture<List<Person>> loadPeople(@GraphQLRootContext GraphQLContext context) {
    if (people != null) {
      return CompletableFuture.completedFuture(people);
    }
    return engine().getEventDao().getPeopleForEvent(context, uuid).thenApply(o -> {
      people = o;
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

  @GraphQLInputField(name = "organizations")
  public void setOrganizations(List<Organization> organizations) {
    this.organizations = organizations;
  }

  public List<Organization> getOrganizations() {
    return organizations;
  }

  @GraphQLInputField(name = "people")
  public void setPeople(List<Person> people) {
    this.people = people;
  }

  public List<Person> getPeople() {
    return people;
  }

  public EventType getType() {
    return type;
  }

  public void setType(EventType type) {
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

  @GraphQLQuery(name = "reports")
  public CompletableFuture<List<Report>> loadReports(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    if (query == null) {
      query = new ReportSearchQuery();
    }
    query.setBatchParams(new FkBatchParams<>("reports", "\"eventUuid\""));
    query.setUser(DaoUtils.getUserFromContext(context));
    return ApplicationContextProvider.getBean(ReportDao.class).getReportsBySearch(context, uuid,
        query);
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
        && Objects.equals(tasks, event.tasks) && Objects.equals(organizations, event.organizations)
        && Objects.equals(people, event.people) && Objects.equals(eventSeries, event.eventSeries)
        && Objects.equals(location, event.location);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), type, startDate, endDate, outcomes, tasks, organizations,
        people, eventSeries, location);
  }
}
