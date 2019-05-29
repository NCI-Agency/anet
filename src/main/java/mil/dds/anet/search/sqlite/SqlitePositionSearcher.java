package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.AbstractPositionSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqlitePositionSearcher extends AbstractPositionSearcher {

  private final SqliteSearchQueryBuilder<Position, PositionSearchQuery> outerQb;

  public SqlitePositionSearcher() {
    super(new SqliteSearchQueryBuilder<Position, PositionSearchQuery>(""));
    outerQb = new SqliteSearchQueryBuilder<Position, PositionSearchQuery>("SqlitePositionSearch");
  }

  @InTransaction
  @Override
  public AnetBeanList<Position> runSearch(PositionSearchQuery query) {
    buildQuery(query);
    outerQb.addSelectClause(PositionDao.POSITIONS_FIELDS);
    outerQb.addFromClause("positions");
    outerQb.addSelectClause("positions.uuid IN ( " + qb.build() + " )");
    outerQb.addSqlArgs(qb.getSqlArgs());
    outerQb.addListArgs(qb.getListArgs());
    return outerQb.buildAndRun(getDbHandle(), query, new PositionMapper());
  }

  @Override
  protected void addTextQuery(PositionSearchQuery query) {
    if (query.getMatchPersonName() != null && query.getMatchPersonName()) {
      qb.addWhereClause("((positions.name LIKE '%' || :text || '%'"
          + " OR positions.code LIKE '%' || :text || '%')"
          + " OR (people.name LIKE '%' || :text || '%'))");
    } else {
      qb.addWhereClause("(positions.name LIKE '%' || :text || '%'"
          + " OR positions.code LIKE '%' || :text || '%')");
    }
    final String text = query.getText();
    qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
  }

  @Override
  protected void addOrganizationUuidQuery(PositionSearchQuery query) {
    if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) {
      outerQb.addWithClause("RECURSIVE parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
          + " SELECT o.uuid FROM parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
          + ")");
      qb.addWhereClause("positions.\"organizationUuid\" IN (SELECT uuid FROM parent_orgs)");
    } else {
      qb.addWhereClause("positions.\"organizationUuid\" = :orgUuid");
    }
    qb.addSqlArg("orgUuid", query.getOrganizationUuid());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PositionSearchQuery query) {
    super.addOrderByClauses(outerQb, query);
  }

}
