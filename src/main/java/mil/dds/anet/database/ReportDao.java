package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.TransactionCallback;
import org.skife.jdbi.v2.TransactionStatus;
import org.skife.jdbi.v2.sqlobject.Bind;
import org.skife.jdbi.v2.sqlobject.BindBean;
import org.skife.jdbi.v2.sqlobject.SqlBatch;

import com.google.common.base.Joiner;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.database.mappers.ReportPersonMapper;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.search.sqlite.SqliteReportSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;

public class ReportDao implements IAnetDao<Report> {

	private static final String[] fields = { "id", "state", "createdAt", "updatedAt", "engagementDate",
			"locationId", "approvalStepId", "intent", "exsum", "atmosphere", "cancelledReason",
			"advisorOrganizationId", "principalOrganizationId", "releasedAt",
			"atmosphereDetails", "text", "keyOutcomes",
			"nextSteps", "authorId"};
	private static final String tableName = "reports";
	public static final String REPORT_FIELDS = DaoUtils.buildFieldAliases(tableName, fields);

	final Handle dbHandle;
	private final String weekFormat;
	private final IdBatcher<Report> idBatcher;
	private final ForeignKeyBatcher<ReportPerson> attendeesBatcher;
	private final ForeignKeyBatcher<Tag> tagsBatcher;
	private final ForeignKeyBatcher<Task> tasksBatcher;

	public ReportDao(Handle db) {
		this.dbHandle = db;
		this.weekFormat = getWeekFormat(DaoUtils.getDbType(db));
		final String idBatcherSql = "/* batch.getReportsByIds */ SELECT " + REPORT_FIELDS + ", " + PersonDao.PERSON_FIELDS
				+ "FROM reports, people "
				+ "WHERE reports.id IN ( %1$s ) "
				+ "AND reports.\"authorId\" = people.id";
		this.idBatcher = new IdBatcher<Report>(db, idBatcherSql, new ReportMapper());

		final String attendeesBatcherSql = "/* batch.getAttendeesForReport */ SELECT " + PersonDao.PERSON_FIELDS
				+ ", \"reportPeople\".\"reportId\" , \"reportPeople\".\"isPrimary\" FROM \"reportPeople\" "
				+ "LEFT JOIN people ON \"reportPeople\".\"personId\" = people.id "
				+ "WHERE \"reportPeople\".\"reportId\" IN ( %1$s )";
		this.attendeesBatcher = new ForeignKeyBatcher<ReportPerson>(db, attendeesBatcherSql, new ReportPersonMapper(), "reportId");

		final String tagsBatcherSql = "/* batch.getTagsForReport */ SELECT * FROM \"reportTags\" "
				+ "INNER JOIN tags ON \"reportTags\".\"tagId\" = tags.id "
				+ "WHERE \"reportTags\".\"reportId\" IN ( %1$s )"
				+ "ORDER BY tags.name";
		this.tagsBatcher = new ForeignKeyBatcher<Tag>(db, tagsBatcherSql, new TagMapper(), "reportId");

		final String tasksBatcherSql = "/* batch.getTasksForReport */ SELECT * FROM tasks, \"reportTasks\" "
				+ "WHERE \"reportTasks\".\"reportId\" IN ( %1$s ) "
				+ "AND \"reportTasks\".\"taskId\" = tasks.id";
		this.tasksBatcher = new ForeignKeyBatcher<Task>(db, tasksBatcherSql, new TaskMapper(), "reportId");
	}

	private String getWeekFormat(DaoUtils.DbType dbType) {
		switch (dbType) {
			case MSSQL:
				return "DATEPART(week, %s)";
			case SQLITE:
				return "strftime('%%W', substr(%s, 1, 10))";
			case POSTGRESQL:
				return "EXTRACT(WEEK FROM %s)";
			default:
				throw new RuntimeException("No week format found for " + dbType);
		}
	}

	@Override
	public AnetBeanList<Report> getAll(int pageNum, int pageSize) {
		// Return the reports without sensitive information
		return getAll(pageNum, pageSize, null);
	}

