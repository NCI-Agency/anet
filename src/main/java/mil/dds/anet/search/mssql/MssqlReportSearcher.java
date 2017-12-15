package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import com.google.common.base.Joiner;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.ReportList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery.ReportSearchSortBy;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlReportSearcher implements IReportSearcher {

	public ReportList runSearch(ReportSearchQuery query, Handle dbHandle, Person user) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> args = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder();
		sql.append("/* MssqlReportSearch */ SELECT *, count(*) OVER() AS totalCount FROM (");
		sql.append(" SELECT DISTINCT " + ReportDao.REPORT_FIELDS + ", " + PersonDao.PERSON_FIELDS);

		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		if (doFullTextSearch) {
			// If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
			// so we can sort on it (show the most relevant hits at the top).
			// Note that summing up independent ranks is not ideal, but it's the best we can do now.
			// See https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
			sql.append(", ISNULL(c_reports.rank, 0) + ISNULL(f_reports.rank, 0)"
					+ " + ISNULL(c_tags.rank, 0) + ISNULL(f_tags.rank, 0)");
			sql.append(" AS search_rank");
		}
		if (query.getIncludeEngagementDayOfWeek()) {
			sql.append(", DATEPART(dw, reports.engagementDate) as engagementDayOfWeek");
		}
		sql.append(" FROM reports");
		sql.append(" LEFT JOIN reportTags ON reportTags.reportId = reports.id"
				+ " LEFT JOIN tags ON reportTags.tagId = tags.id");

		if (doFullTextSearch) {
			sql.append(" LEFT JOIN CONTAINSTABLE (reports, (text, intent, keyOutcomes, nextSteps), :containsQuery) c_reports"
					+ " ON reports.id = c_reports.[Key]"
					+ " LEFT JOIN FREETEXTTABLE(reports, (text, intent, keyOutcomes, nextSteps), :freetextQuery) f_reports"
					+ " ON reports.id = f_reports.[Key]");
			sql.append(" LEFT JOIN CONTAINSTABLE (tags, (name, description), :containsQuery) c_tags"
					+ " ON tags.id = c_tags.[Key]"
					+ " LEFT JOIN FREETEXTTABLE(tags, (name, description), :freetextQuery) f_tags"
					+ " ON tags.id = f_tags.[Key]");
			whereClauses.add("(c_reports.rank IS NOT NULL"
					+ " OR f_reports.rank IS NOT NULL"
					+ " OR c_tags.rank IS NOT NULL"
					+ " OR f_tags.rank IS NOT NULL)");
			args.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
			args.put("freetextQuery", text);
		}

		sql.append(", people");
		whereClauses.add("reports.authorId = people.id");

		if (query.getAuthorId() != null) {
			whereClauses.add("reports.authorId = :authorId");
			args.put("authorId", query.getAuthorId());
		}
		if (query.getEngagementDateStart() != null) {
			whereClauses.add("reports.engagementDate >= :startDate");
			args.put("startDate", Utils.handleRelativeDate(query.getEngagementDateStart()));
		}
		if (query.getEngagementDateEnd() != null) {
			whereClauses.add("reports.engagementDate <= :endDate");
			args.put("endDate", Utils.handleRelativeDate(query.getEngagementDateEnd()));
		}
		if (query.getEngagementDayOfWeek() != null) {
			whereClauses.add("DATEPART(dw, reports.engagementDate) = :engagementDayOfWeek");
			args.put("engagementDayOfWeek", query.getEngagementDayOfWeek());
		}

		if (query.getCreatedAtStart() != null) {
			whereClauses.add("reports.createdAt >= :startCreatedAt");
			args.put("startCreatedAt", Utils.handleRelativeDate(query.getCreatedAtStart()));
		}
		if (query.getCreatedAtEnd() != null) {
			whereClauses.add("reports.createdAt <= :endCreatedAt");
			args.put("endCreatedAt", Utils.handleRelativeDate(query.getCreatedAtEnd()));
		}

		if (query.getUpdatedAtStart() != null) {
			whereClauses.add("reports.updatedAt >= :updatedAtStart");
			args.put("updatedAtStart", Utils.handleRelativeDate(query.getUpdatedAtStart()));
		}
		if (query.getUpdatedAtEnd() != null) {
			whereClauses.add("reports.updatedAt <= :updatedAtEnd");
			args.put("updatedAtEnd", Utils.handleRelativeDate(query.getUpdatedAtEnd()));
		}

		if (query.getReleasedAtStart() != null) {
			whereClauses.add("reports.releasedAt >= :releasedAtStart");
			args.put("releasedAtStart", Utils.handleRelativeDate(query.getReleasedAtStart()));
		}
		if (query.getReleasedAtEnd() != null) {
			whereClauses.add("reports.releasedAt <= :releasedAtEnd");
			args.put("releasedAtEnd", Utils.handleRelativeDate(query.getReleasedAtEnd()));
		}

		if (query.getAttendeeId() != null) {
			whereClauses.add("reports.id IN (SELECT reportId from reportPeople where personId = :attendeeId)");
			args.put("attendeeId", query.getAttendeeId());
		}

		if (query.getAtmosphere() != null) {
			whereClauses.add("reports.atmosphere = :atmosphere");
			args.put("atmosphere", DaoUtils.getEnumId(query.getAtmosphere()));
		}

		if (query.getTaskId() != null) {
			whereClauses.add("reports.id IN (SELECT reportId from reportTasks where taskId = :taskId)");
			args.put("taskId", query.getTaskId());
		}

		String commonTableExpression = null;
		if (query.getOrgId() != null) {
			if (query.getAdvisorOrgId() != null || query.getPrincipalOrgId() != null) {
				throw new WebApplicationException("Cannot combine orgId with principalOrgId or advisorOrgId parameters", Status.BAD_REQUEST);
			}
			if (query.getIncludeOrgChildren()) {
				commonTableExpression = "WITH parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :orgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.parentOrgId = po.id "
					+ ")";
				whereClauses.add("(reports.advisorOrganizationId IN (SELECT id from parent_orgs) "
						+ "OR reports.principalOrganizationId IN (SELECT id from parent_orgs))");
			} else {
				whereClauses.add("(reports.advisorOrganizationId = :orgId OR reports.principalOrganizationId = :orgId)");
			}
			args.put("orgId", query.getOrgId());
		}

		if (query.getAdvisorOrgId() != null) {
			if (query.getAdvisorOrgId() == -1) {
				whereClauses.add("reports.advisorOrganizationId IS NULL");
			} else if (query.getIncludeAdvisorOrgChildren()) {
				commonTableExpression = "WITH parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :advisorOrgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.parentOrgId = po.id "
					+ ")";
				whereClauses.add("reports.advisorOrganizationId IN (SELECT id from parent_orgs)");
			} else  {
				whereClauses.add("reports.advisorOrganizationId = :advisorOrgId");
			}

			args.put("advisorOrgId", query.getAdvisorOrgId());
		}

		if (query.getPrincipalOrgId() != null) {
			if (query.getPrincipalOrgId() == -1) {
				whereClauses.add("reports.principalOrganizationId IS NULL");
			} else if (query.getIncludePrincipalOrgChildren()) {
				commonTableExpression = "WITH parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :principalOrgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.parentOrgId = po.id "
					+ ")";
				whereClauses.add("reports.principalOrganizationId IN (SELECT id from parent_orgs)");
			} else {
				whereClauses.add("reports.principalOrganizationId = :principalOrgId");
			}
			args.put("principalOrgId", query.getPrincipalOrgId());
		}

		if (query.getLocationId() != null) {
			whereClauses.add("locationId = :locationId");
			args.put("locationId", query.getLocationId());
		}

		if (query.getPendingApprovalOf() != null) {
			whereClauses.add("reports.approvalStepId IN "
				+ "(SELECT approvalStepId from approvers where positionId IN "
				+ "(SELECT id FROM positions where currentPersonId = :approverId))");
			args.put("approverId", query.getPendingApprovalOf());
		}

		if (query.getState() != null && query.getState().size() > 0) {
			if (query.getState().size() == 1) {
				whereClauses.add("reports.state = :state");
				args.put("state", DaoUtils.getEnumId(query.getState().get(0)));
			} else {
				List<String> argNames = new LinkedList<String>();
				for (int i = 0;i < query.getState().size();i++) {
					argNames.add(":state" + i);
					args.put("state" + i, DaoUtils.getEnumId(query.getState().get(i)));
				}
				whereClauses.add("reports.state IN (" + Joiner.on(", ").join(argNames) + ")");
			}
		}

		if (query.getCancelledReason() != null) {
			whereClauses.add("reports.cancelledReason = :cancelledReason");
			args.put("cancelledReason", DaoUtils.getEnumId(query.getCancelledReason()));
		}

		if (query.getTagId() != null) {
			whereClauses.add("reports.id IN (SELECT reportId from reportTags where tagId = :tagId)");
			args.put("tagId", query.getTagId());
		}

		if (query.getAuthorPositionId() != null) {
			// Search for reports authored by people serving in that position at the report's creation date
			whereClauses.add("reports.id IN ( SELECT r.id FROM reports r "
							+ "JOIN peoplePositions pp ON pp.personId = r.authorId "
							+ "  AND pp.createdAt <= r.createdAt "
							+ "LEFT JOIN peoplePositions maxPp ON maxPp.positionId = pp.positionId "
							+ "  AND maxPp.createdAt > pp.createdAt "
							+ "  AND maxPp.createdAt <= r.createdAt "
							+ "WHERE pp.positionId = :authorPositionId "
							+ "  AND maxPp.createdAt IS NULL )");
			args.put("authorPositionId", query.getAuthorPositionId());
		}

		if (query.getAttendeePositionId() != null) {
			// Search for reports attended by people serving in that position at the engagement date
			whereClauses.add("reports.id IN ( SELECT r.id FROM reports r "
							+ "JOIN reportPeople rp ON rp.reportId = r.id "
							+ "JOIN peoplePositions pp ON pp.personId = rp.personId "
							+ "  AND pp.createdAt <= r.engagementDate "
							+ "LEFT JOIN peoplePositions maxPp ON maxPp.positionId = pp.positionId "
							+ "  AND maxPp.createdAt > pp.createdAt "
							+ "  AND maxPp.createdAt <= r.engagementDate "
							+ "WHERE pp.positionId = :attendeePositionId "
							+ "  AND maxPp.createdAt IS NULL )");
			args.put("attendeePositionId", query.getAttendeePositionId());
		}

		final ReportList results = new ReportList();
		results.setPageNum(query.getPageNum());
		results.setPageSize(query.getPageSize());

		if (whereClauses.isEmpty()) {
			return results;
		}

		//Apply a filter to restrict access to other's draft reports
		if (user == null) {
			whereClauses.add("reports.state != :draftState");
			whereClauses.add("reports.state != :rejectedState");
			args.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
			args.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
		} else {
			whereClauses.add("((reports.state != :draftState AND reports.state != :rejectedState) OR (reports.authorId = :userId))");
			args.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
			args.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
			args.put("userId", user.getId());
		}

		sql.append(" WHERE ");
		sql.append(Joiner.on(" AND ").join(whereClauses));
		sql.append(" ) l");

		//Sort Ordering
		final List<String> orderByClauses = new LinkedList<>();
		if (doFullTextSearch && query.getSortBy() == null) {
			// We're doing a full-text search without an explicit sort order,
			// so sort first on the search pseudo-rank.
			orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
		}

		if (query.getSortBy() == null) { query.setSortBy(ReportSearchSortBy.ENGAGEMENT_DATE); }
		if (query.getSortOrder() == null) { query.setSortOrder(SortOrder.DESC); }
		// Beware of the sort field names, they have to match what's in the selected fields!
		switch (query.getSortBy()) {
			case CREATED_AT:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports_createdAt"));
				break;
			case RELEASED_AT:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports_releasedAt"));
				break;
			case ENGAGEMENT_DATE:
			default:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports_engagementDate"));
				break;
		}
		orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, null, "reports_id"));
		sql.append(" ORDER BY ");
		sql.append(Joiner.on(", ").join(orderByClauses));

		if (commonTableExpression != null) {
			sql.insert(0, commonTableExpression);
		}

		final Query<Report> map = MssqlSearcher.addPagination(query, dbHandle, sql, args)
				.map(new ReportMapper());
		return ReportList.fromQuery(user, map, query.getPageNum(), query.getPageSize());

	}

}
