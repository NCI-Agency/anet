package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.OrganizationList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlOrganizationSearcher implements IOrganizationSearcher {

	@Override
	public OrganizationList runSearch(OrganizationSearchQuery query, Handle dbHandle) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder("/* MssqlOrganizationSearch */ SELECT " + OrganizationDao.ORGANIZATION_FIELDS);

		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
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

		final OrganizationList result = new OrganizationList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());

		if (whereClauses.isEmpty()) {
			return result;
		}

		sql.append(" WHERE ");
		sql.append(Joiner.on(" AND ").join(whereClauses));
		sql.append(" ORDER BY organizations.shortName ASC, organizations.longName ASC, organizations.identificationCode ASC, organizations.id ASC");

		if (commonTableExpression != null) {
			sql.insert(0, commonTableExpression);
		}

		final Query<Organization> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, sqlArgs)
			.map(new OrganizationMapper());
		return OrganizationList.fromQuery(sqlQuery, query.getPageNum(), query.getPageSize());
	}

}