	public AnetBeanList<Report> getAll(int pageNum, int pageSize, Person user) {
		String sql = DaoUtils.buildPagedGetAllSql(DaoUtils.getDbType(dbHandle),
				"Reports", "reports join people on reports.\"authorId\" = people.id", REPORT_FIELDS + ", " + PersonDao.PERSON_FIELDS,
				"reports.\"createdAt\"");
		Query<Report> query = dbHandle.createQuery(sql)
			.bind("limit", pageSize)
			.bind("offset", pageSize * pageNum)
			.map(new ReportMapper());
		return AnetBeanList.getReportList(user, query, pageNum, pageSize);
	}

	@Override
	public Report insert(Report r) {
		// Create a report without sensitive information
		return insert(r, null);
	}

	public Report insert(Report r, Person user) {
		return dbHandle.inTransaction(new TransactionCallback<Report>() {
			@Override
			public Report inTransaction(Handle conn, TransactionStatus status) throws Exception {
				r.setCreatedAt(DateTime.now());
				r.setUpdatedAt(r.getCreatedAt());

				//MSSQL requires explicit CAST when a datetime2 might be NULL.
				StringBuilder sql = new StringBuilder("/* insertReport */ INSERT INTO reports "
						+ "(state, \"createdAt\", \"updatedAt\", \"locationId\", intent, exsum, "
						+ "text, \"keyOutcomes\", \"nextSteps\", \"authorId\", "
						+ "\"engagementDate\", \"releasedAt\", atmosphere, \"cancelledReason\", "
						+ "\"atmosphereDetails\", \"advisorOrganizationId\", "
						+ "\"principalOrganizationId\") VALUES "
						+ "(:state, :createdAt, :updatedAt, :locationId, :intent, "
						+ ":exsum, :reportText, :keyOutcomes, "
						+ ":nextSteps, :authorId, ");
				if (DaoUtils.isMsSql(dbHandle)) {
					sql.append("CAST(:engagementDate AS datetime2), CAST(:releasedAt AS datetime2), ");
				} else {
					sql.append(":engagementDate, :releasedAt, ");
				}
				sql.append(":atmosphere, :cancelledReason, :atmosphereDetails, :advisorOrgId, :principalOrgId)");

				GeneratedKeys<Map<String, Object>> keys = dbHandle.createStatement(sql.toString())
					.bindFromProperties(r)
					.bind("state", DaoUtils.getEnumId(r.getState()))
					.bind("atmosphere", DaoUtils.getEnumId(r.getAtmosphere()))
					.bind("cancelledReason", DaoUtils.getEnumId(r.getCancelledReason()))
					.bind("locationId", DaoUtils.getId(r.getLocation()))
					.bind("authorId", DaoUtils.getId(r.getAuthor()))
					.bind("advisorOrgId", DaoUtils.getId(r.getAdvisorOrg()))
					.bind("principalOrgId", DaoUtils.getId(r.getPrincipalOrg()))
					.executeAndReturnGeneratedKeys();
				r.setId(DaoUtils.getGeneratedId(keys));

				// Write sensitive information (if allowed)
				final ReportSensitiveInformation rsi = AnetObjectEngine.getInstance().getReportSensitiveInformationDao().insert(r.getReportSensitiveInformation(), user, r);
				r.setReportSensitiveInformation(rsi);

				final ReportBatch rb = dbHandle.attach(ReportBatch.class);
				if (r.getAttendees() != null) {
					//Setify based on attendeeId to prevent violations of unique key constraint. 
					Map<Integer,ReportPerson> attendeeMap = new HashMap<Integer,ReportPerson>();
					r.getAttendees().stream().forEach(rp -> { attendeeMap.put(rp.getId(), rp); });
					rb.insertReportAttendees(r.getId(), new ArrayList<ReportPerson>(attendeeMap.values()));
				}

				if (r.getAuthorizationGroups() != null) {
					rb.insertReportAuthorizationGroups(r.getId(), r.getAuthorizationGroups());
				}
				if (r.getTasks() != null) {
					rb.insertReportTasks(r.getId(), r.getTasks());
				}
				if (r.getTags() != null) {
					rb.insertReportTags(r.getId(), r.getTags());
				}
				return r;
			}
		});
	}

	public interface ReportBatch {
		@SqlBatch("INSERT INTO \"reportPeople\" (\"reportId\", \"personId\", \"isPrimary\") VALUES (:reportId, :id, :primary)")
		void insertReportAttendees(@Bind("reportId") Integer reportId,
				@BindBean List<ReportPerson> reportPeople);

