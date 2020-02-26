package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class TaskDao extends AnetSubscribableObjectDao<Task, TaskSearchQuery> {

  public static final String TABLE_NAME = "tasks";

  @Override
  public Task getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Task> {
    private static final String sql =
        "/* batch.getTasksByUuids */ SELECT * from tasks where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new TaskMapper());
    }
  }

  @Override
  public List<Task> getByIds(List<String> uuids) {
    final IdBatcher<Task> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  static class ResponsiblePositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String sql =
        "/* batch.getResponsiblePositionsForTask */ SELECT \"taskUuid\", "
            + PositionDao.POSITIONS_FIELDS + " FROM positions, \"taskResponsiblePositions\" "
            + "WHERE \"taskResponsiblePositions\".\"taskUuid\" IN ( <foreignKeys> ) "
            + "AND \"taskResponsiblePositions\".\"positionUuid\" = positions.uuid";

    public ResponsiblePositionsBatcher() {
      super(sql, "foreignKeys", new PositionMapper(), "taskUuid");
    }
  }

  public List<List<Position>> getResponsiblePositions(List<String> foreignKeys) {
    final ForeignKeyBatcher<Position> responsiblePositionsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(ResponsiblePositionsBatcher.class);
    return responsiblePositionsBatcher.getByForeignKeys(foreignKeys);
  }

  static class TaskedOrganizationsBatcher extends ForeignKeyBatcher<Organization> {
    private static final String sql =
        "/* batch.getTaskedOrganizationsForTask */ SELECT \"taskUuid\", "
            + OrganizationDao.ORGANIZATION_FIELDS
            + " FROM organizations, \"taskTaskedOrganizations\" "
            + "WHERE \"taskTaskedOrganizations\".\"taskUuid\" IN ( <foreignKeys> ) "
            + "AND \"taskTaskedOrganizations\".\"organizationUuid\" = organizations.uuid";

    public TaskedOrganizationsBatcher() {
      super(sql, "foreignKeys", new OrganizationMapper(), "taskUuid");
    }
  }

  public List<List<Organization>> getTaskedOrganizations(List<String> foreignKeys) {
    final ForeignKeyBatcher<Organization> taskedOrganizationsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(TaskedOrganizationsBatcher.class);
    return taskedOrganizationsBatcher.getByForeignKeys(foreignKeys);
  }

  static class TaskSearchBatcher extends SearchQueryBatcher<Task, TaskSearchQuery> {
    public TaskSearchBatcher() {
      super(AnetObjectEngine.getInstance().getTaskDao());
    }
  }

  public List<List<Task>> getTasksBySearch(
      List<ImmutablePair<String, TaskSearchQuery>> foreignKeys) {
    final TaskSearchBatcher instance =
        AnetObjectEngine.getInstance().getInjector().getInstance(TaskSearchBatcher.class);
    return instance.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Task>> getTasksBySearch(Map<String, Object> context, String uuid,
      TaskSearchQuery query) {
    return new SearchQueryFetcher<Task, TaskSearchQuery>().load(context,
        SqDataLoaderKey.TASKS_SEARCH, new ImmutablePair<>(uuid, query));
  }

  @Override
  public Task insertInternal(Task p) {
    getDbHandle().createUpdate("/* insertTask */ INSERT INTO tasks "
        + "(uuid, \"longName\", \"shortName\", category, \"customFieldRef1Uuid\", \"createdAt\", \"updatedAt\", status, "
        + "\"customField\", \"customFieldEnum1\", \"customFieldEnum2\", \"plannedCompletion\", \"projectedCompletion\", \"customFields\") "
        + "VALUES (:uuid, :longName, :shortName, :category, :customFieldRef1Uuid, :createdAt, :updatedAt, :status, "
        + ":customField, :customFieldEnum1, :customFieldEnum2, :plannedCompletion, :projectedCompletion, :customFields)")
        .bindBean(p).bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
        .bind("plannedCompletion", DaoUtils.asLocalDateTime(p.getPlannedCompletion()))
        .bind("projectedCompletion", DaoUtils.asLocalDateTime(p.getProjectedCompletion()))
        .bind("status", DaoUtils.getEnumId(p.getStatus())).execute();
    final TaskBatch tb = getDbHandle().attach(TaskBatch.class);
    if (p.getTaskedOrganizations() != null) {
      tb.inserttaskTaskedOrganizations(p.getUuid(), p.getTaskedOrganizations());
    }
    if (p.getResponsiblePositions() != null) {
      tb.inserttaskResponsiblePositions(p.getUuid(), p.getResponsiblePositions());
    }
    return p;
  }

  public interface TaskBatch {
    @SqlBatch("INSERT INTO \"taskResponsiblePositions\" (\"taskUuid\", \"positionUuid\") VALUES (:taskUuid, :uuid)")
    void inserttaskResponsiblePositions(@Bind("taskUuid") String taskUuid,
        @BindBean List<Position> responsiblePositions);

    @SqlBatch("INSERT INTO \"taskTaskedOrganizations\" (\"taskUuid\", \"organizationUuid\") VALUES (:taskUuid, :uuid)")
    void inserttaskTaskedOrganizations(@Bind("taskUuid") String taskUuid,
        @BindBean List<Organization> taskedOrganizations);
  }

  @Override
  public int updateInternal(Task p) {
    return getDbHandle().createUpdate(
        "/* updateTask */ UPDATE tasks set \"longName\" = :longName, \"shortName\" = :shortName, "
            + "category = :category, \"customFieldRef1Uuid\" = :customFieldRef1Uuid, \"updatedAt\" = :updatedAt, status = :status, "
            + "\"customField\" = :customField, \"customFieldEnum1\" = :customFieldEnum1, \"customFieldEnum2\" = :customFieldEnum2, "
            + "\"plannedCompletion\" = :plannedCompletion, \"projectedCompletion\" = :projectedCompletion, "
            + "\"customFields\" = :customFields " + "WHERE uuid = :uuid")
        .bindBean(p).bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
        .bind("plannedCompletion", DaoUtils.asLocalDateTime(p.getPlannedCompletion()))
        .bind("projectedCompletion", DaoUtils.asLocalDateTime(p.getProjectedCompletion()))
        .bind("status", DaoUtils.getEnumId(p.getStatus())).execute();
  }

  @InTransaction
  public int addPositionToTask(Position p, Task t) {
    return getDbHandle().createUpdate(
        "/* addPositionToTask */ INSERT INTO \"taskResponsiblePositions\" (\"taskUuid\", \"positionUuid\") "
            + "VALUES (:taskUuid, :positionUuid)")
        .bind("taskUuid", t.getUuid()).bind("positionUuid", p.getUuid()).execute();
  }

  @InTransaction
  public int removePositionFromTask(Position p, Task t) {
    return getDbHandle()
        .createUpdate("/* removePositionFromTask*/ DELETE FROM \"taskResponsiblePositions\" "
            + "WHERE \"taskUuid\" = :taskUuid AND \"positionUuid\" = :positionUuid")
        .bind("taskUuid", t.getUuid()).bind("positionUuid", p.getUuid()).execute();
  }

  public CompletableFuture<List<Position>> getResponsiblePositionsForTask(
      Map<String, Object> context, String taskUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.TASK_RESPONSIBLE_POSITIONS, taskUuid);
  }

  @InTransaction
  public int addTaskedOrganizationsToTask(Organization o, Task t) {
    return getDbHandle().createUpdate(
        "/* addTaskedOrganizationsToTask */ INSERT INTO \"taskTaskedOrganizations\" (\"taskUuid\", \"organizationUuid\") "
            + "VALUES (:taskUuid, :organizationUuid)")
        .bind("taskUuid", t.getUuid()).bind("organizationUuid", o.getUuid()).execute();
  }

  @InTransaction
  public int removeTaskedOrganizationsFromTask(Organization o, String taskUuid) {
    return getDbHandle()
        .createUpdate(
            "/* removeTaskedOrganizationsFromTask*/ DELETE FROM \"taskTaskedOrganizations\" "
                + "WHERE \"taskUuid\" = :taskUuid AND \"organizationUuid\" = :organizationUuid")
        .bind("taskUuid", taskUuid).bind("organizationUuid", o.getUuid()).execute();
  }

  public CompletableFuture<List<Organization>> getTaskedOrganizationsForTask(
      Map<String, Object> context, String taskUuid) {
    return new ForeignKeyFetcher<Organization>().load(context,
        FkDataLoaderKey.TASK_TASKED_ORGANIZATIONS, taskUuid);
  }

  @InTransaction
  public List<Task> getTopLevelTasks() {
    return getDbHandle()
        .createQuery("/* getTopTasks */ SELECT * FROM tasks WHERE \"customFieldRef1Uuid\" IS NULL")
        .map(new TaskMapper()).list();
  }

  @Override
  public AnetBeanList<Task> search(TaskSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getTaskSearcher().runSearch(query);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Task obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "tasks.uuid");
  }

}
