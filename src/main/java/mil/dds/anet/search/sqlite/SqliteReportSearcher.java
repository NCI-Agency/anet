package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;

import com.google.common.base.Joiner;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery.ReportSearchSortBy;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.search.ReportSearchBuilder;
import mil.dds.anet.search.ReportSearchBuilder.Comparison;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqliteReportSearcher implements IReportSearcher {

	private String isoDowFormat;
	private String isoDowComparison;


	public SqliteReportSearcher(String isoDowFormat) {
		this.isoDowFormat = isoDowFormat;
		this.isoDowComparison = "(" + this.isoDowFormat + ") = :%s";
	}

	public SqliteReportSearcher() {
		this("strftime('%%w', substr(reports.\"%s\", 1, 10)) + 1");	// %w day of week 0-6 with Sunday==0
	}

	public AnetBeanList<Report> runSearch(ReportSearchQuery query, Handle dbHandle, Person user, Boolean systemSearch) {
		StringBuffer sql = new StringBuffer();
		sql.append("/* SqliteReportSearch */ SELECT DISTINCT " + ReportDao.REPORT_FIELDS);
		if (query.getIncludeEngagementDayOfWeek()) {
			sql.append(", ");
			sql.append(String.format(this.isoDowFormat, "engagementDate"));
			sql.append(" as \"engagementDayOfWeek\" ");
		}
		sql.append(" FROM reports ");
		sql.append("WHERE reports.uuid IN ( SELECT reports.uuid FROM reports ");
		sql.append("LEFT JOIN \"reportTags\" ON \"reportTags\".\"reportUuid\" = reports.uuid ");
		sql.append("LEFT JOIN tags ON \"reportTags\".\"tagUuid\" = tags.uuid ");
		
		String commonTableExpression = null;
		Map<String,Object> args = new HashMap<String,Object>();
		final Map<String,List<?>> listArgs = new HashMap<>();
		List<String> whereClauses = new LinkedList<String>();
		ReportSearchBuilder searchBuilder = new ReportSearchBuilder(args, whereClauses);
		if (query.getAuthorUuid() != null) {
			whereClauses.add("reports.\"authorUuid\" = :authorUuid");
			args.put("authorUuid", query.getAuthorUuid());
		}
		
		final String text = query.getText();
		final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
		if (doFullTextSearch) {
			whereClauses.add("(text LIKE '%' || :text || '%' OR "
					+ "intent LIKE '%' || :text || '%' OR "
					+ "\"keyOutcomes\" LIKE '%' || :text || '%' OR "
					+ "\"nextSteps\" LIKE '%' || :text || '%' OR "
					+ "tags.name LIKE '%' || :text || '%' OR "
					+ "tags.description LIKE '%' || :text || '%'"
					+ ")");
			args.put("text", Utils.getSqliteFullTextQuery(text));
		}
		
		searchBuilder.addDateClause(query.getEngagementDateStart(), Comparison.AFTER, "engagementDate", "startDate");
		searchBuilder.addDateClause(query.getEngagementDateEnd(), Comparison.BEFORE, "engagementDate", "endDate");
		searchBuilder.addDateClause(query.getCreatedAtStart(), Comparison.AFTER, "createdAt", "startCreatedAt");
		searchBuilder.addDateClause(query.getCreatedAtStart(), Comparison.BEFORE	, "createdAt", "endCreatedAt");
		searchBuilder.addDateClause(query.getUpdatedAtStart(), Comparison.AFTER, "updatedAt", "updatedAtStart");
		searchBuilder.addDateClause(query.getUpdatedAtEnd(), Comparison.BEFORE, "updatedAt", "updatedAtEnd");
		searchBuilder.addDateClause(query.getReleasedAtStart(), Comparison.AFTER, "releasedAt", "releasedAtStart");
		searchBuilder.addDateClause(query.getReleasedAtEnd(), Comparison.BEFORE, "releasedAt", "releasedAtEnd");

		if (query.getEngagementDayOfWeek() != null) {
			whereClauses.add(String.format(this.isoDowComparison, "engagementDate", "engagementDayOfWeek"));
			args.put("engagementDayOfWeek", query.getEngagementDayOfWeek());
		}

		if (query.getAttendeeUuid() != null) {
			whereClauses.add("reports.uuid IN (SELECT \"reportUuid\" from \"reportPeople\" where \"personUuid\" = :attendeeUuid)");
			args.put("attendeeUuid", query.getAttendeeUuid());
		}

		if (query.getAuthorPositionUuid() != null) {
			// Search for reports authored by people serving in that position at the report's creation date
			whereClauses.add("reports.uuid IN ( SELECT r.uuid FROM reports r "
				+ PositionDao.generateCurrentPositionFilter("r.\"authorUuid\"", "r.\"createdAt\"", "authorPositionUuid")
				+ ")"
			);
			args.put("authorPositionUuid", query.getAuthorPositionUuid());
		}

		if (query.getAttendeePositionUuid() != null) {
			// Search for reports attended by people serving in that position at the engagement date
			whereClauses.add("reports.uuid IN ( SELECT r.uuid FROM reports r "
				+ "JOIN \"reportPeople\" rp ON rp.\"reportUuid\" = r.uuid "
				+ PositionDao.generateCurrentPositionFilter("rp.\"personUuid\"", "r.\"engagementDate\"", "attendeePositionUuid")
				+ ")"
			);
			args.put("attendeePositionUuid", query.getAttendeePositionUuid());
		}

		if (query.getAtmosphere() != null) { 
			whereClauses.add("reports.atmosphere = :atmosphere");
			args.put("atmosphere", DaoUtils.getEnumId(query.getAtmosphere()));
		}
		
		if (query.getTaskUuid() != null) {
			if (Task.DUMMY_TASK_UUID.equals(query.getTaskUuid())) {
				whereClauses.add("NOT EXISTS (SELECT \"taskUuid\" from \"reportTasks\" where \"reportUuid\" = reports.uuid)");
			} else {
				whereClauses.add("reports.uuid IN (SELECT \"reportUuid\" from \"reportTasks\" where \"taskUuid\" = :taskUuid)");
				args.put("taskUuid", query.getTaskUuid());
			}
		}
		
		if (query.getOrgUuid() != null) {
			if (query.getAdvisorOrgUuid() != null || query.getPrincipalOrgUuid() != null) {
				throw new WebApplicationException("Cannot combine orgUuid with principalOrgUuid or advisorOrgUuid parameters", Status.BAD_REQUEST);
			}
			if (query.getIncludeOrgChildren()) { 
				commonTableExpression = "WITH RECURSIVE parent_orgs(uuid) AS ( "
						+ "SELECT uuid FROM organizations WHERE uuid = :orgUuid "
					+ "UNION ALL "
						+ "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
					+ ")";
				whereClauses.add("(reports.\"advisorOrganizationUuid\" IN (SELECT uuid from parent_orgs) "
						+ "OR reports.\"principalOrganizationUuid\" IN (SELECT uuid from parent_orgs))");
			} else { 
				whereClauses.add("(reports.\"advisorOrganizationUuid\" = :orgUuid OR reports.\"principalOrganizationUuid\" = :orgUuid)");
			}
			args.put("orgUuid", query.getOrgUuid());
		}
		
		if (query.getAdvisorOrgUuid() != null) {
			if (Organization.DUMMY_ORG_UUID.equals(query.getAdvisorOrgUuid())) {
				whereClauses.add("reports.\"advisorOrganizationUuid\" IS NULL");
			} else if (query.getIncludeAdvisorOrgChildren()) { 
				commonTableExpression = "WITH RECURSIVE parent_orgs(uuid) AS ( "
						+ "SELECT uuid FROM organizations WHERE uuid = :advisorOrgUuid "
					+ "UNION ALL "
						+ "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
					+ ") ";
				whereClauses.add("reports.\"advisorOrganizationUuid\" IN (SELECT uuid from parent_orgs)");
			} else { 
				whereClauses.add("reports.\"advisorOrganizationUuid\" = :advisorOrgUuid");
			}
			args.put("advisorOrgUuid", query.getAdvisorOrgUuid());
		}
		
		if (query.getPrincipalOrgUuid() != null) {
			if (Organization.DUMMY_ORG_UUID.equals(query.getPrincipalOrgUuid())) {
				whereClauses.add("reports.\"principalOrganizationUuid\" IS NULL");
			} else if (query.getIncludePrincipalOrgChildren()) { 
				commonTableExpression = "WITH RECURSIVE parent_orgs(uuid) AS ( "
						+ "SELECT uuid FROM organizations WHERE uuid = :principalOrgUuid "
					+ "UNION ALL "
						+ "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
					+ ")";
				whereClauses.add("reports.\"principalOrganizationUuid\" IN (SELECT uuid from parent_orgs)");
			} else { 
				whereClauses.add("reports.\"principalOrganizationUuid\" = :principalOrgUuid");
			}
			args.put("principalOrgUuid", query.getAdvisorOrgUuid());
		}
		
		if (query.getLocationUuid() != null) {
			if (Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid())) {
				whereClauses.add("reports.\"locationUuid\" IS NULL");
			} else {
				whereClauses.add("reports.\"locationUuid\" = :locationUuid");
				args.put("locationUuid", query.getLocationUuid());
			}
		}
		
		if (query.getPendingApprovalOf() != null) { 
			whereClauses.add("reports.\"authorUuid\" != :approverUuid");
			whereClauses.add("reports.\"approvalStepUuid\" IN "
				+ "(SELECT \"approvalStepUuid\" from approvers where \"positionUuid\" IN "
				+ "(SELECT uuid FROM positions where \"currentPersonUuid\" = :approverUuid))");
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
				whereClauses.add("reports.\"cancelledReason\" = :cancelledReason");
				args.put("cancelledReason", DaoUtils.getEnumId(query.getCancelledReason()));
			}
		}
		
		if (whereClauses.size() == 0) {
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
				whereClauses.add("((reports.state != :draftState AND reports.state != :rejectedState) OR (reports.\"authorUuid\" = :userUuid))");
				args.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
				args.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
				args.put("userUuid", user.getUuid());
				if (AuthUtils.isAdmin(user) == false) {
					//Admin users may access all approved reports, other users only owned approved reports
					whereClauses.add("((reports.state != :approvedState) OR (reports.\"authorUuid\" = :userUuid))");
					args.put("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
				}
			}
		}
		
		sql.append(" WHERE ");
		sql.append(Joiner.on(" AND ").join(whereClauses));
		
		//Sort Ordering
		sql.append(" ORDER BY ");
		if (query.getSortBy() == null) { query.setSortBy(ReportSearchSortBy.ENGAGEMENT_DATE); }
		switch (query.getSortBy()) {
			case ENGAGEMENT_DATE:
				sql.append("reports.\"engagementDate\"");
				break;
			case RELEASED_AT:
				sql.append("reports.\"releasedAt\"");
				break;
			case UPDATED_AT:
				sql.append("reports.\"updatedAt\"");
				break;
			case CREATED_AT:
			default:
				sql.append("reports.\"createdAt\"");
				break;
		}

		if (query.getSortOrder() == null) { query.setSortOrder(SortOrder.DESC); }
		switch (query.getSortOrder()) {
			case ASC:
				sql.append(" ASC ");
				break;
			case DESC:
			default:
				sql.append(" DESC ");
				break;
		}
		
		if (query.getPageSize() != 0) {
			sql.append(" LIMIT :limit OFFSET :offset");
			args.put("offset", query.getPageSize() * query.getPageNum());
			args.put("limit", query.getPageSize());
		}
		sql.append(")");
		
		if (commonTableExpression != null) { 
			sql.insert(0, commonTableExpression);
		}
		
		final Query sqlQuery = dbHandle.createQuery(sql.toString())
				.bindMap(args);
		for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
			sqlQuery.bindList(listArg.getKey(), listArg.getValue());
		}
		AnetBeanList<Report> reportList = AnetBeanList.getReportList(user, sqlQuery, query.getPageNum(), query.getPageSize(), new ReportMapper());
		reportList.setTotalCount(reportList.getList().size());
		return reportList;
	}
	
	
}
