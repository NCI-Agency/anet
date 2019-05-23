package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.IPositionSearcher;
import mil.dds.anet.utils.Utils;

public class SqlitePositionSearcher
    extends AbstractSqliteSearcherBase<Position, PositionSearchQuery> implements IPositionSearcher {

  @Override
  public AnetBeanList<Position> runSearch(PositionSearchQuery query) {
    start("SqlitePositionSearch");
    selectClauses.add("positions.uuid");
    fromClauses.add("positions");

    if (query.getMatchPersonName() != null && query.getMatchPersonName()) {
      fromClauses.add("LEFT JOIN people ON positions.\"currentPersonUuid\" = people.uuid");
    }

    if (query.isTextPresent()) {
      if (query.getMatchPersonName() != null && query.getMatchPersonName()) {
        whereClauses.add("((positions.name LIKE '%' || :text || '%'"
            + " OR positions.code LIKE '%' || :text || '%')"
            + " OR (people.name LIKE '%' || :text || '%'))");
      } else {
        whereClauses.add("(name LIKE '%' || :text || '%' OR code LIKE '%' || :text || '%')");
      }

      final String text = query.getText();
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    addInClause("types", "positions.type", query.getType());

    if (query.getOrganizationUuid() != null) {
      if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) {
        withClauses.add("RECURSIVE parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ")");
        whereClauses.add("positions.\"organizationUuid\" IN (SELECT uuid from parent_orgs)");
      } else {
        whereClauses.add("positions.\"organizationUuid\" = :orgUuid");
      }
      sqlArgs.put("orgUuid", query.getOrganizationUuid());
    }

    if (query.getIsFilled() != null) {
      if (query.getIsFilled()) {
        whereClauses.add("positions.\"currentPersonUuid\" IS NOT NULL");
      } else {
        whereClauses.add("positions.\"currentPersonUuid\" IS NULL");
      }
    }

    addEqualsClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());
    addEqualsClause("status", "positions.status", query.getStatus());

    finish(query);
    return getResult(query, new PositionMapper());
  }

  @Override
  protected void finish(PositionSearchQuery query) {
    addWithClauses();
    sql.append(
        "SELECT " + PositionDao.POSITIONS_FIELDS + " FROM positions WHERE positions.uuid IN (");
    addSelectClauses();
    addFromClauses();
    addWhereClauses();
    sql.append(")");
    addOrderByClauses(query);
  }

  @Override
  protected void getOrderByClauses(PositionSearchQuery query) {
    switch (query.getSortBy()) {
      case CODE:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "positions.code"));
        break;
      case CREATED_AT:
        orderByClauses
            .addAll(Utils.addOrderBy(query.getSortOrder(), null, "positions.\"createdAt\""));
        break;
      case NAME:
      default:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "positions.name"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, null, "uuid"));
  }

}
