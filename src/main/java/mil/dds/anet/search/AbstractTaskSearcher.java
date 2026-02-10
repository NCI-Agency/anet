package mil.dds.anet.search;

import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractTaskSearcher extends AbstractSearcher<Task, TaskSearchQuery>
    implements ITaskSearcher {

  protected AbstractTaskSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<Task, TaskSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<Task> runSearch(TaskSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new TaskMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(TaskSearchQuery query) {
    qb.addSelectClause(TaskDao.TASK_FIELDS);
    qb.addFromClause("tasks");

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      addBatchClause(query);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          engine().getTaskDao().getSubscriptionUpdate(null, false)));
    }

    if (!Utils.isEmptyOrNull(query.getTaskedOrgUuid())) {
      addTaskedOrgUuidQuery(query);
    }

    if (query.getIsAssigned() != null) {
      qb.addWhereClause(
          String.format("tasks.uuid%sIN (SELECT \"taskUuid\" FROM \"taskTaskedOrganizations\")",
              query.getIsAssigned() ? " " : " NOT "));
    }

    qb.addStringEqualsClause("category", "tasks.category", query.getCategory());
    qb.addEnumEqualsClause("status", "tasks.status", query.getStatus());
    qb.addDateRangeClause("plannedCompletionStart", "tasks.\"plannedCompletion\"", Comparison.AFTER,
        query.getPlannedCompletionStart(), "plannedCompletionEnd", "tasks.\"plannedCompletion\"",
        Comparison.BEFORE, query.getPlannedCompletionEnd());
    qb.addDateRangeClause("projectedCompletionStart", "tasks.\"projectedCompletion\"",
        Comparison.AFTER, query.getProjectedCompletionStart(), "projectedCompletionEnd",
        "tasks.\"projectedCompletion\"", Comparison.BEFORE, query.getProjectedCompletionEnd());

    if (query.getSelectable() != null) {
      if (query.getSelectable()) {
        qb.addWhereClause("tasks.selectable IS TRUE");
      } else {
        qb.addWhereClause("tasks.selectable IS NOT TRUE");
      }
    }

    if (!Utils.isEmptyOrNull(query.getParentTaskUuid())) {
      addParentTaskUuidQuery(query);
    }

    if (query.getResponsiblePositionUuid() != null) {
      addResponsiblePositionUuidQuery(query);
    }

    if (query.getAssessment() != null && query.getAssessment().key() != null) {
      addAssessmentQuery(query.getAssessment(), TaskDao.TABLE_NAME, "task");
    }

    if (!Utils.isEmptyOrNull(query.getEventUuid())) {
      addEventQuery(query);
    }

    if (Boolean.TRUE.equals(query.isInMyReports())) {
      qb.addSelectClause("\"inMyReports\".max AS \"inMyReports_max\"");
      qb.addFromClause("JOIN ("
          + "  SELECT \"reportTasks\".\"taskUuid\" AS uuid, MAX(reports.\"createdAt\") AS max"
          + "  FROM reports"
          + "  JOIN \"reportTasks\" ON reports.uuid = \"reportTasks\".\"reportUuid\""
          + "  WHERE reports.uuid IN (SELECT \"reportUuid\" FROM \"reportPeople\""
          + "    WHERE \"isAuthor\" = :isAuthor AND \"personUuid\" = :userUuid)"
          + "  GROUP BY \"reportTasks\".\"taskUuid\""
          + ") \"inMyReports\" ON tasks.uuid = \"inMyReports\".uuid");
      qb.addSqlArg("isAuthor", true);
      qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
    }

    if (query.getEmailNetwork() != null) {
      // Should never match
      qb.addWhereClause("FALSE");
    }

    addOrderByClauses(qb, query);
  }

  @SuppressWarnings("unchecked")
  protected void addBatchClause(TaskSearchQuery query) {
    qb.addBatchClause((AbstractBatchParams<Task, TaskSearchQuery>) query.getBatchParams());
  }

  protected void addTaskedOrgUuidQuery(TaskSearchQuery query) {
    qb.addFromClause(
        "LEFT JOIN \"taskTaskedOrganizations\" ON tasks.uuid = \"taskTaskedOrganizations\".\"taskUuid\"");

    if (RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy())
        || RecurseStrategy.PARENTS.equals(query.getOrgRecurseStrategy())) {
      qb.addRecursiveClause(null, "\"taskTaskedOrganizations\"", "\"organizationUuid\"",
          "parent_orgs", "organizations", "\"parentOrgUuid\"", "orgUuid", query.getTaskedOrgUuid(),
          RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy()), null);
    } else {
      qb.addInListClause("orgUuid", "\"taskTaskedOrganizations\".\"organizationUuid\"",
          query.getTaskedOrgUuid());
    }
  }

  protected void addParentTaskUuidQuery(TaskSearchQuery query) {
    if (RecurseStrategy.CHILDREN.equals(query.getParentTaskRecurseStrategy())
        || RecurseStrategy.PARENTS.equals(query.getParentTaskRecurseStrategy())) {
      qb.addRecursiveClause(null, "tasks", "\"uuid\"", "parent_tasks", "tasks",
          "\"parentTaskUuid\"", "parentTaskUuid", query.getParentTaskUuid(),
          RecurseStrategy.CHILDREN.equals(query.getParentTaskRecurseStrategy()), null);
    } else if (query.getParentTaskUuid().size() == 1
        && Task.DUMMY_TASK_UUID.equals(query.getParentTaskUuid().get(0))) {
      qb.addIsNullOrEmptyClause("tasks.\"parentTaskUuid\"");
    } else {
      qb.addInListClause("parentTaskUuid", "tasks.\"parentTaskUuid\"", query.getParentTaskUuid());
    }
  }

  protected void addResponsiblePositionUuidQuery(TaskSearchQuery query) {
    qb.addFromClause(
        "LEFT JOIN \"taskResponsiblePositions\" ON tasks.uuid = \"taskResponsiblePositions\".\"taskUuid\"");

    qb.addStringEqualsClause("responsiblePositionUuid",
        "\"taskResponsiblePositions\".\"positionUuid\"", query.getResponsiblePositionUuid());
  }

  protected void addEventQuery(TaskSearchQuery query) {
    qb.addFromClause("INNER JOIN \"eventTasks\" et ON et.\"taskUuid\" = tasks.uuid");
    if (Event.DUMMY_EVENT_UUID.equals(query.getEventUuid())) {
      qb.addWhereClause("et.\"eventUuid\" IS NULL");
    } else {
      qb.addStringEqualsClause("eventUuid", "et.\"eventUuid\"", query.getEventUuid());
    }
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TaskSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tasks_createdAt"));
        break;
      case CATEGORY:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tasks_category"));
        break;
      case RECENT:
        if (Boolean.TRUE.equals(query.isInMyReports())) {
          // Otherwise the JOIN won't exist
          qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "inMyReports_max"));
        }
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tasks_shortName"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "tasks_uuid"));
  }

}
