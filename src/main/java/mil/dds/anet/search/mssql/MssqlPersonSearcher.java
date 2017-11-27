package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.PersonList;
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
	public PersonList runSearch(PersonSearchQuery query, Handle dbHandle) { 
		StringBuilder sql = new StringBuilder("/* MssqlPersonSearch */ SELECT " + PersonDao.PERSON_FIELDS 
				+ ", count(*) over() as totalCount "
				+ "FROM people ");
		Map<String,Object> sqlArgs = new HashMap<String,Object>();
		String commonTableExpression = null;
		
		if (query.getOrgId() != null || query.getLocationId() != null || query.getMatchPositionName()) { 
			sql.append(" LEFT JOIN positions ON people.id = positions.currentPersonId ");
		}
		
		sql.append(" WHERE ");
		List<String> whereClauses = new LinkedList<String>();
		PersonList result = new PersonList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());
		
		String text = query.getText();
		if (text != null && text.trim().length() > 0) {
			if (query.getMatchPositionName()) { 
				whereClauses.add("(CONTAINS ((people.name, emailAddress, biography), :containsQuery) "
						+ "OR FREETEXT((people.name, biography), :freetextQuery) "
						+ "OR CONTAINS((positions.name, positions.code), :containsQuery))");
			} else { 
				whereClauses.add("(CONTAINS ((people.name, people.emailAddress, people.biography), :containsQuery) "
						+ "OR FREETEXT((people.name, people.biography), :freetextQuery))");
			}
			sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(query.getText()));
			sqlArgs.put("freetextQuery", query.getText());
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
		
		if (query.getCountry() != null && query.getCountry().trim().length() > 0) { 
			whereClauses.add(" people.country = :country ");
			sqlArgs.put("country", query.getCountry());
		}
		
		if (query.getPendingVerification() != null) { 
			whereClauses.add(" people.pendingVerification = :pendingVerification ");
			sqlArgs.put("pendingVerification", query.getPendingVerification());
		}
		
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
		
		if (whereClauses.size() == 0) { return result; }
		
		sql.append(Joiner.on(" AND ").join(whereClauses));
		
		//Sort Ordering
		sql.append(" ORDER BY ");
		if (query.getSortBy() == null) { query.setSortBy(PersonSearchSortBy.NAME); }
		switch (query.getSortBy()) {
			case RANK:
				sql.append("people.rank");
				break;
			case CREATED_AT:
				sql.append("people.createdAt");
				break;
			case NAME:
			default:
				sql.append("people.name");
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
		sql.append(", people.id ASC ");

		if (commonTableExpression != null) { 
			sql.insert(0, commonTableExpression);
		}

		final Query<Person> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, sqlArgs)
			.map(new PersonMapper());
		return PersonList.fromQuery(sqlQuery, query.getPageNum(), query.getPageSize());
	}

	
	
}
