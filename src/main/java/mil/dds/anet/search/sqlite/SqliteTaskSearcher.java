package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.search.mssql.MssqlSearchQueryBuilder;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqliteTaskSearcher extends AbstractSearcher implements ITaskSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Task> runSearch(TaskSearchQuery query) {
    final MssqlSearchQueryBuilder<Task, TaskSearchQuery> qb =
        new MssqlSearchQueryBuilder<Task, TaskSearchQuery>("SqliteTaskSearch");
    qb.addSelectClause("tasks.*");
    qb.addFromClause("tasks");

    if (query.isTextPresent()) {
      qb.addWhereClause(
          "(\"longName\" LIKE '%' || :text || '%' OR \"shortName\" LIKE '%' || :text || '%')");
      final String text = query.getText();
      qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
    }

    if (query.getResponsibleOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getIncludeChildrenOrgs())) {
        qb.addWithClause("RECURSIVE parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ")");
        qb.addWhereClause("\"organizationUuid\" IN (SELECT uuid from parent_orgs)");
        qb.addSqlArg("orgUuid", query.getResponsibleOrgUuid());
      } else {
        qb.addEqualsClause("orgUuid", "\"organizationUuid\"", query.getResponsibleOrgUuid());
      }
    }

    qb.addEqualsClause("category", "category", query.getCategory());
    qb.addEqualsClause("status", "status", query.getStatus());

    if (query.getCustomFieldRef1Uuid() != null) {
      if (Boolean.TRUE.equals(query.getCustomFieldRef1Recursively())) {
        qb.addWhereClause("(tasks.\"customFieldRef1Uuid\" IN ("
            + " WITH RECURSIVE parent_tasks(uuid) AS ("
            + " SELECT uuid FROM tasks WHERE uuid = :customFieldRef1Uuid UNION ALL"
            + " SELECT t.uuid from parent_tasks pt, tasks t WHERE t.\"customFieldRef1Uuid\" = pt.uuid "
            + ") SELECT uuid from parent_tasks))");
        qb.addSqlArg("customFieldRef1Uuid", query.getCustomFieldRef1Uuid());
      } else {
        qb.addEqualsClause("customFieldRef1Uuid", "tasks.\"customFieldRef1Uuid\"",
            query.getCustomFieldRef1Uuid());
      }
    }

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new TaskMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TaskSearchQuery query) {
    qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "tasks", "\"shortName\""));
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "tasks", "uuid"));
  }

}
