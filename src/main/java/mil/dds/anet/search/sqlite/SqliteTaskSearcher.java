package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.jdbi.v3.core.Handle;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqliteTaskSearcher implements ITaskSearcher {

	@Override
	public AnetBeanList<Task> runSearch(TaskSearchQuery query, Handle dbHandle) {
		StringBuilder sql = new StringBuilder("/* SqliteTaskSearch */ SELECT tasks.* FROM tasks");
		Map<String,Object> args = new HashMap<String,Object>();
		
		sql.append(" WHERE ");
		List<String> whereClauses = new LinkedList<String>();
		String commonTableExpression = null;
		final AnetBeanList<Task> result = new AnetBeanList<Task>(query.getPageNum(), query.getPageSize(), new ArrayList<Task>());
		
		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		if (doFullTextSearch) {
			whereClauses.add("(\"longName\" LIKE '%' || :text || '%' OR \"shortName\" LIKE '%' || :text || '%')");
			args.put("text", Utils.getSqliteFullTextQuery(text));
		}
		
		if (query.getResponsibleOrgUuid() != null) {
			if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) {
				commonTableExpression = "WITH RECURSIVE parent_orgs(uuid) AS ( "
						+ "SELECT uuid FROM organizations WHERE uuid = :orgUuid "
					+ "UNION ALL "
						+ "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
					+ ") ";
				whereClauses.add(" \"organizationUuid\" IN (SELECT uuid from parent_orgs)");
			} else { 
				whereClauses.add("\"organizationUuid\" = :orgUuid");
			}
			args.put("orgUuid", query.getResponsibleOrgUuid());
		}
		
		if (query.getCategory() != null) { 
			whereClauses.add("category = :category");
			args.put("category", query.getCategory());
		}
		
		if (query.getStatus() != null) { 
			whereClauses.add("status = :status");
			args.put("status", DaoUtils.getEnumId(query.getStatus()));
		}
		
		if (whereClauses.size() == 0) { return result; }
		
		sql.append(Joiner.on(" AND ").join(whereClauses));
		sql.append(" ORDER BY \"shortName\" ASC LIMIT :limit OFFSET :offset");
		
		if (commonTableExpression != null) { 
			sql.insert(0, commonTableExpression);
		}
		
		result.setList(dbHandle.createQuery(sql.toString())
			.bindMap(args)
			.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize())
			.map(new TaskMapper())
			.list());
		result.setTotalCount(result.getList().size()); // Sqlite cannot do true total counts, so this is a crutch.
		return result;
	}
	
}
