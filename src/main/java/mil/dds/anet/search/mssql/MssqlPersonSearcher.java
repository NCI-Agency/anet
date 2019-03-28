package mil.dds.anet.search.mssql;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.jdbi.v3.core.statement.Query;

import com.google.common.base.Joiner;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.PersonSearchQuery.PersonSearchSortBy;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.search.PersonSearchBuilder;
import mil.dds.anet.search.AbstractSearchBuilder.Comparison;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlPersonSearcher extends AbstractSearcherBase implements IPersonSearcher {

	@Override
	public AnetBeanList<Person> runSearch(PersonSearchQuery query) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		final Map<String,List<?>> listArgs = new HashMap<>();
		final StringBuilder sql = new StringBuilder("/* MssqlPersonSearch */ SELECT " + PersonDao.PERSON_FIELDS);

		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		final boolean doSoundex = doFullTextSearch && query.getSortBy() == null;
		if (doSoundex) {
			sql.append(", EXP(SUM(LOG(1.0/(5-DIFFERENCE(name_token.value, search_token.value)))))");
			sql.append(" AS search_rank");
		}
		else if (doFullTextSearch) {
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

		if (query.getOrgUuid() != null || query.getLocationUuid() != null || query.getMatchPositionName()) {
			sql.append(" LEFT JOIN positions ON people.uuid = positions.currentPersonUuid ");
		}

		if (doSoundex) {
			sql.append(" CROSS APPLY STRING_SPLIT(people.name, ' ') AS name_token"
					+ " CROSS APPLY STRING_SPLIT(:freetextQuery, ' ') AS search_token");
			sqlArgs.put("freetextQuery", text);
		}
		else if (doFullTextSearch) {
			sql.append(" LEFT JOIN CONTAINSTABLE (people, (name, emailAddress, biography), :containsQuery) c_people"
					+ " ON people.uuid = c_people.[Key]"
					+ " LEFT JOIN FREETEXTTABLE(people, (name, biography), :freetextQuery) f_people"
					+ " ON people.uuid = f_people.[Key]");
			final StringBuilder whereRank = new StringBuilder("("
					+ "c_people.rank IS NOT NULL"
					+ " OR f_people.rank IS NOT NULL");
			if (query.getMatchPositionName()) {
				sql.append(" LEFT JOIN CONTAINSTABLE(positions, (name), :containsQuery) c_positions"
						+ " ON positions.uuid = c_positions.[Key]");
				whereRank.append(" OR c_positions.rank IS NOT NULL"
						+ " OR positions.code LIKE :likeQuery");
				sqlArgs.put("likeQuery", Utils.prepForLikeQuery(text) + "%");
			}
			whereRank.append(")");
			whereClauses.add(whereRank.toString());
			sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
			sqlArgs.put("freetextQuery", text);
		}

		PersonSearchBuilder searchBuilder = new PersonSearchBuilder(sqlArgs, whereClauses);
		searchBuilder.addDateClause(query.getEndOfTourDateStart(), Comparison.AFTER, "endOfTourDate", "startDate");
		searchBuilder.addDateClause(query.getEndOfTourDateEnd(), Comparison.BEFORE, "endOfTourDate", "endDate");

		if (query.getRole() != null) {
			whereClauses.add(" people.role = :role ");
			sqlArgs.put("role", DaoUtils.getEnumId(query.getRole()));
		}

		if (!Utils.isEmptyOrNull(query.getStatus())) {
			whereClauses.add("people.status IN ( <statuses> )");
			listArgs.put("statuses", query.getStatus().stream().map(status -> DaoUtils.getEnumId(status)).collect(Collectors.toList()));
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
		if (query.getOrgUuid() != null) {
			if (query.getIncludeChildOrgs() != null && query.getIncludeChildOrgs()) {
				commonTableExpression = "WITH parent_orgs(uuid) AS ( "
						+ "SELECT uuid FROM organizations WHERE uuid = :orgUuid "
					+ "UNION ALL "
						+ "SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid "
					+ ") ";
				whereClauses.add(" positions.organizationUuid IN (SELECT uuid from parent_orgs)");
			} else {
				whereClauses.add(" positions.organizationUuid = :orgUuid ");
			}
			sqlArgs.put("orgUuid", query.getOrgUuid());
		}

		if (query.getLocationUuid() != null) {
			whereClauses.add(" positions.locationUuid = :locationUuid ");
			sqlArgs.put("locationUuid", query.getLocationUuid());
		}

		if (whereClauses.isEmpty() && !doSoundex) {
			return new AnetBeanList<Person>(query.getPageNum(), query.getPageSize(), new ArrayList<Person>());
		}

		if (!whereClauses.isEmpty()) {
			sql.append(" WHERE ");
			sql.append(Joiner.on(" AND ").join(whereClauses));
		}

		if (doSoundex) {
			// Add grouping needed for soundex score
			sql.append(" GROUP BY " + PersonDao.PERSON_FIELDS_NOAS);
		}

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
		orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "people", "uuid"));
		sql.append(" ORDER BY ");
		sql.append(Joiner.on(", ").join(orderByClauses));

		if (commonTableExpression != null) {
			sql.insert(0, commonTableExpression);
		}

		final Query sqlQuery = MssqlSearcher.addPagination(query, getDbHandle(), sql, sqlArgs, listArgs);
		return new AnetBeanList<Person>(sqlQuery, query.getPageNum(), query.getPageSize(), new PersonMapper(), null);
	}

}
