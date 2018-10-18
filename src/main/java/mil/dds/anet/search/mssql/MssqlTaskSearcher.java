package mil.dds.anet.search.mssql;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery.TaskSearchSortBy;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlTaskSearcher implements ITaskSearcher {

	@Override
	public AnetBeanList<Task> runSearch(TaskSearchQuery query, Handle dbHandle) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> args = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder("/* MssqlTaskSearch */ SELECT tasks.*");

		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		if (doFullTextSearch) {
			// If we're doing a full-text search, add a pseudo-rank (giving LIKE matches the highest possible score)
			// so we can sort on it (show the most relevant hits at the top).
			sql.append(", ISNULL(c_tasks.rank, 0)"
					+ " + CASE WHEN tasks.shortName LIKE :likeQuery THEN 1000 ELSE 0 END");
			sql.append(" AS search_rank");
		}
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
			whereClauses.add("customFieldEnum1 LIKE :projectStatus");
			args.put("projectStatus", query.getProjectStatus());
		}

		if (query.getPlannedCompletionStart() != null) {
			whereClauses.add("plannedCompletion >= :plannedCompletionStart");
			args.put("plannedCompletionStart", Utils.handleRelativeDate(query.getPlannedCompletionStart()));
		}

		if (query.getPlannedCompletionEnd() != null) {
			whereClauses.add("plannedCompletion <= :plannedCompletionEnd");
			args.put("plannedCompletionEnd", Utils.handleRelativeDate(query.getPlannedCompletionEnd()));
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

		if (whereClauses.isEmpty()) {
			return new AnetBeanList<Task>(query.getPageNum(), query.getPageSize(), new ArrayList<Task>());
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

		if (query.getSortBy() == null) { query.setSortBy(TaskSearchSortBy.NAME); }
		if (query.getSortOrder() == null) { query.setSortOrder(SortOrder.ASC); }
		switch (query.getSortBy()) {
			case CREATED_AT:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "tasks", "createdAt"));
				break;
			case CATEGORY:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "tasks", "category"));
				break;
			case NAME:
			default:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "tasks", "shortName", "longName"));
				break;
		}
		orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "tasks", "id"));
		sql.append(" ORDER BY ");
		sql.append(Joiner.on(", ").join(orderByClauses));

		if (commonTableExpression != null) {
			sql.insert(0, commonTableExpression);
		}

		final Query<Task> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, args)
			.map(new TaskMapper());
		return new AnetBeanList<Task>(sqlQuery, query.getPageNum(), query.getPageSize(), null);
	}

}
