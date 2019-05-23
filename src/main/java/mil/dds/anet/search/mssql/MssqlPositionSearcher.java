package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.IPositionSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlPositionSearcher extends AbstractMssqlSearcherBase<Position, PositionSearchQuery>
    implements IPositionSearcher {

  @Override
  public AnetBeanList<Position> runSearch(PositionSearchQuery query) {
    start("MssqlPositionSearch");
    sql.append("SELECT " + PositionDao.POSITIONS_FIELDS);

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
      // so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now.
      // See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      sql.append(", ISNULL(c_positions.rank, 0)");
      if (Boolean.TRUE.equals(query.getMatchPersonName())) {
        sql.append(" + ISNULL(c_people.rank, 0)");
      }
      sql.append(" AS search_rank");
    }
    sql.append(", count(*) OVER() AS totalCount FROM positions ");

    if (Boolean.TRUE.equals(query.getMatchPersonName())) {
      sql.append(" LEFT JOIN people ON positions.currentPersonUuid = people.uuid");
    }

    if (query.isTextPresent()) {
      final String text = query.getText();
      sql.append(" LEFT JOIN CONTAINSTABLE (positions, (name), :containsQuery) c_positions"
          + " ON positions.uuid = c_positions.[Key]");
      final StringBuilder whereRank = new StringBuilder(
          "(" + "c_positions.rank IS NOT NULL" + " OR positions.code LIKE :likeQuery");
      if (Boolean.TRUE.equals(query.getMatchPersonName())) {
        sql.append(" LEFT JOIN CONTAINSTABLE(people, (name), :containsQuery) c_people"
            + " ON people.uuid = c_people.[Key]");
        whereRank.append(" OR c_people.rank IS NOT NULL");
      }
      whereRank.append(")");
      whereClauses.add(whereRank.toString());
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
      sqlArgs.put("likeQuery", Utils.prepForLikeQuery(text) + "%");
    }

    addInClause("types", "positions.type", query.getType());

    if (query.getOrganizationUuid() != null) {
      if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) {
        withClauses.add("parent_orgs(uuid) AS ( "
            + "SELECT uuid FROM organizations WHERE uuid = :orgUuid " + "UNION ALL "
            + "SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid "
            + ") ");
        whereClauses.add(" positions.organizationUuid IN (SELECT uuid from parent_orgs)");
      } else {
        whereClauses.add("positions.organizationUuid = :orgUuid");
      }
      sqlArgs.put("orgUuid", query.getOrganizationUuid());
    }

    if (query.getIsFilled() != null) {
      if (query.getIsFilled()) {
        whereClauses.add("positions.currentPersonUuid IS NOT NULL");
      } else {
        whereClauses.add("positions.currentPersonUuid IS NULL");
      }
    }

    addEqualsClause("locationUuid", "positions.locationUuid", query.getLocationUuid());
    addEqualsClause("status", "positions.status", query.getStatus());

    if (query.getAuthorizationGroupUuid() != null) {
      // Search for positions related to a given authorization group
      whereClauses
          .add("positions.uuid IN ( SELECT ap.positionUuid FROM authorizationGroupPositions ap "
              + "WHERE ap.authorizationGroupUuid = :authorizationGroupUuid) ");
      sqlArgs.put("authorizationGroupUuid", query.getAuthorizationGroupUuid());
    }

    finish(query);
    return getResult(query, new PositionMapper());
  }

  @Override
  protected void getOrderByClauses(PositionSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "positions", "createdAt"));
        break;
      case CODE:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "positions", "code"));
        break;
      case NAME:
      default:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "positions", "name"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "positions", "uuid"));
  }

}