		@SqlBatch("INSERT INTO \"reportAuthorizationGroups\" (\"reportId\", \"authorizationGroupId\") VALUES (:reportId, :id)")
		void insertReportAuthorizationGroups(@Bind("reportId") Integer reportId,
				@BindBean List<AuthorizationGroup> authorizationGroups);

		@SqlBatch("INSERT INTO \"reportTasks\" (\"reportId\", \"taskId\") VALUES (:reportId, :id)")
		void insertReportTasks(@Bind("reportId") Integer reportId,
				@BindBean List<Task> tasks);

		@SqlBatch("INSERT INTO \"reportTags\" (\"reportId\", \"tagId\") VALUES (:reportId, :id)")
		void insertReportTags(@Bind("reportId") Integer reportId,
				@BindBean List<Tag> tags);
	}

	@Override
	public Report getById(int id) {
		// Return the report without sensitive information
		return getById(id, null);
	}

	public Report getById(int id, Person user) {
		Query<Report> query = dbHandle.createQuery("/* getReportById */ SELECT " + REPORT_FIELDS + ", " + PersonDao.PERSON_FIELDS
				+ "FROM reports, people "
				+ "WHERE reports.id = :id "
				+ "AND reports.\"authorId\" = people.id")
				.bind("id", id)
				.map(new ReportMapper());
		List<Report> results = query.list();
		if (results.size() == 0) { return null; }
		Report r = results.get(0);
		r.setUser(user);
		return r;
	}

	/** This should always be wrapped in a transaction! But actually it's never used at all. */
	@Override
	public int update(Report r) {
		// Update the report without sensitive information
		return update(r, null);
	}

	/** NOTE: this should always be wrapped in a transaction! (If JDBI were able to handle nested calls to inTransaction, we would have
	 * one inside this method, but it isn't.)
	 * @param r the report to update, in its updated state
	 * @param user the user attempting the update, for authorization purposes
	 * @return the number of rows updated by the final update call (should be 1 in all cases).
	 */
	public int update(Report r, Person user) {
		// Write sensitive information (if allowed)
		AnetObjectEngine.getInstance().getReportSensitiveInformationDao().insertOrUpdate(r.getReportSensitiveInformation(), user, r);

		r.setUpdatedAt(DateTime.now());

		StringBuilder sql = new StringBuilder("/* updateReport */ UPDATE reports SET "
				+ "state = :state, \"updatedAt\" = :updatedAt, \"locationId\" = :locationId, "
				+ "intent = :intent, exsum = :exsum, text = :reportText, "
				+ "\"keyOutcomes\" = :keyOutcomes, \"nextSteps\" = :nextSteps, "
				+ "\"approvalStepId\" = :approvalStepId, ");
		if (DaoUtils.isMsSql(dbHandle)) {
			sql.append("\"engagementDate\" = CAST(:engagementDate AS datetime2), \"releasedAt\" = CAST(:releasedAt AS datetime2), ");
		} else {
			sql.append("\"engagementDate\" = :engagementDate, \"releasedAt\" = :releasedAt, ");
		}
		sql.append("atmosphere = :atmosphere, \"atmosphereDetails\" = :atmosphereDetails, "
				+ "\"cancelledReason\" = :cancelledReason, "
				+ "\"principalOrganizationId\" = :principalOrgId, \"advisorOrganizationId\" = :advisorOrgId "
				+ "WHERE id = :id");

		return dbHandle.createStatement(sql.toString())
			.bindFromProperties(r)
			.bind("state", DaoUtils.getEnumId(r.getState()))
			.bind("locationId", DaoUtils.getId(r.getLocation()))
			.bind("authorId", DaoUtils.getId(r.getAuthor()))
			.bind("approvalStepId", DaoUtils.getId(r.getApprovalStep()))
			.bind("atmosphere", DaoUtils.getEnumId(r.getAtmosphere()))
			.bind("cancelledReason", DaoUtils.getEnumId(r.getCancelledReason()))
			.bind("advisorOrgId", DaoUtils.getId(r.getAdvisorOrg()))
			.bind("principalOrgId", DaoUtils.getId(r.getPrincipalOrg()))
			.execute();
	}

