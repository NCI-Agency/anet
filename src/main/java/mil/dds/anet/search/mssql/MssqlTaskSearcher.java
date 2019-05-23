package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlTaskSearcher extends AbstractMssqlSearcherBase<Task, TaskSearchQuery>
    implements ITaskSearcher {

  @Override
  public AnetBeanList<Task> runSearch(TaskSearchQuery query) {
    start("MssqlTaskSearch");
    selectClauses.add("tasks.*");
    selectClauses.add("COUNT(*) OVER() AS totalCount");
    fromClauses.add("tasks");

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (giving LIKE matches the highest
      // possible score)
      // so we can sort on it (show the most relevant hits at the top).
      selectClauses.add("ISNULL(c_tasks.rank, 0)"
          + " + CASE WHEN tasks.shortName LIKE :likeQuery THEN 1000 ELSE 0 END"
          + " AS search_rank");
      fromClauses.add("LEFT JOIN CONTAINSTABLE (tasks, (longName), :containsQuery) c_tasks"
          + " ON tasks.uuid = c_tasks.[Key]");
      whereClauses.add("(c_tasks.rank IS NOT NULL OR tasks.shortName LIKE :likeQuery)");
      final String text = query.getText();
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
      sqlArgs.put("likeQuery", Utils.prepForLikeQuery(text) + "%");
    }

    if (query.getResponsibleOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getIncludeChildrenOrgs())) {
        withClauses.add("parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        whereClauses.add("organizationUuid IN (SELECT uuid from parent_orgs)");
        sqlArgs.put("orgUuid", query.getResponsibleOrgUuid());
      } else {
        addEqualsClause("orgUuid", "organizationUuid", query.getResponsibleOrgUuid());
      }
    }

    addEqualsClause("category", "category", query.getCategory());
    addEqualsClause("status", "status", query.getStatus());
    addLikeClause("projectStatus", "customFieldEnum1", query.getProjectStatus());
    addDateClause("plannedCompletionStart", "plannedCompletion", Comparison.AFTER,
        query.getPlannedCompletionStart());
    addDateClause("plannedCompletionEnd", "plannedCompletion", Comparison.BEFORE,
        query.getPlannedCompletionEnd());
    addDateClause("projectedCompletionStart", "projectedCompletion", Comparison.AFTER,
        query.getProjectedCompletionStart());
    addDateClause("projectedCompletionEnd", "projectedCompletion", Comparison.BEFORE,
        query.getProjectedCompletionEnd());
    addLikeClause("customField", "customField", query.getCustomField());

    if (query.getCustomFieldRef1Uuid() != null) {
      if (Boolean.TRUE.equals(query.getCustomFieldRef1Recursively())) {
        withClauses.add("parent_tasks(uuid) AS ("
            + " SELECT uuid FROM tasks WHERE uuid = :customFieldRef1Uuid UNION ALL"
            + " SELECT t.uuid from parent_tasks pt, tasks t WHERE t.customFieldRef1Uuid = pt.uuid AND t.uuid != :customFieldRef1Uuid"
            + ")");
        whereClauses.add("(tasks.customFieldRef1Uuid IN (SELECT uuid from parent_tasks)"
            + " OR tasks.uuid = :customFieldRef1Uuid)");
        sqlArgs.put("customFieldRef1Uuid", query.getCustomFieldRef1Uuid());
      } else {
        addEqualsClause("customFieldRef1Uuid", "tasks.customFieldRef1Uuid",
            query.getCustomFieldRef1Uuid());
      }
    }

    finish(query);
    return getResult(query, new TaskMapper());
  }

  @Override
  protected void getOrderByClauses(TaskSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "tasks", "createdAt"));
        break;
      case CATEGORY:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "tasks", "category"));
        break;
      case NAME:
      default:
        orderByClauses
            .addAll(Utils.addOrderBy(query.getSortOrder(), "tasks", "shortName", "longName"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "tasks", "uuid"));
  }

}
