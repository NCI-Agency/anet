package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.database.mappers.EventMapper;
import mil.dds.anet.database.mappers.GenericRelatedObjectMapper;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.pg.PostgresqlEventSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EventDao extends AnetSubscribableObjectDao<Event, EventSearchQuery> {

  private static final String[] fields = {"uuid", "status", "eventTypeUuid", "name", "description",
      "ownerOrgUuid", "hostOrgUuid", "adminOrgUuid", "eventSeriesUuid", "locationUuid", "startDate",
      "endDate", "outcomes", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "events";
  public static final String EVENT_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public EventDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public Event getByUuid(String uuid) {
    return getByIds(Collections.singletonList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Event> {
    private static final String sql = "/* batch.getEventsByUuids */ SELECT " + EVENT_FIELDS
        + " from events where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(EventDao.this.databaseHandler, sql, "uuids", new EventMapper());
    }
  }

  class TasksBatcher extends ForeignKeyBatcher<Task> {
    private static final String sql = "/* batch.getTasksForEvent */ SELECT " + TaskDao.TASK_FIELDS
        + ", \"eventTasks\".\"eventUuid\" FROM tasks, \"eventTasks\" "
        + "WHERE \"eventTasks\".\"eventUuid\" IN ( <foreignKeys> ) "
        + "AND \"eventTasks\".\"taskUuid\" = tasks.uuid ORDER BY uuid";

    public TasksBatcher() {
      super(EventDao.this.databaseHandler, sql, "foreignKeys", new TaskMapper(), "eventUuid");
    }
  }

  class OrganizationsBatcher extends ForeignKeyBatcher<Organization> {
    private static final String sql =
        "/* batch.getOrganizationsForEvent */ SELECT " + OrganizationDao.ORGANIZATION_FIELDS
            + ", \"eventOrganizations\".\"eventUuid\" FROM organizations, \"eventOrganizations\" "
            + "WHERE \"eventOrganizations\".\"eventUuid\" IN ( <foreignKeys> ) "
            + "AND \"eventOrganizations\".\"organizationUuid\" = organizations.uuid ORDER BY uuid";

    public OrganizationsBatcher() {
      super(EventDao.this.databaseHandler, sql, "foreignKeys", new OrganizationMapper(),
          "eventUuid");
    }
  }

  class PeopleBatcher extends ForeignKeyBatcher<Person> {
    private static final String sql = "/* batch.getPeopleForEvent */ SELECT "
        + PersonDao.PERSON_FIELDS + ", \"eventPeople\".\"eventUuid\" FROM people, \"eventPeople\" "
        + "WHERE \"eventPeople\".\"eventUuid\" IN ( <foreignKeys> ) "
        + "AND \"eventPeople\".\"personUuid\" = people.uuid ORDER BY uuid";

    public PeopleBatcher() {
      super(EventDao.this.databaseHandler, sql, "foreignKeys", new PersonMapper(), "eventUuid");
    }
  }

  class EventHostRelatedObjectsBatcher extends ForeignKeyBatcher<GenericRelatedObject> {
    private static final String SQL =
        "/* batch.getEventHostRelatedObjects */ SELECT * FROM \"eventHostRelatedObjects\" "
            + "WHERE \"eventUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectUuid\" ASC";

    public EventHostRelatedObjectsBatcher() {
      super(EventDao.this.databaseHandler, SQL, "foreignKeys",
          new GenericRelatedObjectMapper("eventUuid"), "eventUuid");
    }
  }

  public List<List<GenericRelatedObject>> getEventHostRelatedObjects(List<String> foreignKeys) {
    return new EventDao.EventHostRelatedObjectsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<GenericRelatedObject>> getRelatedObjects(GraphQLContext context,
      Event event) {
    return new ForeignKeyFetcher<GenericRelatedObject>().load(context,
        FkDataLoaderKey.EVENT_EVENT_HOST_RELATED_OBJECTS, event.getUuid());
  }



  public List<List<Task>> getTasks(List<String> foreignKeys) {
    return new TasksBatcher().getByForeignKeys(foreignKeys);
  }

  public List<List<Organization>> getOrganizations(List<String> foreignKeys) {
    return new OrganizationsBatcher().getByForeignKeys(foreignKeys);
  }

  public List<List<Person>> getPeople(List<String> foreignKeys) {
    return new PeopleBatcher().getByForeignKeys(foreignKeys);
  }

  @Transactional
  public int countByEventType(String eventTypeUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle.createQuery(
          "/* countEventsByEventType */ SELECT COUNT(*) FROM events WHERE \"eventTypeUuid\" = :eventTypeUuid")
          .bind("eventTypeUuid", eventTypeUuid).mapTo(Integer.class).one();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public List<Event> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Override
  public Event insertInternal(Event event) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate(
          "/* insertEvents */ INSERT INTO events (uuid, status, \"eventTypeUuid\", name, description, "
              + "\"startDate\", \"endDate\", outcomes, \"ownerOrgUuid\", \"hostOrgUuid\","
              + " \"adminOrgUuid\", \"eventSeriesUuid\", \"locationUuid\", \"createdAt\", \"updatedAt\") "
              + "VALUES (:uuid, :status, :eventTypeUuid, :name, :description, "
              + ":startDate, :endDate, :outcomes, :ownerOrgUuid, :hostOrgUuid, "
              + ":adminOrgUuid, :eventSeriesUuid, :locationUuid, :createdAt, :updatedAt)")
          .bindBean(event).bind("createdAt", DaoUtils.asLocalDateTime(event.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(event.getUpdatedAt()))
          .bind("startDate", DaoUtils.asLocalDateTime(event.getStartDate()))
          .bind("endDate", DaoUtils.asLocalDateTime(event.getEndDate()))
          .bind("status", DaoUtils.getEnumId(event.getStatus()))
          .bind("eventTypeUuid", DaoUtils.getUuid(event.getEventType()))
          .bind("ownerOrgUuid", DaoUtils.getUuid(event.getOwnerOrg()))
          .bind("hostOrgUuid", DaoUtils.getUuid(event.getHostOrg()))
          .bind("adminOrgUuid", DaoUtils.getUuid(event.getAdminOrg()))
          .bind("eventSeriesUuid", DaoUtils.getUuid(event.getEventSeries()))
          .bind("locationId", DaoUtils.getUuid(event.getLocation())).execute();

      final EventBatch rb = handle.attach(EventBatch.class);

      if (event.getTasks() != null) {
        rb.insertEventTasks(event.getUuid(), event.getTasks());
      }

      if (event.getOrganizations() != null) {
        rb.insertEventOrganizations(event.getUuid(), event.getOrganizations());
      }

      if (event.getPeople() != null) {
        rb.insertEventPeople(event.getUuid(), event.getPeople());
      }

      return event;
    } finally {
      closeDbHandle(handle);
    }
  }

  public interface EventBatch {
    @SqlBatch("INSERT INTO \"eventTasks\" (\"eventUuid\", \"taskUuid\") VALUES (:eventUuid, :uuid)")
    void insertEventTasks(@Bind("eventUuid") String eventUuid, @BindBean List<Task> tasks);

    @SqlBatch("INSERT INTO \"eventOrganizations\" (\"eventUuid\", \"organizationUuid\") VALUES (:eventUuid, :uuid)")
    void insertEventOrganizations(@Bind("eventUuid") String eventUuid,
        @BindBean List<Organization> organizations);

    @SqlBatch("INSERT INTO \"eventPeople\" (\"eventUuid\", \"personUuid\") VALUES (:eventUuid, :uuid)")
    void insertEventPeople(@Bind("eventUuid") String eventUuid, @BindBean List<Person> people);

    @SqlBatch("INSERT INTO \"eventHostRelatedObjects\""
        + " (\"eventUuid\", \"relatedObjectType\", \"relatedObjectUuid\")"
        + " VALUES (:eventUuid, :relatedObjectType, :relatedObjectUuid)")
    void insertEventRelatedObjects(@Bind("eventUuid") String eventUuid,
        @BindBean List<GenericRelatedObject> eventHostRelatedObjects);

    @SqlUpdate("DELETE FROM \"eventHostRelatedObjects\"" + " WHERE \"eventUuid\" = :eventUuid")
    void deleteEventHostRelatedObjects(@Bind("eventUuid") String eventUuid);
  }

  @Override
  public int updateInternal(Event event) {
    final Handle handle = getDbHandle();
    try {
      final EventDao.EventBatch eb = handle.attach(EventDao.EventBatch.class);
      eb.deleteEventHostRelatedObjects(DaoUtils.getUuid(event)); // seems the easiest thing to
      // do
      if (event.getEventHostRelatedObjects() != null) {
        eb.insertEventRelatedObjects(DaoUtils.getUuid(event), event.getEventHostRelatedObjects());
      }
      return handle.createUpdate("/* updateEvent */ UPDATE events "
          + "SET status = :status, \"eventTypeUuid\" = :eventTypeUuid, name = :name, description = :description, "
          + "\"startDate\" = :startDate, \"endDate\" = :endDate, outcomes = :outcomes, "
          + "\"ownerOrgUuid\" = :ownerOrgUuid, \"hostOrgUuid\" = :hostOrgUuid, "
          + "\"adminOrgUuid\" = :adminOrgUuid, \"eventSeriesUuid\" = :eventSeriesUuid, "
          + "\"locationUuid\" = :locationUuid, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(event).bind("updatedAt", DaoUtils.asLocalDateTime(event.getUpdatedAt()))
          .bind("startDate", DaoUtils.asLocalDateTime(event.getStartDate()))
          .bind("endDate", DaoUtils.asLocalDateTime(event.getEndDate()))
          .bind("status", DaoUtils.getEnumId(event.getStatus()))
          .bind("eventTypeUuid", DaoUtils.getUuid(event.getEventType()))
          .bind("ownerOrgUuid", DaoUtils.getUuid(event.getOwnerOrg()))
          .bind("hostOrgUuid", DaoUtils.getUuid(event.getHostOrg()))
          .bind("adminOrgUuid", DaoUtils.getUuid(event.getAdminOrg()))
          .bind("eventSeriesUuid", DaoUtils.getUuid(event.getEventSeries()))
          .bind("eventSeriesUuid", DaoUtils.getUuid(event.getEventSeries()))
          .bind("locationUuid", DaoUtils.getUuid(event.getLocation())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int addTaskToEvent(Task t, Event e) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate(
              "/* addTaskToEvent */ INSERT INTO \"eventTasks\" (\"taskUuid\", \"eventUuid\") "
                  + "VALUES (:taskUuid, :eventUuid)")
          .bind("eventUuid", e.getUuid()).bind("taskUuid", t.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int addOrganizationToEvent(Organization o, Event e) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* addOrganizationToEvent */ INSERT INTO \"eventOrganizations\" (\"organizationUuid\", \"eventUuid\") "
              + "VALUES (:organizationUuid, :eventUuid)")
          .bind("eventUuid", e.getUuid()).bind("organizationUuid", o.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int addPersonToEvent(Person p, Event e) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate(
              "/* addPersonToEvent */ INSERT INTO \"eventPeople\" (\"personUuid\", \"eventUuid\") "
                  + "VALUES (:personUuid, :eventUuid)")
          .bind("eventUuid", e.getUuid()).bind("personUuid", p.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removeTaskFromEvent(String taskUuid, Event e) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* removeTaskFromEvent*/ DELETE FROM \"eventTasks\" "
              + "WHERE \"eventUuid\" = :eventUuid AND \"taskUuid\" = :taskUuid")
          .bind("eventUuid", e.getUuid()).bind("taskUuid", taskUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removeOrganizationFromEvent(String organizationUuid, Event e) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* removeOrganizationFromEvent*/ DELETE FROM \"eventOrganizations\" "
              + "WHERE \"eventUuid\" = :eventUuid AND \"organizationUuid\" = :organizationUuid")
          .bind("eventUuid", e.getUuid()).bind("organizationUuid", organizationUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removePersonFromEvent(String personUuid, Event e) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* removePersonFromEvent*/ DELETE FROM \"eventPeople\" "
              + "WHERE \"eventUuid\" = :eventUuid AND \"personUuid\" = :personUuid")
          .bind("eventUuid", e.getUuid()).bind("personUuid", personUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<Task>> getTasksForEvent(GraphQLContext context, String eventUuid) {
    return new ForeignKeyFetcher<Task>().load(context, FkDataLoaderKey.EVENT_TASKS, eventUuid);
  }

  public CompletableFuture<List<Organization>> getOrganizationsForEvent(GraphQLContext context,
      String eventUuid) {
    return new ForeignKeyFetcher<Organization>().load(context, FkDataLoaderKey.EVENT_ORGANIZATIONS,
        eventUuid);
  }

  public CompletableFuture<List<Person>> getPeopleForEvent(GraphQLContext context,
      String eventUuid) {
    return new ForeignKeyFetcher<Person>().load(context, FkDataLoaderKey.EVENT_PEOPLE, eventUuid);
  }


  @Override
  public AnetBeanList<Event> search(EventSearchQuery query) {
    return new PostgresqlEventSearcher(databaseHandler).runSearch(query);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Event obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "events.uuid");
  }
}