	public void updateToDraftState(Report r) {
		dbHandle.execute("/* UpdateFutureEngagement */ UPDATE reports SET state = ? "
				+ "WHERE id = ?", DaoUtils.getEnumId(ReportState.DRAFT), r.getId());
	}

	public int addAttendeeToReport(ReportPerson rp, Report r) {
		return dbHandle.createStatement("/* addReportAttendee */ INSERT INTO \"reportPeople\" "
				+ "(\"personId\", \"reportId\", \"isPrimary\") VALUES (:personId, :reportId, :isPrimary)")
			.bind("personId", rp.getId())
			.bind("reportId", r.getId())
			.bind("isPrimary", rp.isPrimary())
			.execute();
	}

	public int removeAttendeeFromReport(Person p, Report r) {
		return dbHandle.createStatement("/* deleteReportAttendee */ DELETE FROM \"reportPeople\" "
				+ "WHERE \"reportId\" = :reportId AND \"personId\" = :personId")
			.bind("reportId", r.getId())
			.bind("personId", p.getId())
			.execute();
	}

	public int updateAttendeeOnReport(ReportPerson rp, Report r) {
		return dbHandle.createStatement("/* updateAttendeeOnReport*/ UPDATE \"reportPeople\" "
				+ "SET \"isPrimary\" = :isPrimary WHERE \"reportId\" = :reportId AND \"personId\" = :personId")
			.bind("reportId", r.getId())
			.bind("personId", rp.getId())
			.bind("isPrimary", rp.isPrimary())
			.execute();
	}


	public int addAuthorizationGroupToReport(AuthorizationGroup a, Report r) {
		return dbHandle.createStatement("/* addAuthorizationGroupToReport */ INSERT INTO \"reportAuthorizationGroups\" (\"authorizationGroupId\", \"reportId\") "
				+ "VALUES (:authorizationGroupId, :reportId)")
			.bind("reportId", r.getId())
			.bind("authorizationGroupId", a.getId())
			.execute();
	}

	public int removeAuthorizationGroupFromReport(AuthorizationGroup a, Report r) {
		return dbHandle.createStatement("/* removeAuthorizationGroupFromReport*/ DELETE FROM \"reportAuthorizationGroups\" "
				+ "WHERE \"reportId\" = :reportId AND \"authorizationGroupId\" = :authorizationGroupId")
				.bind("reportId", r.getId())
				.bind("authorizationGroupId", a.getId())
				.execute();
	}

	public int addTaskToReport(Task p, Report r) {
		return dbHandle.createStatement("/* addTaskToReport */ INSERT INTO \"reportTasks\" (\"taskId\", \"reportId\") "
				+ "VALUES (:taskId, :reportId)")
			.bind("reportId", r.getId())
			.bind("taskId", p.getId())
			.execute();
	}

	public int removeTaskFromReport(Task p, Report r) {
		return dbHandle.createStatement("/* removeTaskFromReport*/ DELETE FROM \"reportTasks\" "
				+ "WHERE \"reportId\" = :reportId AND \"taskId\" = :taskId")
				.bind("reportId", r.getId())
				.bind("taskId", p.getId())
				.execute();
	}

	public int addTagToReport(Tag t, Report r) {
		return dbHandle.createStatement("/* addTagToReport */ INSERT INTO \"reportTags\" (\"reportId\", \"tagId\") "
				+ "VALUES (:reportId, :tagId)")
			.bind("reportId", r.getId())
			.bind("tagId", t.getId())
			.execute();
	}

	public int removeTagFromReport(Tag t, Report r) {
		return dbHandle.createStatement("/* removeTagFromReport */ DELETE FROM \"reportTags\" "
				+ "WHERE \"reportId\" = :reportId AND \"tagId\" = :tagId")
				.bind("reportId", r.getId())
				.bind("tagId", t.getId())
				.execute();
	}

	public CompletableFuture<List<ReportPerson>> getAttendeesForReport(@GraphQLRootContext Map<String, Object> context, Integer reportId) {
		return new ForeignKeyFetcher<ReportPerson>()
				.load(context, "report.attendees", reportId);
	}

	public List<AuthorizationGroup> getAuthorizationGroupsForReport(int reportId) {
		return dbHandle.createQuery("/* getAuthorizationGroupsForReport */ SELECT * FROM \"authorizationGroups\", \"reportAuthorizationGroups\" "
				+ "WHERE \"reportAuthorizationGroups\".\"reportId\" = :reportId "
				+ "AND \"reportAuthorizationGroups\".\"authorizationGroupId\" = \"authorizationGroups\".id")
				.bind("reportId", reportId)
				.map(new AuthorizationGroupMapper())
				.list();
	}

