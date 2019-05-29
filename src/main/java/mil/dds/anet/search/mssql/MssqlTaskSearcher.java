package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlTaskSearcher extends AbstractSearcher implements ITaskSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Task> runSearch(TaskSearchQuery query) {
    final MssqlSearchQueryBuilder<Task, TaskSearchQuery> qb =
        new MssqlSearchQueryBuilder<Task, TaskSearchQuery>("MssqlTaskSearch");
    qb.addSelectClause("tasks.*");
    qb.addSelectClause("COUNT(*) OVER() AS totalCount");
    qb.addFromClause("tasks");

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (giving LIKE matches the highest
      // possible score)
      // so we can sort on it (show the most relevant hits at the top).
      qb.addSelectClause("ISNULL(c_tasks.rank, 0)"
          + " + CASE WHEN tasks.shortName LIKE :likeQuery THEN 1000 ELSE 0 END"
          + " AS search_rank");
      qb.addFromClause("LEFT JOIN CONTAINSTABLE (tasks, (longName), :containsQuery) c_tasks"
          + " ON tasks.uuid = c_tasks.[Key]");
      qb.addWhereClause("(c_tasks.rank IS NOT NULL OR tasks.shortName LIKE :likeQuery)");
      final String text = query.getText();
      qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
      qb.addSqlArg("likeQuery", Utils.prepForLikeQuery(text) + "%");
    }

    if (query.getResponsibleOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getIncludeChildrenOrgs())) {
        qb.addWithClause("parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        qb.addWhereClause("organizationUuid IN (SELECT uuid from parent_orgs)");
        qb.addSqlArg("orgUuid", query.getResponsibleOrgUuid());
      } else {
        qb.addEqualsClause("orgUuid", "organizationUuid", query.getResponsibleOrgUuid());
      }
    }

    qb.addEqualsClause("category", "category", query.getCategory());
    qb.addEqualsClause("status", "status", query.getStatus());
    qb.addLikeClause("projectStatus", "customFieldEnum1", query.getProjectStatus());
    qb.addDateClause("plannedCompletionStart", "plannedCompletion", Comparison.AFTER,
        query.getPlannedCompletionStart());
    qb.addDateClause("plannedCompletionEnd", "plannedCompletion", Comparison.BEFORE,
        query.getPlannedCompletionEnd());
    qb.addDateClause("projectedCompletionStart", "projectedCompletion", Comparison.AFTER,
        query.getProjectedCompletionStart());
    qb.addDateClause("projectedCompletionEnd", "projectedCompletion", Comparison.BEFORE,
        query.getProjectedCompletionEnd());
    qb.addLikeClause("customField", "customField", query.getCustomField());

    if (query.getCustomFieldRef1Uuid() != null) {
      if (Boolean.TRUE.equals(query.getCustomFieldRef1Recursively())) {
        qb.addWithClause("parent_tasks(uuid) AS ("
            + " SELECT uuid FROM tasks WHERE uuid = :customFieldRef1Uuid UNION ALL"
            + " SELECT t.uuid from parent_tasks pt, tasks t WHERE t.customFieldRef1Uuid = pt.uuid AND t.uuid != :customFieldRef1Uuid"
            + ")");
        qb.addWhereClause("(tasks.customFieldRef1Uuid IN (SELECT uuid from parent_tasks)"
            + " OR tasks.uuid = :customFieldRef1Uuid)");
        qb.addSqlArg("customFieldRef1Uuid", query.getCustomFieldRef1Uuid());
      } else {
        qb.addEqualsClause("customFieldRef1Uuid", "tasks.customFieldRef1Uuid",
            query.getCustomFieldRef1Uuid());
      }
    }

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new TaskMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TaskSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "tasks", "createdAt"));
        break;
      case CATEGORY:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "tasks", "category"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), "tasks", "shortName", "longName"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "tasks", "uuid"));
  }

}
