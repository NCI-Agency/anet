package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.PositionList;
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
	public PositionList runSearch(PositionSearchQuery query, Handle dbHandle) {
		StringBuilder sql = new StringBuilder("/* MssqlPositionSearch */ SELECT " + PositionDao.POSITIONS_FIELDS
				+ ", count(*) OVER() AS totalCount "
				+ " FROM positions ");
		Map<String,Object> sqlArgs = new HashMap<String,Object>();
		String commonTableExpression = null;
		
		if (query.getMatchPersonName()) { 
			sql.append(" LEFT JOIN people ON positions.currentPersonId = people.id ");
		}
		
		sql.append(" WHERE ");
		List<String> whereClauses = new LinkedList<String>();
		PositionList result = new PositionList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());
		
		String text = query.getText();
		if (text != null && text.trim().length() > 0) {
			if (query.getMatchPersonName() != null && query.getMatchPersonName()) { 
				whereClauses.add("(CONTAINS((positions.name, positions.code), :text) OR (CONTAINS(people.name, :text)))");
			} else { 
				whereClauses.add("CONTAINS((name, code), :text)");
			}
			sqlArgs.put("text", Utils.getSqlServerFullTextQuery(text));
		}
		
		if (query.getType() != null) { 
			List<String> argNames = new LinkedList<String>();
			for (int i = 0;i < query.getType().size();i++) { 
				argNames.add(":state" + i);
				sqlArgs.put("state" + i, DaoUtils.getEnumId(query.getType().get(i)));
			}
			whereClauses.add("positions.type IN (" + Joiner.on(", ").join(argNames) + ")");
		}
		
		if (query.getOrganizationId() != null) { 
			if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) { 
				commonTableExpression = "WITH parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :orgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.parentOrgId = po.id "
					+ ") ";
				whereClauses.add(" positions.organizationId IN (SELECT id from parent_orgs)");
			} else { 
				whereClauses.add("positions.organizationId = :orgId");
			}
			sqlArgs.put("orgId", query.getOrganizationId());
		}
		
		if (query.getIsFilled() != null) {
			if (query.getIsFilled()) { 
				whereClauses.add("positions.currentPersonId IS NOT NULL");
			} else { 
				whereClauses.add("positions.currentPersonId IS NULL");
			}
		}
		
		if (query.getLocationId() != null) { 
			whereClauses.add("positions.locationId = :locationId");
			sqlArgs.put("locationId", query.getLocationId());
		}
		
		if (query.getStatus() != null) { 
			whereClauses.add("positions.status = :status");
			sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus()));
		}
		
		if (whereClauses.size() == 0) { return result; }
		
		sql.append(Joiner.on(" AND ").join(whereClauses));
		
		//Sort Ordering
		sql.append(" ORDER BY ");
		if (query.getSortBy() == null) { query.setSortBy(PositionSearchSortBy.NAME); }
		switch (query.getSortBy()) {
			case CODE:
				sql.append("positions.code");
				break;
			case CREATED_AT:
				sql.append("positions.createdAt");
				break;
			case NAME:
			default:
				sql.append("positions.name");
				break;
		}
		
		if (query.getSortOrder() == null) { query.setSortOrder(SortOrder.ASC); }
		switch (query.getSortOrder()) {
			case ASC:
				sql.append(" ASC ");
				break;
			case DESC:
			default:
				sql.append(" DESC ");
				break;
		}
		sql.append(", positions.id ASC ");

		if (commonTableExpression != null) { 
			sql.insert(0, commonTableExpression);
		}

		final Query<Position> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, sqlArgs)
			.map(new PositionMapper());
		return PositionList.fromQuery(sqlQuery, query.getPageNum(), query.getPageSize());
	}
	
}