package mil.dds.anet.search;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.utils.Utils;
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
    qb.addFromClause("tasks");

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    if (query.getResponsibleOrgUuid() != null) {
      addResponsibleOrgUuidQuery(query);
    }

    qb.addEqualsClause("category", "tasks.category", query.getCategory());
    qb.addEqualsClause("status", "tasks.status", query.getStatus());
    qb.addLikeClause("projectStatus", "tasks.\"customFieldEnum1\"", query.getProjectStatus());
    qb.addDateClause("plannedCompletionStart", "tasks.\"plannedCompletion\"", Comparison.AFTER,
        query.getPlannedCompletionStart());
    qb.addDateClause("plannedCompletionEnd", "tasks.\"plannedCompletion\"", Comparison.BEFORE,
        query.getPlannedCompletionEnd());
    qb.addDateClause("projectedCompletionStart", "tasks.\"projectedCompletion\"", Comparison.AFTER,
        query.getProjectedCompletionStart());
    qb.addDateClause("projectedCompletionEnd", "tasks.\"projectedCompletion\"", Comparison.BEFORE,
        query.getProjectedCompletionEnd());
    qb.addLikeClause("customField", "tasks.\"customField\"", query.getCustomField());

    if (query.getCustomFieldRef1Uuid() != null) {
      addCustomFieldRef1UuidQuery(query);
    }

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(TaskSearchQuery query);

  protected abstract void addResponsibleOrgUuidQuery(TaskSearchQuery query);

  protected abstract void addCustomFieldRef1UuidQuery(TaskSearchQuery query);

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TaskSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "tasks", "\"createdAt\""));
        break;
      case CATEGORY:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "tasks", "category"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), "tasks", "\"shortName\"", "\"longName\""));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "tasks", "uuid"));
  }

}
