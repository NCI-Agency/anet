package mil.dds.anet.search.mssql;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.jdbi.v3.core.statement.Query;

import com.google.common.base.Joiner;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery.ReportSearchSortBy;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.search.ReportSearchBuilder;
import mil.dds.anet.search.AbstractSearchBuilder.Comparison;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class MssqlReportSearcher extends AbstractSearcherBase implements IReportSearcher {

	public AnetBeanList<Report> runSearch(ReportSearchQuery query, Person user, boolean systemSearch) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> args = new HashMap<String,Object>();
		final Map<String,List<?>> listArgs = new HashMap<>();
		final StringBuilder sql = new StringBuilder();
		sql.append("/* MssqlReportSearch */ SELECT *, count(*) OVER() AS totalCount FROM (");
		sql.append(" SELECT DISTINCT " + ReportDao.REPORT_FIELDS);

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
		sql.append(" LEFT JOIN reportTags ON reportTags.reportUuid = reports.uuid"
				+ " LEFT JOIN tags ON reportTags.tagUuid = tags.uuid");

		if (doFullTextSearch) {
			sql.append(" LEFT JOIN CONTAINSTABLE (reports, (text, intent, keyOutcomes, nextSteps), :containsQuery) c_reports"
					+ " ON reports.uuid = c_reports.[Key]"
					+ " LEFT JOIN FREETEXTTABLE(reports, (text, intent, keyOutcomes, nextSteps), :freetextQuery) f_reports"
					+ " ON reports.uuid = f_reports.[Key]");
			sql.append(" LEFT JOIN CONTAINSTABLE (tags, (name, description), :containsQuery) c_tags"
					+ " ON tags.uuid = c_tags.[Key]"
					+ " LEFT JOIN FREETEXTTABLE(tags, (name, description), :freetextQuery) f_tags"
					+ " ON tags.uuid = f_tags.[Key]");
			whereClauses.add("(c_reports.rank IS NOT NULL"
					+ " OR f_reports.rank IS NOT NULL"
					+ " OR c_tags.rank IS NOT NULL"
					+ " OR f_tags.rank IS NOT NULL)");
			args.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
			args.put("freetextQuery", text);
		}

		if (query.getAuthorUuid() != null) {
			whereClauses.add("reports.authorUuid = :authorUuid");
			args.put("authorUuid", query.getAuthorUuid());
		}

		ReportSearchBuilder searchBuilder = new ReportSearchBuilder(args, whereClauses);
		searchBuilder.addDateClause(query.getEngagementDateStart(), Comparison.AFTER, "engagementDate", "startDate");
		searchBuilder.addDateClause(query.getEngagementDateEnd(), Comparison.BEFORE, "engagementDate", "endDate");
		searchBuilder.addDateClause(query.getCreatedAtStart(), Comparison.AFTER, "createdAt", "startCreatedAt");
		searchBuilder.addDateClause(query.getCreatedAtEnd(), Comparison.BEFORE, "createdAt", "endCreatedAt");
		searchBuilder.addDateClause(query.getUpdatedAtStart(), Comparison.AFTER, "updatedAt", "updatedAtStart");
		searchBuilder.addDateClause(query.getUpdatedAtEnd(), Comparison.BEFORE, "updatedAt", "updatedAtEnd");
		searchBuilder.addDateClause(query.getReleasedAtStart(), Comparison.AFTER, "releasedAt", "releasedAtStart");
		searchBuilder.addDateClause(query.getReleasedAtEnd(), Comparison.BEFORE, "releasedAt", "releasedAtEnd");

		if (query.getEngagementDayOfWeek() != null) {
			whereClauses.add("DATEPART(dw, reports.engagementDate) = :engagementDayOfWeek");
			args.put("engagementDayOfWeek", query.getEngagementDayOfWeek());
		}

		if (query.getAttendeeUuid() != null) {
			whereClauses.add("reports.uuid IN (SELECT reportUuid from reportPeople where personUuid = :attendeeUuid)");
			args.put("attendeeUuid", query.getAttendeeUuid());
		}

		if (query.getAtmosphere() != null) {
			whereClauses.add("reports.atmosphere = :atmosphere");
			args.put("atmosphere", DaoUtils.getEnumId(query.getAtmosphere()));
		}

		if (query.getTaskUuid() != null) {
			if (Task.DUMMY_TASK_UUID.equals(query.getTaskUuid())) {
				whereClauses.add("NOT EXISTS (SELECT taskUuid from reportTasks where reportUuid = reports.uuid)");
			} else {
				whereClauses.add("reports.uuid IN (SELECT reportUuid from reportTasks where taskUuid = :taskUuid)");
				args.put("taskUuid", query.getTaskUuid());
			}
		}

		String commonTableExpression = null;
		if (query.getOrgUuid() != null) {
			if (query.getAdvisorOrgUuid() != null || query.getPrincipalOrgUuid() != null) {
				throw new WebApplicationException("Cannot combine orgUuid with principalOrgUuid or advisorOrgUuid parameters", Status.BAD_REQUEST);
			}
			if (query.getIncludeOrgChildren()) {
				commonTableExpression = "WITH parent_orgs(uuid) AS ( "
						+ "SELECT uuid FROM organizations WHERE uuid = :orgUuid "
					+ "UNION ALL "
						+ "SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid "
					+ ")";
				whereClauses.add("(reports.advisorOrganizationUuid IN (SELECT uuid from parent_orgs) "
						+ "OR reports.principalOrganizationUuid IN (SELECT uuid from parent_orgs))");
			} else {
				whereClauses.add("(reports.advisorOrganizationUuid = :orgUuid OR reports.principalOrganizationUuid = :orgUuid)");
			}
			args.put("orgUuid", query.getOrgUuid());
		}

		if (query.getAdvisorOrgUuid() != null) {
			if (Organization.DUMMY_ORG_UUID.equals(query.getAdvisorOrgUuid())) {
				whereClauses.add("reports.advisorOrganizationUuid IS NULL");
			} else if (query.getIncludeAdvisorOrgChildren()) {
				commonTableExpression = "WITH parent_orgs(uuid) AS ( "
						+ "SELECT uuid FROM organizations WHERE uuid = :advisorOrgUuid "
					+ "UNION ALL "
						+ "SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid "
					+ ")";
				whereClauses.add("reports.advisorOrganizationUuid IN (SELECT uuid from parent_orgs)");
			} else  {
				whereClauses.add("reports.advisorOrganizationUuid = :advisorOrgUuid");
			}

			args.put("advisorOrgUuid", query.getAdvisorOrgUuid());
		}

		if (query.getPrincipalOrgUuid() != null) {
			if (Organization.DUMMY_ORG_UUID.equals(query.getPrincipalOrgUuid())) {
				whereClauses.add("reports.principalOrganizationUuid IS NULL");
			} else if (query.getIncludePrincipalOrgChildren()) {
				commonTableExpression = "WITH parent_orgs(uuid) AS ( "
						+ "SELECT uuid FROM organizations WHERE uuid = :principalOrgUuid "
					+ "UNION ALL "
						+ "SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid "
					+ ")";
				whereClauses.add("reports.principalOrganizationUuid IN (SELECT uuid from parent_orgs)");
			} else {
				whereClauses.add("reports.principalOrganizationUuid = :principalOrgUuid");
			}
			args.put("principalOrgUuid", query.getPrincipalOrgUuid());
		}

		if (query.getLocationUuid() != null) {
			if (Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid())) {
				whereClauses.add("reports.locationUuid IS NULL");
			} else {
				whereClauses.add("reports.locationUuid = :locationUuid");
				args.put("locationUuid", query.getLocationUuid());
			}
		}

		if (query.getPendingApprovalOf() != null) {
			whereClauses.add("reports.authorUuid != :approverUuid");
			whereClauses.add("reports.approvalStepUuid IN "
				+ "(SELECT approvalStepUuid from approvers where positionUuid IN "
				+ "(SELECT uuid FROM positions where currentPersonUuid = :approverUuid))");
			args.put("approverUuid", query.getPendingApprovalOf());
		}

		if (!Utils.isEmptyOrNull(query.getState())) {
			whereClauses.add("reports.state IN ( <states> )");
			listArgs.put("states", query.getState().stream().map(state -> DaoUtils.getEnumId(state)).collect(Collectors.toList()));
		}

		if (query.getCancelledReason() != null) {
			if (ReportCancelledReason.NO_REASON_GIVEN.equals(query.getCancelledReason())) {
				whereClauses.add("reports.cancelledReason IS NULL");
			} else {
				whereClauses.add("reports.cancelledReason = :cancelledReason");
				args.put("cancelledReason", DaoUtils.getEnumId(query.getCancelledReason()));
			}
		}

		if (query.getTagUuid() != null) {
			whereClauses.add("reports.uuid IN (SELECT reportUuid from reportTags where tagUuid = :tagUuid)");
			args.put("tagUuid", query.getTagUuid());
		}

		if (query.getAuthorPositionUuid() != null) {
			// Search for reports authored by people serving in that position at the report's creation date
			whereClauses.add("reports.uuid IN ( SELECT r.uuid FROM reports r "
				+ PositionDao.generateCurrentPositionFilter("r.authorUuid", "r.createdAt", "authorPositionUuid")
				+ ")"
			);
			args.put("authorPositionUuid", query.getAuthorPositionUuid());
		}

		if (query.getAuthorizationGroupUuid() != null) {
			if (query.getAuthorizationGroupUuid().isEmpty()) {
				listArgs.put("authorizationGroupUuids", Arrays.asList("-1"));
			}
			else {
				listArgs.put("authorizationGroupUuids", query.getAuthorizationGroupUuid());
			}
			whereClauses.add("reports.uuid IN ( SELECT ra.reportUuid FROM reportAuthorizationGroups ra "
					+ "WHERE ra.authorizationGroupUuid IN ( <authorizationGroupUuids> ))");
		}

		if (query.getAttendeePositionUuid() != null) {
			// Search for reports attended by people serving in that position at the engagement date
			whereClauses.add("reports.uuid IN ( SELECT r.uuid FROM reports r "
				+ "JOIN reportPeople rp ON rp.reportUuid = r.uuid "
				+ PositionDao.generateCurrentPositionFilter("rp.personUuid", "r.engagementDate", "attendeePositionUuid")
				+ ")"
			);
			args.put("attendeePositionUuid", query.getAttendeePositionUuid());
		}

		if (query.getSensitiveInfo()) {
			sql.append(" LEFT JOIN reportAuthorizationGroups ra ON ra.reportUuid = reports.uuid");
			sql.append(" LEFT JOIN authorizationGroups ag ON ag.uuid = ra.authorizationGroupUuid");
			sql.append(" LEFT JOIN authorizationGroupPositions agp ON agp.authorizationGroupUuid = ag.uuid");
			sql.append(" LEFT JOIN positions pos ON pos.uuid = agp.positionUuid");
			whereClauses.add("pos.currentPersonUuid = :userUuid");
			args.put("userUuid", user.getUuid());
		}

		if (whereClauses.isEmpty()) {
			return new AnetBeanList<Report>(query.getPageNum(), query.getPageSize(), new ArrayList<Report>());
		}

		if (!systemSearch) {
			//Apply a filter to restrict access to other's draft, rejected or approved reports.
			//When the search is performed by the system (for instance by a worker, systemSearch = true) do not apply this filter.
			if (user == null) {
				whereClauses.add("reports.state != :draftState");
				whereClauses.add("reports.state != :rejectedState");
				whereClauses.add("reports.state != :approvedState");
				args.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
				args.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
				args.put("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
			} else {
				whereClauses.add("((reports.state != :draftState AND reports.state != :rejectedState) OR (reports.authorUuid = :userUuid))");
				args.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
				args.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
				args.put("userUuid", user.getUuid());
				if (AuthUtils.isAdmin(user) == false) {
					//Admin users may access all approved reports, other users only owned approved reports
					whereClauses.add("((reports.state != :approvedState) OR (reports.authorUuid = :userUuid))");
					args.put("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
				}
			}
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
			case UPDATED_AT:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports_updatedAt"));
				break;
			case ENGAGEMENT_DATE:
			default:
				orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports_engagementDate"));
				break;
		}
		orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, null, "reports_uuid"));
		sql.append(" ORDER BY ");
		sql.append(Joiner.on(", ").join(orderByClauses));

		if (commonTableExpression != null) {
			sql.insert(0, commonTableExpression);
		}

		final Query sqlQuery = MssqlSearcher.addPagination(query, getDbHandle(), sql, args, listArgs);
		return AnetBeanList.getReportList(user, sqlQuery, query.getPageNum(), query.getPageSize(), new ReportMapper());

	}

}
