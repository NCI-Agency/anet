package mil.dds.anet.search.mssql;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.OrganizationSearchQuery.OrganizationSearchSortBy;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlOrganizationSearcher implements IOrganizationSearcher {

	@Override
	public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query, Handle dbHandle) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder("/* MssqlOrganizationSearch */ SELECT " + OrganizationDao.ORGANIZATION_FIELDS);

		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		if (doFullTextSearch) {
			// If we're doing a full-text search, add a pseudo-rank (giving LIKE matches the highest possible score)
			// so we can sort on it (show the most relevant hits at the top).
			sql.append(", ISNULL(c_organizations.rank, 0)"
					+ " + CASE WHEN organizations.shortName LIKE :likeQuery THEN 1000 ELSE 0 END"
					+ " + CASE WHEN organizations.identificationCode LIKE :likeQuery THEN 1000 ELSE 0 END");
			sql.append(" AS search_rank");
		}
		sql.append(", count(*) OVER() AS totalCount FROM organizations");

		if (doFullTextSearch) {
			sql.append(" LEFT JOIN CONTAINSTABLE (organizations, (longName), :containsQuery) c_organizations"
					+ " ON organizations.id = c_organizations.[Key]");
			whereClauses.add("(c_organizations.rank IS NOT NULL"
					+ " OR organizations.identificationCode LIKE :likeQuery"
					+ " OR organizations.shortName LIKE :likeQuery)");
			sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
			sqlArgs.put("likeQuery", Utils.prepForLikeQuery(text) + "%");
		}

		if (query.getStatus() != null) {
			whereClauses.add("organizations.status = :status");
			sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus()));
		}

		if (query.getType() != null) {
			whereClauses.add(" organizations.type = :type ");
			sqlArgs.put("type", DaoUtils.getEnumId(query.getType()));
		}

		String commonTableExpression = null;
		if (query.getParentOrgId() != null) {
			if (query.getParentOrgRecursively() != null && query.getParentOrgRecursively()) {
				commonTableExpression = "WITH parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :parentOrgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.parentOrgId = po.id AND o.id != :parentOrgId"
					+ ") ";
				whereClauses.add("( organizations.parentOrgId IN (SELECT id from parent_orgs) "
					+ "OR organizations.id = :parentOrgId)");
			} else {
				whereClauses.add("organizations.parentOrgId = :parentOrgId");
			}
			sqlArgs.put("parentOrgId", query.getParentOrgId());
		}

		if (whereClauses.isEmpty()) {
			return new AnetBeanList<Organization>(query.getPageNum(), query.getPageSize(), new ArrayList<Organization>());
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

		if (query.getSortBy() == null) { query.setSortBy(OrganizationSearchSortBy.NAME); }
		if (query.getSortOrder() == null) { query.setSortOrder(SortOrder.ASC); }
		switch (query.getSortBy()) {
			case CREATED_AT:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "organizations", "createdAt"));
				break;
			case TYPE:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "organizations", "type"));
				break;
			case NAME:
			default:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "organizations", "shortName", "longName", "identificationCode"));
				break;
		}
		orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "organizations", "id"));
		sql.append(" ORDER BY ");
		sql.append(Joiner.on(", ").join(orderByClauses));

		if (commonTableExpression != null) {
			sql.insert(0, commonTableExpression);
		}

		final Query<Organization> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, sqlArgs)
			.map(new OrganizationMapper());
		return new AnetBeanList<Organization>(sqlQuery, query.getPageNum(), query.getPageSize(), null);
	}

}
