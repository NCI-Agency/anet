package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.IPositionSearcher;
import mil.dds.anet.search.mssql.MssqlSearchQueryBuilder;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqlitePositionSearcher extends AbstractSearcher implements IPositionSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Position> runSearch(PositionSearchQuery query) {
    final MssqlSearchQueryBuilder<Position, PositionSearchQuery> outerQb =
        new MssqlSearchQueryBuilder<Position, PositionSearchQuery>("SqlitePositionSearch");
    final MssqlSearchQueryBuilder<Position, PositionSearchQuery> innerQb =
        new MssqlSearchQueryBuilder<Position, PositionSearchQuery>("SqlitePositionSearch");
    innerQb.addSelectClause("positions.uuid");
    innerQb.addFromClause("positions");

    if (query.getMatchPersonName() != null && query.getMatchPersonName()) {
      innerQb.addFromClause("LEFT JOIN people ON positions.\"currentPersonUuid\" = people.uuid");
    }

    if (query.isTextPresent()) {
      if (query.getMatchPersonName() != null && query.getMatchPersonName()) {
        innerQb.addWhereClause("((positions.name LIKE '%' || :text || '%'"
            + " OR positions.code LIKE '%' || :text || '%')"
            + " OR (people.name LIKE '%' || :text || '%'))");
      } else {
        innerQb.addWhereClause("(name LIKE '%' || :text || '%' OR code LIKE '%' || :text || '%')");
      }

      final String text = query.getText();
      innerQb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
    }

    innerQb.addInClause("types", "positions.type", query.getType());

    if (query.getOrganizationUuid() != null) {
      if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) {
        outerQb.addWithClause("RECURSIVE parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ")");
        innerQb.addWhereClause("positions.\"organizationUuid\" IN (SELECT uuid from parent_orgs)");
      } else {
        innerQb.addWhereClause("positions.\"organizationUuid\" = :orgUuid");
      }
      innerQb.addSqlArg("orgUuid", query.getOrganizationUuid());
    }

    if (query.getIsFilled() != null) {
      if (query.getIsFilled()) {
        innerQb.addWhereClause("positions.\"currentPersonUuid\" IS NOT NULL");
      } else {
        innerQb.addWhereClause("positions.\"currentPersonUuid\" IS NULL");
      }
    }

    innerQb.addEqualsClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());
    innerQb.addEqualsClause("status", "positions.status", query.getStatus());

    outerQb.addSelectClause(PositionDao.POSITIONS_FIELDS);
    outerQb.addFromClause("positions");
    outerQb.addSelectClause("positions.uuid IN ( " + innerQb.build() + " )");
    outerQb.addSqlArgs(innerQb.getSqlArgs());
    outerQb.addListArgs(innerQb.getListArgs());
    addOrderByClauses(outerQb, query);
    return outerQb.buildAndRun(getDbHandle(), query, new PositionMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PositionSearchQuery query) {
    switch (query.getSortBy()) {
      case CODE:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), null, "positions.code"));
        break;
      case CREATED_AT:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), null, "positions.\"createdAt\""));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), null, "positions.name"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, null, "uuid"));
  }

}
