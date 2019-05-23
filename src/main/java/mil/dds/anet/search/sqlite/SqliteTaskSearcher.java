package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteTaskSearcher extends AbstractSqliteSearcherBase<Task, TaskSearchQuery>
    implements ITaskSearcher {

  @Override
  public AnetBeanList<Task> runSearch(TaskSearchQuery query) {
    start("SqliteTaskSearch");
    selectClauses.add("tasks.*");
    fromClauses.add("tasks");

    if (query.isTextPresent()) {
      whereClauses
          .add("(\"longName\" LIKE '%' || :text || '%' OR \"shortName\" LIKE '%' || :text || '%')");
      final String text = query.getText();
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    if (query.getResponsibleOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getIncludeChildrenOrgs())) {
        withClauses.add("RECURSIVE parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ")");
        whereClauses.add("\"organizationUuid\" IN (SELECT uuid from parent_orgs)");
        sqlArgs.put("orgUuid", query.getResponsibleOrgUuid());
      } else {
        addEqualsClause("orgUuid", "\"organizationUuid\"", query.getResponsibleOrgUuid());
      }
    }

    addEqualsClause("category", "category", query.getCategory());
    addEqualsClause("status", "status", query.getStatus());

    if (query.getCustomFieldRef1Uuid() != null) {
      if (Boolean.TRUE.equals(query.getCustomFieldRef1Recursively())) {
        whereClauses.add("(tasks.\"customFieldRef1Uuid\" IN ("
            + " WITH RECURSIVE parent_tasks(uuid) AS ("
            + " SELECT uuid FROM tasks WHERE uuid = :customFieldRef1Uuid UNION ALL"
            + " SELECT t.uuid from parent_tasks pt, tasks t WHERE t.\"customFieldRef1Uuid\" = pt.uuid "
            + ") SELECT uuid from parent_tasks))");
        sqlArgs.put("customFieldRef1Uuid", query.getCustomFieldRef1Uuid());
      } else {
        addEqualsClause("customFieldRef1Uuid", "tasks.\"customFieldRef1Uuid\"",
            query.getCustomFieldRef1Uuid());
      }
    }

    finish(query);
    return getResult(query, new TaskMapper());
  }

  @Override
  protected void getOrderByClauses(TaskSearchQuery query) {
    orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "tasks", "\"shortName\""));
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "tasks", "uuid"));
  }

}
