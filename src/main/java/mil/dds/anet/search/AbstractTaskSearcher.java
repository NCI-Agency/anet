package mil.dds.anet.search;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
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

  protected void buildQuery(TaskSearchQuery query) {
    qb.addSelectClause("tasks.*");
    qb.addTotalCount();
    qb.addFromClause("tasks");

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      addBatchClause(query);
    }

    if (query.getResponsibleOrgUuid() != null) {
      addResponsibleOrgUuidQuery(query);
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

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(TaskSearchQuery query);

  @SuppressWarnings("unchecked")
  protected void addBatchClause(TaskSearchQuery query) {
    qb.addBatchClause((AbstractBatchParams<Task, TaskSearchQuery>) query.getBatchParams());
  }

  protected void addResponsibleOrgUuidQuery(TaskSearchQuery query) {
    if (query.getIncludeChildrenOrgs()) {
      qb.addRecursiveClause(null, "tasks", "\"organizationUuid\"", "parent_orgs", "organizations",
          "\"parentOrgUuid\"", "orgUuid", query.getResponsibleOrgUuid());
    } else {
      qb.addEqualsClause("orgUuid", "tasks.\"organizationUuid\"", query.getResponsibleOrgUuid());
    }
  }

  protected void addCustomFieldRef1UuidQuery(TaskSearchQuery query) {
    if (query.getCustomFieldRef1Recursively()) {
      qb.addRecursiveClause(null, "tasks", "\"customFieldRef1Uuid\"", "parent_tasks", "tasks",
          "\"customFieldRef1Uuid\"", "customFieldRef1Uuid", query.getCustomFieldRef1Uuid());
    } else {
      qb.addEqualsClause("customFieldRef1Uuid", "tasks.\"customFieldRef1Uuid\"",
          query.getCustomFieldRef1Uuid());
    }
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TaskSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tasks", "\"createdAt\""));
        break;
      case CATEGORY:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tasks", "category"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tasks", "\"shortName\""));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "tasks", "uuid"));
  }

}
