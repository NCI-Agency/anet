package mil.dds.anet.search;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
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

  @Override
  protected void buildQuery(TaskSearchQuery query) {
    qb.addSelectClause("tasks.*");
    qb.addTotalCount();
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

  protected void addResponsibleOrgUuidQuery(TaskSearchQuery query) {
    if (Boolean.TRUE.equals(query.getIncludeChildrenOrgs())) {
      qb.addWithClause("parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
          + " SELECT o.uuid FROM parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
          + ")");
      qb.addWhereClause("tasks.\"organizationUuid\" IN (SELECT uuid FROM parent_orgs)");
      qb.addSqlArg("orgUuid", query.getResponsibleOrgUuid());
    } else {
      qb.addEqualsClause("orgUuid", "tasks.\"organizationUuid\"", query.getResponsibleOrgUuid());
    }
  }

  protected void addCustomFieldRef1UuidQuery(TaskSearchQuery query) {
    if (Boolean.TRUE.equals(query.getCustomFieldRef1Recursively())) {
      qb.addWithClause("parent_tasks(uuid) AS ("
          + " SELECT uuid FROM tasks WHERE uuid = :customFieldRef1Uuid UNION ALL"
          + " SELECT t.uuid FROM parent_tasks pt, tasks t WHERE t.\"customFieldRef1Uuid\" = pt.uuid AND t.uuid != :customFieldRef1Uuid"
          + ")");
      qb.addWhereClause("(tasks.\"customFieldRef1Uuid\" IN (SELECT uuid FROM parent_tasks)"
          + " OR tasks.uuid = :customFieldRef1Uuid)");
      qb.addSqlArg("customFieldRef1Uuid", query.getCustomFieldRef1Uuid());
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
        qb.addAllOrderByClauses(
            getOrderBy(query.getSortOrder(), "tasks", "\"shortName\"", "\"longName\""));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "tasks", "uuid"));
  }

}
