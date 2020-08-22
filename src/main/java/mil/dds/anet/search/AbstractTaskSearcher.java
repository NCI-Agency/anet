package mil.dds.anet.search;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractTaskSearcher extends AbstractSearcher<Task, TaskSearchQuery>
    implements ITaskSearcher {

  public AbstractTaskSearcher(AbstractSearchQueryBuilder<Task, TaskSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Task> runSearch(TaskSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new TaskMapper());
  }

  @Override
  protected void buildQuery(TaskSearchQuery query) {
    qb.addSelectClause("tasks.*");
    qb.addTotalCount();
    qb.addFromClause("tasks");

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      addBatchClause(query);
    }

    if (query.getTaskedOrgUuid() != null) {
      addTaskedOrgUuidQuery(query);
    }

    qb.addEqualsClause("category", "tasks.category", query.getCategory());
    qb.addEqualsClause("status", "tasks.status", query.getStatus());
    qb.addLikeClause("projectStatus", "tasks.\"customFieldEnum1\"", query.getProjectStatus());
    qb.addDateRangeClause("plannedCompletionStart", "tasks.\"plannedCompletion\"", Comparison.AFTER,
        query.getPlannedCompletionStart(), "plannedCompletionEnd", "tasks.\"plannedCompletion\"",
        Comparison.BEFORE, query.getPlannedCompletionEnd());
    qb.addDateRangeClause("projectedCompletionStart", "tasks.\"projectedCompletion\"",
        Comparison.AFTER, query.getProjectedCompletionStart(), "projectedCompletionEnd",
        "tasks.\"projectedCompletion\"", Comparison.BEFORE, query.getProjectedCompletionEnd());
    qb.addLikeClause("customField", "tasks.\"customField\"", query.getCustomField());

    if (query.getHasCustomFieldRef1() != null) {
      if (query.getHasCustomFieldRef1()) {
        qb.addWhereClause("tasks.\"customFieldRef1Uuid\" IS NOT NULL");
      } else {
        qb.addWhereClause("tasks.\"customFieldRef1Uuid\" IS NULL");
      }
    }

    if (query.getCustomFieldRef1Uuid() != null) {
      addCustomFieldRef1UuidQuery(query);
    }

    if (query.getResponsiblePositionUuid() != null) {
      addResponsiblePositionUuidQuery(query);
    }

    if (Boolean.TRUE.equals(query.isInMyReports())) {
      qb.addFromClause("JOIN ("
          + "  SELECT \"reportTasks\".\"taskUuid\" AS uuid, MAX(reports.\"createdAt\") AS max"
          + "  FROM reports"
          + "  JOIN \"reportTasks\" ON reports.uuid = \"reportTasks\".\"reportUuid\""
          + "  WHERE reports.\"authorUuid\" = :userUuid GROUP BY \"reportTasks\".\"taskUuid\""
          + ") \"inMyReports\" ON tasks.uuid = \"inMyReports\".uuid");
      qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
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
          RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy()));
    } else {
      qb.addEqualsClause("orgUuid", "\"taskTaskedOrganizations\".\"organizationUuid\"",
          query.getTaskedOrgUuid());
    }
  }

  protected void addCustomFieldRef1UuidQuery(TaskSearchQuery query) {
    if (query.getCustomFieldRef1Recursively()) {
      qb.addRecursiveClause(null, "tasks", "\"customFieldRef1Uuid\"", "parent_tasks", "tasks",
          "\"customFieldRef1Uuid\"", "customFieldRef1Uuid", query.getCustomFieldRef1Uuid(), true);
    } else {
      qb.addInListClause("customFieldRef1Uuid", "tasks.\"customFieldRef1Uuid\"",
          query.getCustomFieldRef1Uuid());
    }
  }

  protected void addResponsiblePositionUuidQuery(TaskSearchQuery query) {
    qb.addFromClause(
        "LEFT JOIN \"taskResponsiblePositions\" ON tasks.uuid = \"taskResponsiblePositions\".\"taskUuid\"");

    qb.addEqualsClause("responsiblePositionUuid", "\"taskResponsiblePositions\".\"positionUuid\"",
        query.getResponsiblePositionUuid());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TaskSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tasks", "\"createdAt\""));
        break;
      case CATEGORY:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tasks", "category"));
        break;
      case RECENT:
        if (Boolean.TRUE.equals(query.isInMyReports())) {
          // Otherwise the JOIN won't exist
          qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "\"inMyReports\"", "max"));
        }
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tasks", "\"shortName\""));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "tasks", "uuid"));
  }

}