	public CompletableFuture<List<Task>> getTasksForReport(@GraphQLRootContext Map<String, Object> context, Integer reportId) {
		return new ForeignKeyFetcher<Task>()
				.load(context, "report.tasks", reportId);
	}

	public CompletableFuture<List<Tag>> getTagsForReport(@GraphQLRootContext Map<String, Object> context, Integer reportId) {
		return new ForeignKeyFetcher<Tag>()
				.load(context, "report.tags", reportId);
	}

	//Does an unauthenticated search. This will never return any DRAFT or REJECTED reports
	public AnetBeanList<Report> search(ReportSearchQuery query) {
		return search(query, null);
	}
	
	public AnetBeanList<Report> search(ReportSearchQuery query, Person user) {
		return AnetObjectEngine.getInstance().getSearcher().getReportSearcher()
			.runSearch(query, dbHandle, user);
	}

	/*
	 * Deletes a given report from the database. 
	 * Ensures consistency by removing all references to a report before deleting a report. 
	 */
	public int deleteReport(final Report report) {
		return dbHandle.inTransaction(new TransactionCallback<Integer>() {
			public Integer inTransaction(Handle conn, TransactionStatus status) throws Exception {
				// Delete tags
				dbHandle.execute("/* deleteReport.tags */ DELETE FROM \"reportTags\" where \"reportId\" = ?", report.getId());

				//Delete tasks
				dbHandle.execute("/* deleteReport.tasks */ DELETE FROM \"reportTasks\" where \"reportId\" = ?", report.getId());
				
				//Delete attendees
				dbHandle.execute("/* deleteReport.attendees */ DELETE FROM \"reportPeople\" where \"reportId\" = ?", report.getId());
				
				//Delete comments
				dbHandle.execute("/* deleteReport.comments */ DELETE FROM comments where \"reportId\" = ?", report.getId());
				
				//Delete \"approvalActions\"
				dbHandle.execute("/* deleteReport.actions */ DELETE FROM \"approvalActions\" where \"reportId\" = ?", report.getId());

				//Delete relation to authorization groups
				dbHandle.execute("/* deleteReport.\"authorizationGroups\" */ DELETE FROM \"reportAuthorizationGroups\" where \"reportId\" = ?", report.getId());

				//Delete report
				// GraphQL mutations *have* to return something, so we return the number of deleted report rows
				return dbHandle.createStatement("/* deleteReport.report */ DELETE FROM reports where id = :reportId")
					.bind("reportId", report.getId())
					.execute();
			}
		});
		
	}

	private DateTime getRollupEngagmentStart(DateTime start) { 
		String maxReportAgeStr = AnetObjectEngine.getInstance().getAdminSetting(AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS);
		if (maxReportAgeStr == null) { 
			throw new WebApplicationException("Missing Admin Setting for " + AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS); 
		} 
		Integer maxReportAge = Integer.parseInt(maxReportAgeStr);
		return start.minusDays(maxReportAge);
	}
	
	/* Generates the Rollup Graph for a particular Organization Type, starting at the root of the org hierarchy */
	public List<RollupGraph> getDailyRollupGraph(DateTime start, DateTime end, OrganizationType orgType, Map<Integer, Organization> nonReportingOrgs) {
		List<Map<String, Object>> results = rollupQuery(start, end, orgType, null, false);
		Map<Integer,Organization> orgMap = AnetObjectEngine.getInstance().buildTopLevelOrgHash(orgType);
		
		return generateRollupGraphFromResults(results, orgMap, nonReportingOrgs);
	}
	
