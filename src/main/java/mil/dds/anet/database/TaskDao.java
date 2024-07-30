package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.pg.PostgresqlTaskSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TaskDao extends AnetSubscribableObjectDao<Task, TaskSearchQuery> {

  private static final String[] fields = {"uuid", "shortName", "longName", "status", "description",
      "selectable", "category", "createdAt", "updatedAt", "projectedCompletion",
      "plannedCompletion", "parentTaskUuid", "customFields"};
  public static final String TABLE_NAME = "tasks";
  public static final String TASK_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public TaskDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public Task getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Task> {
    private static final String SQL = "/* batch.getTasksByUuids */ SELECT " + TASK_FIELDS
        + " FROM tasks WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(databaseHandler, SQL, "uuids", new TaskMapper());
    }
  }

  @Override
  public List<Task> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  class ResponsiblePositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String SQL =
        "/* batch.getResponsiblePositionsForTask */ SELECT \"taskUuid\", "
            + PositionDao.POSITION_FIELDS + " FROM positions, \"taskResponsiblePositions\" "
            + "WHERE \"taskResponsiblePositions\".\"taskUuid\" IN ( <foreignKeys> ) "
            + "AND \"taskResponsiblePositions\".\"positionUuid\" = positions.uuid";

    public ResponsiblePositionsBatcher() {
      super(databaseHandler, SQL, "foreignKeys", new PositionMapper(), "taskUuid");
    }
  }

  public List<List<Position>> getResponsiblePositions(List<String> foreignKeys) {
    return new ResponsiblePositionsBatcher().getByForeignKeys(foreignKeys);
  }

  class TaskedOrganizationsBatcher extends ForeignKeyBatcher<Organization> {
    private static final String sql =
        "/* batch.getTaskedOrganizationsForTask */ SELECT \"taskUuid\", "
            + OrganizationDao.ORGANIZATION_FIELDS
            + " FROM organizations, \"taskTaskedOrganizations\" "
            + "WHERE \"taskTaskedOrganizations\".\"taskUuid\" IN ( <foreignKeys> ) "
            + "AND \"taskTaskedOrganizations\".\"organizationUuid\" = organizations.uuid";

    public TaskedOrganizationsBatcher() {
      super(databaseHandler, sql, "foreignKeys", new OrganizationMapper(), "taskUuid");
    }
  }

  public List<List<Organization>> getTaskedOrganizations(List<String> foreignKeys) {
    return new TaskedOrganizationsBatcher().getByForeignKeys(foreignKeys);
  }

  static class TaskSearchBatcher extends SearchQueryBatcher<Task, TaskSearchQuery> {
    public TaskSearchBatcher() {
      super(ApplicationContextProvider.getEngine().getTaskDao());
    }
  }

  public List<List<Task>> getTasksBySearch(
      List<ImmutablePair<String, TaskSearchQuery>> foreignKeys) {
    return new TaskSearchBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Task>> getTasksBySearch(GraphQLContext context, String uuid,
      TaskSearchQuery query) {
    return new SearchQueryFetcher<Task, TaskSearchQuery>().load(context,
        SqDataLoaderKey.TASKS_SEARCH, new ImmutablePair<>(uuid, query));
  }

  @Override
  public Task insertInternal(Task p) {
    final Handle handle = getDbHandle();
    try {
      handle
          .createUpdate("/* insertTask */ INSERT INTO tasks "
              + "(uuid, \"longName\", \"shortName\", category, \"parentTaskUuid\", \"createdAt\", "
              + "\"updatedAt\", status, selectable, description, "
              + "\"plannedCompletion\", \"projectedCompletion\", \"customFields\") "
              + "VALUES (:uuid, :longName, :shortName, :category, :parentTaskUuid, :createdAt, "
              + ":updatedAt, :status, :selectable, :description, "
              + ":plannedCompletion, :projectedCompletion, :customFields)")
          .bindBean(p).bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("plannedCompletion", DaoUtils.asLocalDateTime(p.getPlannedCompletion()))
          .bind("projectedCompletion", DaoUtils.asLocalDateTime(p.getProjectedCompletion()))
          .bind("status", DaoUtils.getEnumId(p.getStatus())).execute();
      final TaskBatch tb = handle.attach(TaskBatch.class);
      if (p.getTaskedOrganizations() != null) {
        tb.inserttaskTaskedOrganizations(p.getUuid(), p.getTaskedOrganizations());
      }
      if (p.getResponsiblePositions() != null) {
        tb.inserttaskResponsiblePositions(p.getUuid(), p.getResponsiblePositions());
      }
      return p;
    } finally {
      closeDbHandle(handle);
    }
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
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* updateTask */ UPDATE tasks set \"longName\" = :longName, \"shortName\" = :shortName, "
              + "category = :category, \"parentTaskUuid\" = :parentTaskUuid, "
              + "\"updatedAt\" = :updatedAt, status = :status, selectable = :selectable, "
              + "description = :description, \"plannedCompletion\" = :plannedCompletion, "
              + "\"projectedCompletion\" = :projectedCompletion, \"customFields\" = :customFields "
              + "WHERE uuid = :uuid")
          .bindBean(p).bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("plannedCompletion", DaoUtils.asLocalDateTime(p.getPlannedCompletion()))
          .bind("projectedCompletion", DaoUtils.asLocalDateTime(p.getProjectedCompletion()))
          .bind("status", DaoUtils.getEnumId(p.getStatus())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int addPositionToTask(Position p, Task t) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* addPositionToTask */ INSERT INTO \"taskResponsiblePositions\" (\"taskUuid\", \"positionUuid\") "
              + "VALUES (:taskUuid, :positionUuid)")
          .bind("taskUuid", t.getUuid()).bind("positionUuid", p.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removePositionFromTask(String positionUuid, String taskUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* removePositionFromTask*/ DELETE FROM \"taskResponsiblePositions\" "
              + "WHERE \"taskUuid\" = :taskUuid AND \"positionUuid\" = :positionUuid")
          .bind("taskUuid", taskUuid).bind("positionUuid", positionUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<Position>> getResponsiblePositionsForTask(GraphQLContext context,
      String taskUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.TASK_RESPONSIBLE_POSITIONS, taskUuid);
  }

  @Transactional
  public int addTaskedOrganizationsToTask(Organization o, Task t) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* addTaskedOrganizationsToTask */ INSERT INTO \"taskTaskedOrganizations\" (\"taskUuid\", \"organizationUuid\") "
              + "VALUES (:taskUuid, :organizationUuid)")
          .bind("taskUuid", t.getUuid()).bind("organizationUuid", o.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removeTaskedOrganizationsFromTask(String organizationUuid, String taskUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate(
              "/* removeTaskedOrganizationsFromTask*/ DELETE FROM \"taskTaskedOrganizations\" "
                  + "WHERE \"taskUuid\" = :taskUuid AND \"organizationUuid\" = :organizationUuid")
          .bind("taskUuid", taskUuid).bind("organizationUuid", organizationUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<Organization>> getTaskedOrganizationsForTask(GraphQLContext context,
      String taskUuid) {
    return new ForeignKeyFetcher<Organization>().load(context,
        FkDataLoaderKey.TASK_TASKED_ORGANIZATIONS, taskUuid);
  }

  @Override
  public AnetBeanList<Task> search(TaskSearchQuery query) {
    return new PostgresqlTaskSearcher(databaseHandler).runSearch(query);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Task obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "tasks.uuid");
  }

}
