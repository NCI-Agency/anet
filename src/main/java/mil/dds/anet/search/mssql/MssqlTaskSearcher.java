package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractTaskSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlTaskSearcher extends AbstractTaskSearcher {

  public MssqlTaskSearcher() {
    super(new MssqlSearchQueryBuilder<Task, TaskSearchQuery>("MssqlTaskSearch"));
  }

  @Override
  protected void buildQuery(TaskSearchQuery query) {
    super.buildQuery(query);
    qb.addTotalCount();
  }

  @Override
  protected void addTextQuery(TaskSearchQuery query) {
    // If we're doing a full-text search, add a pseudo-rank (giving LIKE matches the highest
    // possible score)
    // so we can sort on it (show the most relevant hits at the top).
    qb.addSelectClause("ISNULL(c_tasks.rank, 0)"
        + " + CASE WHEN tasks.shortName LIKE :likeQuery THEN 1000 ELSE 0 END" + " AS search_rank");
    qb.addFromClause("LEFT JOIN CONTAINSTABLE (tasks, (longName), :containsQuery) c_tasks"
        + " ON tasks.uuid = c_tasks.[Key]");
    qb.addWhereClause("(c_tasks.rank IS NOT NULL OR tasks.shortName LIKE :likeQuery)");
    final String text = query.getText();
    qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
    qb.addSqlArg("likeQuery", Utils.prepForLikeQuery(text) + "%");
  }

  @Override
  protected void addResponsibleOrgUuidQuery(TaskSearchQuery query) {
    if (Boolean.TRUE.equals(query.getIncludeChildrenOrgs())) {
      qb.addWithClause("parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
          + " SELECT o.uuid FROM parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
          + ")");
      qb.addWhereClause("tasks.organizationUuid IN (SELECT uuid FROM parent_orgs)");
      qb.addSqlArg("orgUuid", query.getResponsibleOrgUuid());
    } else {
      qb.addEqualsClause("orgUuid", "tasks.organizationUuid", query.getResponsibleOrgUuid());
    }
  }

  @Override
  protected void addCustomFieldRef1UuidQuery(TaskSearchQuery query) {
    if (Boolean.TRUE.equals(query.getCustomFieldRef1Recursively())) {
      qb.addWithClause("parent_tasks(uuid) AS ("
          + " SELECT uuid FROM tasks WHERE uuid = :customFieldRef1Uuid UNION ALL"
          + " SELECT t.uuid FROM parent_tasks pt, tasks t WHERE t.customFieldRef1Uuid = pt.uuid AND t.uuid != :customFieldRef1Uuid"
          + ")");
      qb.addWhereClause("(tasks.customFieldRef1Uuid IN (SELECT uuid FROM parent_tasks)"
          + " OR tasks.uuid = :customFieldRef1Uuid)");
      qb.addSqlArg("customFieldRef1Uuid", query.getCustomFieldRef1Uuid());
    } else {
      qb.addEqualsClause("customFieldRef1Uuid", "tasks.customFieldRef1Uuid",
          query.getCustomFieldRef1Uuid());
    }
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TaskSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