	/* Generates a Rollup graph for a particular organization.  Starting with a given parent Organization */
	public List<RollupGraph> getDailyRollupGraph(DateTime start, DateTime end, Integer parentOrgId, OrganizationType orgType, Map<Integer, Organization> nonReportingOrgs) {
		List<Organization> orgList = null;
		Map<Integer,Organization> orgMap;
		if (parentOrgId.equals(-1) == false) { // -1 is code for no parent org.  
			//doing this as two separate queries because I do need all the information about the organizations
			OrganizationSearchQuery query = new OrganizationSearchQuery();
			query.setParentOrgId(parentOrgId);
			query.setParentOrgRecursively(true);
			query.setPageSize(Integer.MAX_VALUE);
			orgList = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
			Optional<Organization> parentOrg = orgList.stream().filter(o -> o.getId().equals(parentOrgId)).findFirst();
			if (parentOrg.isPresent() == false) { 
				throw new WebApplicationException("No such organization with id " + parentOrgId, Status.NOT_FOUND);
			}
			orgMap  = Utils.buildParentOrgMapping(orgList, parentOrgId);
		} else { 
			orgMap = new HashMap<Integer, Organization>(); //guaranteed to match no orgs! 
		}
		
		List<Map<String,Object>> results = rollupQuery(start, end, orgType, orgList, parentOrgId.equals(-1));
		
		return generateRollupGraphFromResults(results, orgMap, nonReportingOrgs);
	}

	/* Generates Advisor Report Insights for Organizations */
	public List<Map<String,Object>> getAdvisorReportInsights(DateTime start, DateTime end, int orgId) {
		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		StringBuilder sql = new StringBuilder();

		sql.append("/* AdvisorReportInsightsQuery */ ");
		sql.append("SELECT ");
		sql.append("CASE WHEN a.\"organizationId\" IS NULL THEN b.\"organizationId\" ELSE a.\"organizationId\" END AS \"organizationId\",");
		sql.append("CASE WHEN a.\"organizationShortName\" IS NULL THEN b.\"organizationShortName\" ELSE a.\"organizationShortName\" END AS \"organizationShortName\",");
		sql.append("%1$s");
		sql.append("%2$s");
		sql.append("CASE WHEN a.week IS NULL THEN b.week ELSE a.week END AS week,");
		sql.append("CASE WHEN a.\"nrReportsSubmitted\" IS NULL THEN 0 ELSE a.\"nrReportsSubmitted\" END AS \"nrReportsSubmitted\",");
		sql.append("CASE WHEN b.\"nrEngagementsAttended\" IS NULL THEN 0 ELSE b.\"nrEngagementsAttended\" END AS \"nrEngagementsAttended\"");

		sql.append(" FROM (");

			sql.append("SELECT ");
			sql.append("organizations.id AS \"organizationId\",");
			sql.append("organizations.\"shortName\" AS \"organizationShortName\",");
			sql.append("%3$s");
			sql.append("%4$s");
			sql.append(" " + String.format(weekFormat, "reports.\"createdAt\"") + " AS week,");
			sql.append("COUNT(reports.\"authorId\") AS \"nrReportsSubmitted\"");

			sql.append(" FROM ");
			sql.append("positions,");
			sql.append("reports,");
			sql.append("%5$s");
			sql.append("organizations");

			sql.append(" WHERE positions.\"currentPersonId\" = reports.\"authorId\"");
			sql.append(" %6$s");
			sql.append(" AND reports.\"advisorOrganizationId\" = organizations.id");
			sql.append(" AND positions.type = :positionAdvisor");
			sql.append(" AND reports.state IN ( :reportReleased, :reportPending, :reportDraft )");
			sql.append(" AND reports.\"createdAt\" BETWEEN :startDate and :endDate");
			sql.append(" %11$s");

			sql.append(" GROUP BY ");
			sql.append("organizations.id,");
			sql.append("organizations.\"shortName\",");
			sql.append("%7$s");
			sql.append("%8$s");
			sql.append(" " + String.format(weekFormat, "reports.\"createdAt\""));
		sql.append(") a");

		sql.append(" FULL OUTER JOIN (");
			sql.append("SELECT ");
			sql.append("organizations.id AS \"organizationId\",");
			sql.append("organizations.\"shortName\" AS \"organizationShortName\",");
			sql.append("%3$s");
			sql.append("%4$s");
			sql.append(" " + String.format(weekFormat, "reports.\"engagementDate\"") + " AS week,");
			sql.append("COUNT(\"reportPeople\".\"personId\") AS \"nrEngagementsAttended\"");

			sql.append(" FROM ");
			sql.append("positions,");
			sql.append("%5$s");
			sql.append("reports,");
			sql.append("\"reportPeople\",");
			sql.append("organizations");

			sql.append(" WHERE positions.\"currentPersonId\" = \"reportPeople\".\"personId\"");
			sql.append(" %6$s");
			sql.append(" AND \"reportPeople\".\"reportId\" = reports.id");
			sql.append(" AND reports.\"advisorOrganizationId\" = organizations.id");
			sql.append(" AND positions.type = :positionAdvisor");
			sql.append(" AND reports.state IN ( :reportReleased, :reportPending, :reportDraft )");
			sql.append(" AND reports.\"engagementDate\" BETWEEN :startDate and :endDate");
			sql.append(" %11$s");

			sql.append(" GROUP BY ");
			sql.append("organizations.id,");
			sql.append("organizations.\"shortName\",");
			sql.append("%7$s");
			sql.append("%8$s");
			sql.append(" " + String.format(weekFormat, "reports.\"engagementDate\""));
		sql.append(") b");

		sql.append(" ON ");
		sql.append(" a.\"organizationId\" = b.\"organizationId\"");
		sql.append(" %9$s");
		sql.append(" AND a.week = b.week");

		sql.append(" ORDER BY ");
		sql.append("\"organizationShortName\",");
		sql.append("%10$s");
		sql.append("week;");

		final Object[] fmtArgs;
		if (orgId > -1) {
			String selectOrg = " AND organizations.id = " + orgId;
			fmtArgs = new String[] {
					"CASE WHEN a.\"personId\" IS NULL THEN b.\"personId\" ELSE a.\"personId\" END AS \"personId\",",
					"CASE WHEN a.name IS NULL THEN b.name ELSE a.name END AS name,",
					"people.id AS \"personId\",",
					"people.name AS name,",
					"people,",
					"AND positions.\"currentPersonId\" = people.id",
					"people.id,",
					"people.name,",
					"AND a.\"personId\" = b.\"personId\"",
					"name,",
					selectOrg};
		} else {
			fmtArgs = new String[] {
					"",
					"",
					"",
					"",
					"",
					"",
					"",
					"",
					"",
					"",
					""};
		}

		sqlArgs.put("startDate", start);
		sqlArgs.put("endDate", end);
		sqlArgs.put("positionAdvisor", Position.PositionType.ADVISOR.ordinal());
		sqlArgs.put("reportDraft", ReportState.DRAFT.ordinal());
		sqlArgs.put("reportPending", ReportState.PENDING_APPROVAL.ordinal());
		sqlArgs.put("reportReleased", ReportState.RELEASED.ordinal());

		return dbHandle.createQuery(String.format(sql.toString(), fmtArgs))
			.bindFromMap(sqlArgs)
			.list();
	}

