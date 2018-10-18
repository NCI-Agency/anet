package mil.dds.anet.search.mssql;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.PersonSearchQuery.PersonSearchSortBy;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlPersonSearcher implements IPersonSearcher {

	@Override
	public AnetBeanList<Person> runSearch(PersonSearchQuery query, Handle dbHandle) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder("/* MssqlPersonSearch */ SELECT " + PersonDao.PERSON_FIELDS);

		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		if (doFullTextSearch) {
			// If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
			// so we can sort on it (show the most relevant hits at the top).
			// Note that summing up independent ranks is not ideal, but it's the best we can do now.
			// See https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
			sql.append(", ISNULL(c_people.rank, 0) + ISNULL(f_people.rank, 0)");
			if (query.getMatchPositionName()) {
				sql.append(" + ISNULL(c_positions.rank, 0)");
			}
			sql.append(" AS search_rank");
		}
		sql.append(", count(*) over() as totalCount FROM people");

		if (query.getOrgId() != null || query.getLocationId() != null || query.getMatchPositionName()) {
			sql.append(" LEFT JOIN positions ON people.id = positions.currentPersonId ");
		}

		if (doFullTextSearch) {
			sql.append(" LEFT JOIN CONTAINSTABLE (people, (name, emailAddress, biography), :containsQuery) c_people"
					+ " ON people.id = c_people.[Key]"
					+ " LEFT JOIN FREETEXTTABLE(people, (name, biography), :freetextQuery) f_people"
					+ " ON people.id = f_people.[Key]");
			final StringBuilder whereRank = new StringBuilder("("
					+ "c_people.rank IS NOT NULL"
					+ " OR f_people.rank IS NOT NULL");
			if (query.getMatchPositionName()) {
				sql.append(" LEFT JOIN CONTAINSTABLE(positions, (name), :containsQuery) c_positions"
						+ " ON positions.id = c_positions.[Key]");
				whereRank.append(" OR c_positions.rank IS NOT NULL"
						+ " OR positions.code LIKE :likeQuery");
				sqlArgs.put("likeQuery", Utils.prepForLikeQuery(text) + "%");
			}
			whereRank.append(")");
			whereClauses.add(whereRank.toString());
			sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
			sqlArgs.put("freetextQuery", text);
		}

		if (query.getRole() != null) {
			whereClauses.add(" people.role = :role ");
			sqlArgs.put("role", DaoUtils.getEnumId(query.getRole()));
		}

		if (query.getStatus() != null && query.getStatus().size() > 0) {
			if (query.getStatus().size() == 1) {
				whereClauses.add("people.status = :status");
				sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus().get(0)));
			} else {
				List<String> argNames = new LinkedList<String>();
				for (int i = 0;i < query.getStatus().size();i++) {
					argNames.add(":status" + i);
					sqlArgs.put("status" + i, DaoUtils.getEnumId(query.getStatus().get(i)));
				}
				whereClauses.add("people.status IN (" + Joiner.on(", ").join(argNames) + ")");
			}
		}

		if (query.getRank() != null && query.getRank().trim().length() > 0) {
			whereClauses.add(" people.rank = :rank ");
			sqlArgs.put("rank", query.getRank());
		}

		if (query.getCountry() != null && query.getCountry().trim().length() > 0) {
			whereClauses.add(" people.country = :country ");
			sqlArgs.put("country", query.getCountry());
		}

		if (query.getPendingVerification() != null) {
			whereClauses.add(" people.pendingVerification = :pendingVerification ");
			sqlArgs.put("pendingVerification", query.getPendingVerification());
		}

		String commonTableExpression = null;
		if (query.getOrgId() != null) {
			if (query.getIncludeChildOrgs() != null && query.getIncludeChildOrgs()) {
				commonTableExpression = "WITH parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :orgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.parentOrgId = po.id "
					+ ") ";
				whereClauses.add(" positions.organizationId IN (SELECT id from parent_orgs)");
			} else {
				whereClauses.add(" positions.organizationId = :orgId ");
			}
			sqlArgs.put("orgId", query.getOrgId());
		}

		if (query.getLocationId() != null) {
			whereClauses.add(" positions.locationId = :locationId ");
			sqlArgs.put("locationId", query.getLocationId());
		}

		if (whereClauses.isEmpty()) {
			return new AnetBeanList<Person>(query.getPageNum(), query.getPageSize(), new ArrayList<Person>());
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

		if (query.getSortBy() == null) { query.setSortBy(PersonSearchSortBy.NAME); }
		if (query.getSortOrder() == null) { query.setSortOrder(SortOrder.ASC); }
		switch (query.getSortBy()) {
			case CREATED_AT:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "people", "createdAt"));
				break;
			case RANK:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "people", "rank"));
				break;
			case NAME:
			default:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "people", "name"));
				break;
		}
		orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "people", "id"));
		sql.append(" ORDER BY ");
		sql.append(Joiner.on(", ").join(orderByClauses));

		if (commonTableExpression != null) {
			sql.insert(0, commonTableExpression);
		}

		final Query<Person> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, sqlArgs)
			.map(new PersonMapper());
		return new AnetBeanList<Person>(sqlQuery, query.getPageNum(), query.getPageSize(), null);
	}

}
