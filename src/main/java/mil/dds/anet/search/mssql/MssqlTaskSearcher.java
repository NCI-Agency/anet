package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.TaskList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlTaskSearcher implements ITaskSearcher {

	@Override
	public TaskList runSearch(TaskSearchQuery query, Handle dbHandle) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> args = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder("/* MssqlTaskSearch */ SELECT tasks.*");

		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		sql.append(", COUNT(*) OVER() AS totalCount FROM tasks");

		if (doFullTextSearch) {
			sql.append(" LEFT JOIN CONTAINSTABLE (tasks, (longName), :containsQuery) c_tasks"
					+ " ON tasks.id = c_tasks.[Key]");
			whereClauses.add("(c_tasks.rank IS NOT NULL"
					+ " OR tasks.shortName LIKE :likeQuery)");
			args.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
			args.put("likeQuery", Utils.prepForLikeQuery(text) + "%");
		}

		String commonTableExpression = null;
		if (query.getResponsibleOrgId() != null) {
			if (query.getIncludeChildrenOrgs() != null && query.getIncludeChildrenOrgs()) {
				commonTableExpression = "WITH parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :orgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.parentOrgId = po.id "
					+ ") ";
				whereClauses.add(" organizationId IN (SELECT id from parent_orgs)");
			} else {
				whereClauses.add("organizationId = :orgId");
			}
			args.put("orgId", query.getResponsibleOrgId());
		}

		if (query.getCategory() != null) {
			whereClauses.add("category = :category");
			args.put("category", query.getCategory());
		}

		if (query.getStatus() != null) {
			whereClauses.add("status = :status");
			args.put("status", DaoUtils.getEnumId(query.getStatus()));
		}

		if (query.getProjectStatus() != null) {
			whereClauses.add("customFieldEnum LIKE :projectStatus");
			args.put("projectStatus", query.getProjectStatus());
		}

		if (query.getPlannedCompletionStart() != null) {
			whereClauses.add("plannedCompletion >= :plannedCompletionStart");
			args.put("plannedCompletionStart", Utils.handleRelativeDate(query.getPlannedCompletionStart()));
		}

		if (query.getPlannedCompletionEnd() != null) {
			whereClauses.add("plannedCompletion <= :plannedCompletionStart");
			args.put("plannedCompletionStart", Utils.handleRelativeDate(query.getPlannedCompletionEnd()));
		}

		if (query.getProjectedCompletionStart() != null) {
			whereClauses.add("projectedCompletion >= :projectedCompletionStart");
			args.put("projectedCompletionStart", Utils.handleRelativeDate(query.getProjectedCompletionStart()));
		}

		if (query.getProjectedCompletionEnd() != null) {
			whereClauses.add("projectedCompletion <= :projectedCompletionEnd");
			args.put("projectedCompletionEnd", Utils.handleRelativeDate(query.getProjectedCompletionEnd()));
		}

		if (query.getCustomField() != null) {
			whereClauses.add("customField LIKE :customField");
			args.put("customField", Utils.prepForLikeQuery(query.getCustomField()) + "%");
		}

		final TaskList result =  new TaskList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());

		if (whereClauses.isEmpty()) {
			return result;
		}

		sql.append(" WHERE ");
		sql.append(Joiner.on(" AND ").join(whereClauses));
		sql.append(" ORDER BY poams.shortName ASC, poams.longName ASC, poams.id ASC");

		if (commonTableExpression != null) {
			sql.insert(0, commonTableExpression);
		}

		final Query<Task> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, args)
			.map(new TaskMapper());
		return TaskList.fromQuery(sqlQuery, query.getPageNum(), query.getPageSize());
	}

}