	/** Helper method that builds and executes the daily rollup query
	 * Handles both MsSql and Sqlite
	 * Searching for just all reports and for reports in certain organizations.
	 * @param orgType: the type of organization Id to be lookinf ro 
	 * @param orgs: the list of orgs for whose reports to find, null means all
	 * @param missingOrgReports: true if we want to look for reports specifically with NULL org Ids. 
	 */
	private List<Map<String,Object>> rollupQuery(DateTime start, 
			DateTime end, 
			OrganizationType orgType, 
			List<Organization> orgs, 
			boolean missingOrgReports) { 
		String orgColumn = String.format("\"%s\"", orgType == OrganizationType.ADVISOR_ORG ? "advisorOrganizationId" : "principalOrganizationId");
		Map<String,Object> sqlArgs = new HashMap<String,Object>();
		
		StringBuilder sql = new StringBuilder();
		sql.append("/* RollupQuery */ SELECT " + orgColumn + " as orgId, state, count(*) AS count ");
		sql.append("FROM reports WHERE ");

		// NOTE: more date-comparison work here that might be worth abstracting, but might not
		if (DaoUtils.getDbType(dbHandle) != DaoUtils.DbType.SQLITE) {
			sql.append("\"releasedAt\" >= :startDate and \"releasedAt\" < :endDate "
					+ "AND \"engagementDate\" > :engagementDateStart ");
			sqlArgs.put("startDate", start);
			sqlArgs.put("endDate", end.plusMillis(1));
			sqlArgs.put("engagementDateStart", getRollupEngagmentStart(start));
		} else { 
			sql.append("\"releasedAt\"  >= DateTime(:startDate) AND \"releasedAt\" <= DateTime(:endDate) "
					+ "AND \"engagementDate\" > DateTime(:engagementDateStart) ");
			sqlArgs.put("startDate", SqliteReportSearcher.sqlitePattern.print(start));
			sqlArgs.put("endDate", SqliteReportSearcher.sqlitePattern.print(end));
			sqlArgs.put("engagementDateStart", SqliteReportSearcher.sqlitePattern.print(getRollupEngagmentStart(start)));
		}
		
		if (orgs != null) { 
			List<String> sqlBind = new LinkedList<String>();
			int orgNum = 0; 
			for (Organization o : orgs) { 
				sqlArgs.put("orgId" + orgNum, o.getId());
				sqlBind.add(":orgId" + orgNum);
				orgNum++;
			}
			String orgInSql = Joiner.on(',').join(sqlBind);
			sql.append("AND " + orgColumn + " IN (" + orgInSql + ") ");
		} else if (missingOrgReports) { 
			sql.append(" AND " + orgColumn + " IS NULL ");
		}
		
		sql.append("GROUP BY " + orgColumn + ", state");
		

		return dbHandle.createQuery(sql.toString())
			.bindFromMap(sqlArgs)
			.list();
	}
	
