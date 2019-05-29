package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.search.AbstractTaskSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteTaskSearcher extends AbstractTaskSearcher {

  public SqliteTaskSearcher() {
    super(new SqliteSearchQueryBuilder<Task, TaskSearchQuery>("SqliteTaskSearch"));
  }

  @Override
  protected void addTextQuery(TaskSearchQuery query) {
    qb.addWhereClause(
        "(tasks.\"longName\" LIKE '%' || :text || '%' OR tasks.\"shortName\" LIKE '%' || :text || '%')");
    final String text = query.getText();
    qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
  }

  @Override
  protected void addResponsibleOrgUuidQuery(TaskSearchQuery query) {
    if (Boolean.TRUE.equals(query.getIncludeChildrenOrgs())) {
      qb.addWithClause("RECURSIVE parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
          + " SELECT o.uuid FROM parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
          + ")");
      qb.addWhereClause("tasks.\"organizationUuid\" IN (SELECT uuid FROM parent_orgs)");
      qb.addSqlArg("orgUuid", query.getResponsibleOrgUuid());
    } else {
      qb.addEqualsClause("orgUuid", "tasks.\"organizationUuid\"", query.getResponsibleOrgUuid());
    }
  }

  @Override
  protected void addCustomFieldRef1UuidQuery(TaskSearchQuery query) {
    if (Boolean.TRUE.equals(query.getCustomFieldRef1Recursively())) {
      qb.addWhereClause("(tasks.\"customFieldRef1Uuid\" IN ("
          + " WITH RECURSIVE parent_tasks(uuid) AS ("
          + " SELECT uuid FROM tasks WHERE uuid = :customFieldRef1Uuid UNION ALL"
          + " SELECT t.uuid FROM parent_tasks pt, tasks t WHERE t.\"customFieldRef1Uuid\" = pt.uuid "
          + ") SELECT uuid FROM parent_tasks))");
      qb.addSqlArg("customFieldRef1Uuid", query.getCustomFieldRef1Uuid());
    } else {
      qb.addEqualsClause("customFieldRef1Uuid", "tasks.\"customFieldRef1Uuid\"",
          query.getCustomFieldRef1Uuid());
    }
  }

}
