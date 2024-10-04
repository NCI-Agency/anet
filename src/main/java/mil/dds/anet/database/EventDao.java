package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.*;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.database.mappers.EventMapper;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class EventDao extends AnetSubscribableObjectDao<Event, EventSearchQuery> {

  private static final String[] fields = {"uuid", "status", "type", "name", "description",
      "hostOrgUuid", "adminOrgUuid", "eventSeriesUuid", "locationUuid", "startDate", "endDate",
      "outcomes", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "events";
  public static final String EVENT_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  @Override
  public Event getByUuid(String uuid) {
    return getByIds(Collections.singletonList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Event> {
    private static final String sql = "/* batch.getEventsByUuids */ SELECT " + EVENT_FIELDS
        + " from events where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new EventMapper());
    }
  }

  static class TasksBatcher extends ForeignKeyBatcher<Task> {
    private static final String sql = "/* batch.getTasksForEvent */ SELECT " + TaskDao.TASK_FIELDS
        + ", \"eventTasks\".\"eventUuid\" FROM tasks, \"eventTasks\" "
        + "WHERE \"eventTasks\".\"eventUuid\" IN ( <foreignKeys> ) "
        + "AND \"eventTasks\".\"taskUuid\" = tasks.uuid ORDER BY uuid";

    public TasksBatcher() {
      super(sql, "foreignKeys", new TaskMapper(), "eventUuid");
    }
  }

  static class OrganizationsBatcher extends ForeignKeyBatcher<Organization> {
    private static final String sql =
        "/* batch.getOrganizationsForEvent */ SELECT " + OrganizationDao.ORGANIZATION_FIELDS
            + ", \"eventOrganizations\".\"eventUuid\" FROM organizations, \"eventOrganizations\" "
            + "WHERE \"eventOrganizations\".\"eventUuid\" IN ( <foreignKeys> ) "
            + "AND \"eventOrganizations\".\"organizationUuid\" = organizations.uuid ORDER BY uuid";

    public OrganizationsBatcher() {
      super(sql, "foreignKeys", new OrganizationMapper(), "eventUuid");
    }
  }
  static class PeopleBatcher extends ForeignKeyBatcher<Person> {
    private static final String sql = "/* batch.getPeopleForEvent */ SELECT "
        + PersonDao.PERSON_FIELDS + ", \"eventPeople\".\"eventUuid\" FROM people, \"eventPeople\" "
        + "WHERE \"eventPeople\".\"eventUuid\" IN ( <foreignKeys> ) "
        + "AND \"eventPeople\".\"personUuid\" = people.uuid ORDER BY uuid";

    public PeopleBatcher() {
      super(sql, "foreignKeys", new PersonMapper(), "eventUuid");
    }
  }

  public List<List<Task>> getTasks(List<String> foreignKeys) {
    final ForeignKeyBatcher<Task> tasksBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(EventDao.TasksBatcher.class);
    return tasksBatcher.getByForeignKeys(foreignKeys);
  }

  public List<List<Organization>> getOrganizations(List<String> foreignKeys) {
    final ForeignKeyBatcher<Organization> organizationsBatcher = AnetObjectEngine.getInstance()
        .getInjector().getInstance(EventDao.OrganizationsBatcher.class);
    return organizationsBatcher.getByForeignKeys(foreignKeys);
  }

  public List<List<Person>> getPeople(List<String> foreignKeys) {
    final ForeignKeyBatcher<Person> organizationsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(EventDao.PeopleBatcher.class);
    return organizationsBatcher.getByForeignKeys(foreignKeys);
  }

  @Override
  public List<Event> getByIds(List<String> uuids) {
    final IdBatcher<Event> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public Event insertInternal(Event event) {
    getDbHandle().createUpdate(
        "/* insertEvents */ INSERT INTO events (uuid, status, type, name, description, "
            + "\"startDate\", \"endDate\", outcomes, "
            + "\"hostOrgUuid\",\"adminOrgUuid\", \"eventSeriesUuid\", \"locationUuid\", "
            + "\"createdAt\", \"updatedAt\") "
            + "VALUES (:uuid, :status, :type, :name, :description, :startDate, :endDate, :outcomes, "
            + ":hostOrgUuid, :adminOrgUuid, :eventSeriesUuid, :locationUuid, :createdAt, :updatedAt)")
        .bindBean(event).bind("createdAt", DaoUtils.asLocalDateTime(event.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(event.getUpdatedAt()))
        .bind("startDate", DaoUtils.asLocalDateTime(event.getStartDate()))
        .bind("endDate", DaoUtils.asLocalDateTime(event.getEndDate()))
        .bind("status", DaoUtils.getEnumId(event.getStatus()))
        .bind("hostOrgUuid", DaoUtils.getUuid(event.getHostOrg()))
        .bind("adminOrgUuid", DaoUtils.getUuid(event.getAdminOrg()))
        .bind("eventSeriesUuid", DaoUtils.getUuid(event.getEventSeries()))
        .bind("locationId", DaoUtils.getUuid(event.getLocation())).execute();

    final EventDao.EventBatch rb = getDbHandle().attach(EventDao.EventBatch.class);

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
  }

  public interface EventBatch {
    @SqlBatch("INSERT INTO \"eventTasks\" (\"eventUuid\", \"taskUuid\") VALUES (:eventUuid, :uuid)")
    void insertEventTasks(@Bind("eventUuid") String eventUuid, @BindBean List<Task> tasks);

    @SqlBatch("INSERT INTO \"eventOrganizations\" (\"eventUuid\", \"organizationUuid\") VALUES (:eventUuid, :uuid)")
    void insertEventOrganizations(@Bind("eventUuid") String eventUuid,
        @BindBean List<Organization> organizations);

    @SqlBatch("INSERT INTO \"eventPeople\" (\"eventUuid\", \"personUuid\") VALUES (:eventUuid, :uuid)")
    void insertEventPeople(@Bind("eventUuid") String eventUuid, @BindBean List<Person> people);
  }

  @Override
  public int updateInternal(Event event) {
    return getDbHandle().createUpdate("/* updateEvent */ UPDATE events "
        + "SET status = :status, type = :type, name = :name, description = :description, "
        + "\"startDate\" = :startDate, \"endDate\" = :endDate, outcomes = :outcomes, "
        + "\"hostOrgUuid\" = :hostOrgUuid, \"adminOrgUuid\" = :adminOrgUuid, \"eventSeriesUuid\" = :eventSeriesUuid, "
        + "\"locationUuid\" = :locationUuid, \"updatedAt\" = :updatedAt " + " WHERE uuid = :uuid")
        .bindBean(event).bind("updatedAt", DaoUtils.asLocalDateTime(event.getUpdatedAt()))
        .bind("startDate", DaoUtils.asLocalDateTime(event.getStartDate()))
        .bind("endDate", DaoUtils.asLocalDateTime(event.getEndDate()))
        .bind("status", DaoUtils.getEnumId(event.getStatus()))
        .bind("hostOrgUuid", DaoUtils.getUuid(event.getHostOrg()))
        .bind("adminOrgUuid", DaoUtils.getUuid(event.getAdminOrg()))
        .bind("eventSeriesUuid", DaoUtils.getUuid(event.getEventSeries()))
        .bind("eventSeriesUuid", DaoUtils.getUuid(event.getEventSeries()))
        .bind("locationUuid", DaoUtils.getUuid(event.getLocation())).execute();
  }

  @InTransaction
  public int addTaskToEvent(Task t, Event e) {
    return getDbHandle()
        .createUpdate(
            "/* addTaskToEvent */ INSERT INTO \"eventTasks\" (\"taskUuid\", \"eventUuid\") "
                + "VALUES (:taskUuid, :eventUuid)")
        .bind("eventUuid", e.getUuid()).bind("taskUuid", t.getUuid()).execute();
  }

  @InTransaction
  public int addOrganizationToEvent(Organization o, Event e) {
    return getDbHandle().createUpdate(
        "/* addOrganizationToEvent */ INSERT INTO \"eventOrganizations\" (\"organizationUuid\", \"eventUuid\") "
            + "VALUES (:organizationUuid, :eventUuid)")
        .bind("eventUuid", e.getUuid()).bind("organizationUuid", o.getUuid()).execute();
  }

  @InTransaction
  public int addPersonToEvent(Person p, Event e) {
    return getDbHandle()
        .createUpdate(
            "/* addPersonToEvent */ INSERT INTO \"eventPeople\" (\"personUuid\", \"eventUuid\") "
                + "VALUES (:personUuid, :eventUuid)")
        .bind("eventUuid", e.getUuid()).bind("personUuid", p.getUuid()).execute();
  }

  @InTransaction
  public int removeTaskFromEvent(String taskUuid, Event e) {
    return getDbHandle()
        .createUpdate("/* removeTaskFromEvent*/ DELETE FROM \"eventTasks\" "
            + "WHERE \"eventUuid\" = :eventUuid AND \"taskUuid\" = :taskUuid")
        .bind("eventUuid", e.getUuid()).bind("taskUuid", taskUuid).execute();
  }

  @InTransaction
  public int removeOrganizationFromEvent(String organizationUuid, Event e) {
    return getDbHandle()
        .createUpdate("/* removeOrganizationFromEvent*/ DELETE FROM \"eventOrganizations\" "
            + "WHERE \"eventUuid\" = :eventUuid AND \"organizationUuid\" = :organizationUuid")
        .bind("eventUuid", e.getUuid()).bind("organizationUuid", organizationUuid).execute();
  }

  @InTransaction
  public int removePersonFromEvent(String personUuid, Event e) {
    return getDbHandle()
        .createUpdate("/* removePersonFromEvent*/ DELETE FROM \"eventPeople\" "
            + "WHERE \"eventUuid\" = :eventUuid AND \"personUuid\" = :personUuid")
        .bind("eventUuid", e.getUuid()).bind("personUuid", personUuid).execute();
  }

  public CompletableFuture<List<Task>> getTasksForEvent(
      @GraphQLRootContext Map<String, Object> context, String eventUuid) {
    return new ForeignKeyFetcher<Task>().load(context, FkDataLoaderKey.EVENT_TASKS, eventUuid);
  }

  public CompletableFuture<List<Organization>> getOrganizationsForEvent(
      @GraphQLRootContext Map<String, Object> context, String eventUuid) {
    return new ForeignKeyFetcher<Organization>().load(context, FkDataLoaderKey.EVENT_ORGANIZATIONS,
        eventUuid);
  }

  public CompletableFuture<List<Person>> getPeopleForEvent(
      @GraphQLRootContext Map<String, Object> context, String eventUuid) {
    return new ForeignKeyFetcher<Person>().load(context, FkDataLoaderKey.EVENT_PEOPLE, eventUuid);
  }


  @Override
  public AnetBeanList<Event> search(EventSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getEventSearcher().runSearch(query);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Event obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "events.uuid");
  }
}
