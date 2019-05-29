package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.IPositionSearcher;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlPositionSearcher extends AbstractSearcher implements IPositionSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Position> runSearch(PositionSearchQuery query) {
    final MssqlSearchQueryBuilder<Position, PositionSearchQuery> qb =
        new MssqlSearchQueryBuilder<Position, PositionSearchQuery>("MssqlPositionSearch");
    qb.addSelectClause(PositionDao.POSITIONS_FIELDS);
    qb.addSelectClause("count(*) OVER() AS totalCount");
    qb.addFromClause("positions");

    if (Boolean.TRUE.equals(query.getMatchPersonName())) {
      qb.addFromClause("LEFT JOIN people ON positions.currentPersonUuid = people.uuid");
    }

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
      // so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now.
      // See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      qb.addSelectClause("ISNULL(c_positions.rank, 0)"
          + (Boolean.TRUE.equals(query.getMatchPersonName()) ? " + ISNULL(c_people.rank, 0)" : "")
          + " AS search_rank");
      qb.addFromClause("LEFT JOIN CONTAINSTABLE (positions, (name), :containsQuery) c_positions"
          + " ON positions.uuid = c_positions.[Key]");
      final StringBuilder whereRank =
          new StringBuilder("(c_positions.rank IS NOT NULL OR positions.code LIKE :likeQuery");
      if (Boolean.TRUE.equals(query.getMatchPersonName())) {
        qb.addFromClause("LEFT JOIN CONTAINSTABLE(people, (name), :containsQuery) c_people"
            + " ON people.uuid = c_people.[Key]");
        whereRank.append(" OR c_people.rank IS NOT NULL");
      }
      whereRank.append(")");
      qb.addWhereClause(whereRank.toString());
      final String text = query.getText();
      qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
      qb.addSqlArg("likeQuery", Utils.prepForLikeQuery(text) + "%");
    }

    qb.addInClause("types", "positions.type", query.getType());

    if (query.getOrganizationUuid() != null) {
      if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) {
        qb.addWithClause("parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        qb.addWhereClause("positions.organizationUuid IN (SELECT uuid from parent_orgs)");
      } else {
        qb.addWhereClause("positions.organizationUuid = :orgUuid");
      }
      qb.addSqlArg("orgUuid", query.getOrganizationUuid());
    }

    if (query.getIsFilled() != null) {
      if (query.getIsFilled()) {
        qb.addWhereClause("positions.currentPersonUuid IS NOT NULL");
      } else {
        qb.addWhereClause("positions.currentPersonUuid IS NULL");
      }
    }

    qb.addEqualsClause("locationUuid", "positions.locationUuid", query.getLocationUuid());
    qb.addEqualsClause("status", "positions.status", query.getStatus());

    if (query.getAuthorizationGroupUuid() != null) {
      // Search for positions related to a given authorization group
      qb.addWhereClause(
          "positions.uuid IN (SELECT ap.positionUuid FROM authorizationGroupPositions ap"
              + " WHERE ap.authorizationGroupUuid = :authorizationGroupUuid)");
      qb.addSqlArg("authorizationGroupUuid", query.getAuthorizationGroupUuid());
    }

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new PositionMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PositionSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "positions", "createdAt"));
        break;
      case CODE:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "positions", "code"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "positions", "name"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "positions", "uuid"));
  }

}