	/* Given the results from the database on the number of reports grouped by organization
	 * And the map of each organization to the organization that their reports roll up to
	 * this method returns the final rollup graph information. 
	 */
	private List<RollupGraph> generateRollupGraphFromResults(List<Map<String,Object>> dbResults, Map<Integer, Organization> orgMap, Map<Integer, Organization> nonReportingOrgs) {
		Map<Integer,Map<ReportState,Integer>> rollup = new HashMap<Integer,Map<ReportState,Integer>>();
		
		for (Map<String,Object> result : dbResults) { 
			Integer orgId = (Integer) result.get("orgId");
			if (nonReportingOrgs.containsKey(orgId)) {
				// Skip non-reporting organizations
				continue;
			}
			Integer count = ((Number) result.get("count")).intValue();
			ReportState state = ReportState.values()[(Integer) result.get("state")];
		
			Integer parentOrgId = DaoUtils.getId(orgMap.get(orgId));
			Map<ReportState,Integer> orgBar = rollup.get(parentOrgId);
			if (orgBar == null) { 
				orgBar = new HashMap<ReportState,Integer>();
				rollup.put(parentOrgId, orgBar);
			}
			orgBar.put(state,  Utils.orIfNull(orgBar.get(state), 0) + count);
		}

		// Add all (top-level) organizations without any reports
		for (final Map.Entry<Integer, Organization> entry : orgMap.entrySet()) {
			final Integer orgId = entry.getKey();
			if (nonReportingOrgs.containsKey(orgId)) {
				// Skip non-reporting organizations
				continue;
			}
			final Integer parentOrgId = DaoUtils.getId(orgMap.get(orgId));
			if (!rollup.keySet().contains(parentOrgId)) {
				final Map<ReportState, Integer> orgBar = new HashMap<ReportState, Integer>();
				orgBar.put(ReportState.RELEASED, 0);
				orgBar.put(ReportState.CANCELLED, 0);
				rollup.put(parentOrgId, orgBar);
			}
		}

		List<RollupGraph> result = new LinkedList<RollupGraph>();
		for (Map.Entry<Integer, Map<ReportState,Integer>> entry : rollup.entrySet()) { 
			Map<ReportState,Integer> values = entry.getValue();
			RollupGraph bar = new RollupGraph();
			bar.setOrg(orgMap.get(entry.getKey()));
			bar.setReleased(Utils.orIfNull(values.get(ReportState.RELEASED), 0));
			bar.setCancelled(Utils.orIfNull(values.get(ReportState.CANCELLED), 0));
			result.add(bar);
		}
		
		return result;
	}

	@Override
	public List<Report> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	public List<List<ReportPerson>> getAttendees(List<Integer> foreignKeys) {
		return attendeesBatcher.getByForeignKeys(foreignKeys);
	}

	public List<List<Tag>> getTags(List<Integer> foreignKeys) {
		return tagsBatcher.getByForeignKeys(foreignKeys);
	}

	public List<List<Task>> getTasks(List<Integer> foreignKeys) {
		return tasksBatcher.getByForeignKeys(foreignKeys);
	}
}
