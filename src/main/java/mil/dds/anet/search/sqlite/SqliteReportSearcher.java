package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import jersey.repackaged.com.google.common.base.Joiner;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery.ReportSearchSortBy;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.search.ReportSearchBuilder;
import mil.dds.anet.search.ReportSearchBuilder.Comparison;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqliteReportSearcher implements IReportSearcher {

	public static final DateTimeFormatter sqlitePattern = DateTimeFormat.forPattern("yyyy-MM-dd HH:mm:ss.SSS Z");

	private String isoDowFormat;
	private String isoDowComparison;
	private DateTimeFormatter dateTimeFormatter;


	public SqliteReportSearcher(String isoDowFormat, DateTimeFormatter dateTimeFormatter) {
		this.isoDowFormat = isoDowFormat;
		this.dateTimeFormatter = dateTimeFormatter;
		this.isoDowComparison = "(" + this.isoDowFormat + ") = :%s";
	}

	public SqliteReportSearcher() {
		this(
			"strftime('%%w', substr(reports.\"%s\", 1, 10)) + 1", 	// %w day of week 0-6 with Sunday==0
			sqlitePattern);
	}

	public AnetBeanList<Report> runSearch(ReportSearchQuery query, Handle dbHandle, Person user) {
		StringBuffer sql = new StringBuffer();
		sql.append("/* SqliteReportSearch */ SELECT DISTINCT " + ReportDao.REPORT_FIELDS + "," + PersonDao.PERSON_FIELDS);
		if (query.getIncludeEngagementDayOfWeek()) {
			sql.append(", ");
			sql.append(String.format(this.isoDowFormat, "engagementDate"));
			sql.append(" as \"engagementDayOfWeek\" ");
		}
		sql.append(" FROM reports ");
		sql.append(", people ");
		sql.append("WHERE reports.\"authorId\" = people.id ");
		sql.append("AND reports.id IN ( SELECT reports.id FROM reports ");
		sql.append("LEFT JOIN \"reportTags\" ON \"reportTags\".\"reportId\" = reports.id ");
		sql.append("LEFT JOIN tags ON \"reportTags\".\"tagId\" = tags.id ");
		
		String commonTableExpression = null;
		Map<String,Object> args = new HashMap<String,Object>();
		List<String> whereClauses = new LinkedList<String>();
		ReportSearchBuilder searchBuilder = new ReportSearchBuilder(args, whereClauses, this.dateTimeFormatter);
		if (query.getAuthorId() != null) { 
			whereClauses.add("reports.\"authorId\" = :authorId");
			args.put("authorId", query.getAuthorId());
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

		if (query.getAttendeeId() != null) {
			whereClauses.add("reports.id IN (SELECT \"reportId\" from \"reportPeople\" where \"personId\" = :attendeeId)");
			args.put("attendeeId", query.getAttendeeId());
		}

		if (query.getAuthorPositionId() != null) {
			// Search for reports authored by people serving in that position at the report's creation date
			whereClauses.add("reports.id IN ( SELECT r.id FROM reports r "
				+ PositionDao.generateCurrentPositionFilter("r.\"authorId\"", "r.\"createdAt\"", "authorPositionId")
				+ ")"
			);
			args.put("authorPositionId", query.getAuthorPositionId());
		}

		if (query.getAttendeePositionId() != null) {
			// Search for reports attended by people serving in that position at the engagement date
			whereClauses.add("reports.id IN ( SELECT r.id FROM reports r "
				+ "JOIN \"reportPeople\" rp ON rp.\"reportId\" = r.id "
				+ PositionDao.generateCurrentPositionFilter("rp.\"personId\"", "r.\"engagementDate\"", "attendeePositionId")
				+ ")"
			);
			args.put("attendeePositionId", query.getAttendeePositionId());
		}

		if (query.getAtmosphere() != null) { 
			whereClauses.add("reports.atmosphere = :atmosphere");
			args.put("atmosphere", DaoUtils.getEnumId(query.getAtmosphere()));
		}
		
		if (query.getTaskId() != null) { 
			whereClauses.add("reports.id IN (SELECT \"reportId\" from \"reportTasks\" where \"taskId\" = :taskId)");
			args.put("taskId", query.getTaskId());
		}
		
		if (query.getOrgId() != null) { 
			if (query.getAdvisorOrgId() != null || query.getPrincipalOrgId() != null) { 
				throw new WebApplicationException("Cannot combine orgId with principalOrgId or advisorOrgId parameters", Status.BAD_REQUEST);
			}
			if (query.getIncludeOrgChildren()) { 
				commonTableExpression = "WITH RECURSIVE parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :orgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.\"parentOrgId\" = po.id "
					+ ")";
				whereClauses.add("(reports.\"advisorOrganizationId\" IN (SELECT id from parent_orgs) "
						+ "OR reports.\"principalOrganizationId\" IN (SELECT id from parent_orgs))");
			} else { 
				whereClauses.add("(reports.\"advisorOrganizationId\" = :orgId OR reports.\"principalOrganizationId\" = :orgId)");
			}
			args.put("orgId", query.getOrgId());
		}
		
		if (query.getAdvisorOrgId() != null) { 
			if (query.getAdvisorOrgId() == -1) { 
				whereClauses.add("reports.\"advisorOrganizationId\" IS NULL");
			} else if (query.getIncludeAdvisorOrgChildren()) { 
				commonTableExpression = "WITH RECURSIVE parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :advisorOrgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.\"parentOrgId\" = po.id "
					+ ") ";
				whereClauses.add("reports.\"advisorOrganizationId\" IN (SELECT id from parent_orgs)");
			} else { 
				whereClauses.add("reports.\"advisorOrganizationId\" = :advisorOrgId");
			}
			args.put("advisorOrgId", query.getAdvisorOrgId());
		}
		
		if (query.getPrincipalOrgId() != null) { 
			if (query.getPrincipalOrgId() == -1) { 
				whereClauses.add("reports.\"principalOrganizationId\" IS NULL");
			} else if (query.getIncludePrincipalOrgChildren()) { 
				commonTableExpression = "WITH RECURSIVE parent_orgs(id) AS ( "
						+ "SELECT id FROM organizations WHERE id = :principalOrgId "
					+ "UNION ALL "
						+ "SELECT o.id from parent_orgs po, organizations o WHERE o.\"parentOrgId\" = po.id "
					+ ")";
				whereClauses.add("reports.\"principalOrganizationId\" IN (SELECT id from parent_orgs)");
			} else { 
				whereClauses.add("reports.\"principalOrganizationId\" = :principalOrgId");
			}
			args.put("principalOrgId", query.getAdvisorOrgId());
		}
		
		if (query.getLocationId() != null) { 
			whereClauses.add("reports.\"locationId\" = :locationId");
			args.put("locationId", query.getLocationId());
		}
		
		if (query.getPendingApprovalOf() != null) { 
			whereClauses.add("reports.\"authorId\" != :approverId");
			whereClauses.add("reports.\"approvalStepId\" IN "
				+ "(SELECT \"approvalStepId\" from approvers where \"positionId\" IN "
				+ "(SELECT id FROM positions where \"currentPersonId\" = :approverId))");
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
			whereClauses.add("reports.\"cancelledReason\" = :cancelledReason");
			args.put("cancelledReason", DaoUtils.getEnumId(query.getCancelledReason()));
		}
		
		if (whereClauses.size() == 0) {
			return new AnetBeanList<Report>(query.getPageNum(), query.getPageSize(), new ArrayList<Report>());
		}
		
		//Apply a filter to restrict access to other's draft reports
		if (user == null) { 
			whereClauses.add("reports.state != :draftState");
			whereClauses.add("reports.state != :rejectedState");
			args.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
			args.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
		} else { 
			whereClauses.add("((reports.state != :draftState AND reports.state != :rejectedState) OR (reports.\"authorId\" = :userId))");
			args.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
			args.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
			args.put("userId", user.getId());
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
		
		Query<Report> dbQuery = dbHandle.createQuery(sql.toString())
				.bindFromMap(args)
				.map(new ReportMapper());
		AnetBeanList<Report> reportList = AnetBeanList.getReportList(user, dbQuery, query.getPageNum(), query.getPageSize());
		reportList.setTotalCount(reportList.getList().size());
		return reportList;
	}
	
	
}
