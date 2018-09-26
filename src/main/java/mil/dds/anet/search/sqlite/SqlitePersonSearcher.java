package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery.PersonSearchSortBy;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqlitePersonSearcher implements IPersonSearcher {

	protected String buildOrderBy(PersonSearchQuery query) {
		if (query.getSortBy() == null) { query.setSortBy(PersonSearchSortBy.NAME); }
		if (query.getSortOrder() == null) { query.setSortOrder(SortOrder.ASC); }
		StringBuilder orderBy = new StringBuilder(" ORDER BY ");
		switch (query.getSortBy()) {
			case RANK:
				orderBy.append("people.rank");
				break;
			case CREATED_AT:
				orderBy.append("people.\"createdAt\"");
				break;
			case NAME:
			default:
				// case-insensitive ordering! could use COLLATE NOCASE but not if we want this to
				// work as a generic new-database searcher for pg/mysql
				orderBy.append("LOWER(people.\"name\")");
				break;
		}
		switch (query.getSortOrder()) {
			case ASC:
				orderBy.append(" ASC ");
				break;
			case DESC:
			default:
				orderBy.append(" DESC ");
				break;
		}

		return orderBy.toString();
	}

	@Override
	public AnetBeanList<Person> runSearch(PersonSearchQuery query, Handle dbHandle) {
		StringBuilder sql = new StringBuilder("/* SqlitePersonSearch */ SELECT " + PersonDao.PERSON_FIELDS 
				+ " FROM people WHERE people.id IN (SELECT people.id FROM people ");
		Map<String,Object> sqlArgs = new HashMap<String,Object>();
		
		if (query.getOrgId() != null || query.getLocationId() != null || query.getMatchPositionName()) { 
			sql.append(" LEFT JOIN positions ON people.id = positions.\"currentPersonId\" ");
		}
		
		sql.append(" WHERE ");
		List<String> whereClauses = new LinkedList<String>();
		final AnetBeanList<Person> result = new AnetBeanList<Person>(query.getPageNum(), query.getPageSize(), new ArrayList<Person>());
		
		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		if (doFullTextSearch) {
			if (query.getMatchPositionName()) { 
				whereClauses.add("(people.name LIKE '%' || :text || '%' "
						+ "OR \"emailAddress\" LIKE '%' || :text || '%' "
						+ "OR biography LIKE '%' || :text || '%'"
						+ "OR positions.name LIKE '%' || :text || '%'"
						+ "OR positions.code LIKE '%' || :text || '%')");
			} else { 
				whereClauses.add("(people.name LIKE '%' || :text || '%' "
						+ "OR \"emailAddress\" LIKE '%' || :text || '%' "
						+ "OR biography LIKE '%' || :text || '%')");
			}
			sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
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
			whereClauses.add(" people.\"pendingVerification\" = :pendingVerification ");
			sqlArgs.put("pendingVerification", query.getPendingVerification());
		}
		
		if (query.getOrgId() != null) { 
			if (query.getIncludeChildOrgs() != null && query.getIncludeChildOrgs()) { 
				whereClauses.add(" positions.\"organizationId\" IN ( "
					+ "WITH RECURSIVE parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :orgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.\"parentOrgId\" = po.id "
					+ ") SELECT id from parent_orgs)");
			} else { 
				whereClauses.add(" positions.\"organizationId\" = :orgId ");
			}
			sqlArgs.put("orgId", query.getOrgId());
		}
		
		if (query.getLocationId() != null) { 
			whereClauses.add(" positions.\"locationId\" = :locationId ");
			sqlArgs.put("locationId", query.getLocationId());
		}
		
		if (whereClauses.size() == 0) { return result; }
		
		sql.append(Joiner.on(" AND ").join(whereClauses));
		
		//Sort Ordering
		String orderBy = buildOrderBy(query);
		sql.append(orderBy);
		sql.append(" LIMIT :limit OFFSET :offset)");
		// append outside the subselect to enforce ordering there
		sql.append(orderBy);

		List<Person> list = dbHandle.createQuery(sql.toString())
			.bindFromMap(sqlArgs)
			.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize())
			.map(new PersonMapper())
			.list();
		result.setList(list);
		result.setTotalCount(list.size()); // Sqlite cannot do true total counts, so this is a crutch. 
		return result;
	}

	
	
	
}
