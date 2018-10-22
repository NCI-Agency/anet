package mil.dds.anet.search.mssql;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.beans.search.PositionSearchQuery.PositionSearchSortBy;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.IPositionSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlPositionSearcher implements IPositionSearcher {

	@Override
	public AnetBeanList<Position> runSearch(PositionSearchQuery query, Handle dbHandle) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder("/* MssqlPositionSearch */ SELECT " + PositionDao.POSITIONS_FIELDS);

		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		if (doFullTextSearch) {
			// If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
			// so we can sort on it (show the most relevant hits at the top).
			// Note that summing up independent ranks is not ideal, but it's the best we can do now.
			// See https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
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

		if (doFullTextSearch) {
			sql.append(" LEFT JOIN CONTAINSTABLE (positions, (name), :containsQuery) c_positions"
					+ " ON positions.uuid = c_positions.[Key]");
			final StringBuilder whereRank = new StringBuilder("("
					+ "c_positions.rank IS NOT NULL"
					+ " OR positions.code LIKE :likeQuery");
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

		if (query.getType() != null) {
			List<String> argNames = new LinkedList<String>();
			for (int i = 0;i < query.getType().size();i++) {
				argNames.add(":state" + i);
				sqlArgs.put("state" + i, DaoUtils.getEnumId(query.getType().get(i)));
			}
			whereClauses.add("positions.type IN (" + Joiner.on(", ").join(argNames) + ")");
		}

		String commonTableExpression = null;
		if (query.getOrganizationUuid() != null) {
			if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) {
				commonTableExpression = "WITH parent_orgs(uuid) AS ( "
						+ "SELECT uuid FROM organizations WHERE uuid = :orgUuid "
					+ "UNION ALL "
						+ "SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid "
					+ ") ";
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

		if (query.getLocationUuid() != null) {
			whereClauses.add("positions.locationUuid = :locationUuid");
			sqlArgs.put("locationUuid", query.getLocationUuid());
		}

		if (query.getStatus() != null) {
			whereClauses.add("positions.status = :status");
			sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus()));
		}

		if (query.getAuthorizationGroupUuid() != null) {
			// Search for positions related to a given authorization group
			whereClauses.add("positions.uuid IN ( SELECT ap.positionUuid FROM authorizationGroupPositions ap "
							+ "WHERE ap.authorizationGroupUuid = :authorizationGroupUuid) ");
			sqlArgs.put("authorizationGroupUuid", query.getAuthorizationGroupUuid());
		}

		if (whereClauses.isEmpty()) {
			return new AnetBeanList<Position>(query.getPageNum(), query.getPageSize(), new ArrayList<Position>());
		}

		sql.append(" WHERE ");
		sql.append(Joiner.on(" AND ").join(whereClauses));

		//Sort Ordering
		final List<String> orderByClauses = new LinkedList<>();
		if (doFullTextSearch && query.getSortBy() == null) {
			// We're doing a full-text search without an explicit sort order,
			// so sort first on the search pseudo-rank.
			orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
		}

		if (query.getSortBy() == null) { query.setSortBy(PositionSearchSortBy.NAME); }
		if (query.getSortOrder() == null) { query.setSortOrder(SortOrder.ASC); }
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
		sql.append(" ORDER BY ");
		sql.append(Joiner.on(", ").join(orderByClauses));

		if (commonTableExpression != null) {
			sql.insert(0, commonTableExpression);
		}

		final Query<Position> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, sqlArgs)
			.map(new PositionMapper());
		return new AnetBeanList<Position>(sqlQuery, query.getPageNum(), query.getPageSize(), null);
	}

}
