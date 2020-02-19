package mil.dds.anet.database;

import com.google.common.collect.ObjectArrays;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportAction.ActionType;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.database.mappers.ReportPersonMapper;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.emails.ApprovalNeededEmail;
import mil.dds.anet.emails.ReportPublishedEmail;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class ReportDao extends AnetSubscribableObjectDao<Report, ReportSearchQuery> {

  // Must always retrieve these e.g. for ORDER BY
  public static final String[] minimalFields =
      {"uuid", "createdAt", "updatedAt", "engagementDate", "releasedAt"};
  public static final String[] additionalFields = {"state", "duration", "intent", "exsum",
      "locationUuid", "approvalStepUuid", "advisorOrganizationUuid", "principalOrganizationUuid",
      "authorUuid", "atmosphere", "cancelledReason", "atmosphereDetails", "text", "keyOutcomes",
      "nextSteps", "customFields"};
  public static final String[] allFields =
      ObjectArrays.concat(minimalFields, additionalFields, String.class);
  public static final String TABLE_NAME = "reports";
  public static final String REPORT_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, allFields, true);

  private String weekFormat;

  public String getWeekFormat() {
    if (weekFormat == null) {
      weekFormat = getWeekFormat(getDbType());
    }
    return weekFormat;
  }

  private String getWeekFormat(DaoUtils.DbType dbType) {
    switch (dbType) {
      case MSSQL:
        return "DATEPART(week, %s)";
      case POSTGRESQL:
        return "EXTRACT(WEEK FROM %s)";
      default:
        throw new RuntimeException("No week format found for " + dbType);
    }
  }

  @InTransaction
  public Report insert(Report r, Person user) {
    DaoUtils.setInsertFields(r);
    return insertInternal(r, user);
  }

  @Override
  public Report insertInternal(Report r) {
    // Create a report without sensitive information
    return insertInternal(r, null);
  }

  public Report insertInternal(Report r, Person user) {
    // MSSQL requires explicit CAST when a datetime2 might be NULL.
    StringBuilder sql = new StringBuilder("/* insertReport */ INSERT INTO reports "
        + "(uuid, state, \"createdAt\", \"updatedAt\", \"locationUuid\", intent, exsum, "
        + "text, \"keyOutcomes\", \"nextSteps\", \"authorUuid\", "
        + "\"engagementDate\", \"releasedAt\", duration, atmosphere, \"cancelledReason\", "
        + "\"atmosphereDetails\", \"advisorOrganizationUuid\", "
        + "\"principalOrganizationUuid\", \"customFields\") VALUES "
        + "(:uuid, :state, :createdAt, :updatedAt, :locationUuid, :intent, "
        + ":exsum, :reportText, :keyOutcomes, :nextSteps, :authorUuid, ");
    if (DaoUtils.isMsSql()) {
      sql.append("CAST(:engagementDate AS datetime2), CAST(:releasedAt AS datetime2), ");
    } else {
      sql.append(":engagementDate, :releasedAt, ");
    }
    sql.append(
        ":duration, :atmosphere, :cancelledReason, :atmosphereDetails, :advisorOrgUuid, :principalOrgUuid, :customFields)");

    getDbHandle().createUpdate(sql.toString()).bindBean(r)
        .bind("createdAt", DaoUtils.asLocalDateTime(r.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(r.getUpdatedAt()))
        .bind("engagementDate", DaoUtils.asLocalDateTime(r.getEngagementDate()))
        .bind("releasedAt", DaoUtils.asLocalDateTime(r.getReleasedAt()))
        .bind("state", DaoUtils.getEnumId(r.getState()))
        .bind("atmosphere", DaoUtils.getEnumId(r.getAtmosphere()))
        .bind("cancelledReason", DaoUtils.getEnumId(r.getCancelledReason())).execute();

    // Write sensitive information (if allowed)
    ReportSensitiveInformation rsi = r.getReportSensitiveInformation();
    if (rsi != null) {
      rsi.setText(Utils.sanitizeHtml(rsi.getText()));
    }
    rsi = AnetObjectEngine.getInstance().getReportSensitiveInformationDao().insert(rsi, user, r);
    r.setReportSensitiveInformation(rsi);

    final ReportBatch rb = getDbHandle().attach(ReportBatch.class);
    if (r.getAttendees() != null) {
      // Setify based on attendeeUuid to prevent violations of unique key constraint.
      Map<String, ReportPerson> attendeeMap = new HashMap<>();
      r.getAttendees().stream().forEach(rp -> attendeeMap.put(rp.getUuid(), rp));
      rb.insertReportAttendees(r.getUuid(), new ArrayList<ReportPerson>(attendeeMap.values()));
    }

    if (r.getAuthorizationGroups() != null) {
      rb.insertReportAuthorizationGroups(r.getUuid(), r.getAuthorizationGroups());
    }
    if (r.getTasks() != null) {
      rb.insertReportTasks(r.getUuid(), r.getTasks());
    }
    if (r.getTags() != null) {
      rb.insertReportTags(r.getUuid(), r.getTags());
    }
    return r;
  }

  public interface ReportBatch {
    @SqlBatch("INSERT INTO \"reportPeople\" (\"reportUuid\", \"personUuid\", \"isPrimary\") VALUES (:reportUuid, :uuid, :primary)")
    void insertReportAttendees(@Bind("reportUuid") String reportUuid,
        @BindBean List<ReportPerson> reportPeople);

    @SqlBatch("INSERT INTO \"reportAuthorizationGroups\" (\"reportUuid\", \"authorizationGroupUuid\") VALUES (:reportUuid, :uuid)")
    void insertReportAuthorizationGroups(@Bind("reportUuid") String reportUuid,
        @BindBean List<AuthorizationGroup> authorizationGroups);

    @SqlBatch("INSERT INTO \"reportTasks\" (\"reportUuid\", \"taskUuid\") VALUES (:reportUuid, :uuid)")
    void insertReportTasks(@Bind("reportUuid") String reportUuid, @BindBean List<Task> tasks);

    @SqlBatch("INSERT INTO \"reportTags\" (\"reportUuid\", \"tagUuid\") VALUES (:reportUuid, :uuid)")
    void insertReportTags(@Bind("reportUuid") String reportUuid, @BindBean List<Tag> tags);
  }

  @InTransaction
  @Override
  public Report getByUuid(String uuid) {
    /* Check whether uuid is purely numerical, and if so, query on legacyId */
    final String queryDescriptor;
    final String keyField;
    final Object key;
    final Integer legacyId = Utils.getInteger(uuid);
    if (legacyId != null) {
      queryDescriptor = "getReportByLegacyId";
      keyField = "legacyId";
      key = legacyId;
    } else {
      queryDescriptor = "getReportByUuid";
      keyField = "uuid";
      key = uuid;
    }
    return getDbHandle()
        .createQuery("/* " + queryDescriptor + " */ SELECT " + REPORT_FIELDS + "FROM reports "
            + "WHERE reports.\"" + keyField + "\" = :key")
        .bind("key", key).map(new ReportMapper()).findFirst().orElse(null);
  }

  @InTransaction
  public int update(Report r, Person user) {
    DaoUtils.setUpdateFields(r);
    return updateWithSubscriptions(r, user);
  }

  private int updateWithSubscriptions(Report r, Person user) {
    final int numRows = updateInternal(r, user);
    if (numRows > 0) {
      final SubscriptionUpdateGroup subscriptionUpdate = getSubscriptionUpdate(r);
      final SubscriptionDao subscriptionDao = AnetObjectEngine.getInstance().getSubscriptionDao();
      subscriptionDao.updateSubscriptions(subscriptionUpdate);
    }
    return numRows;
  }

  @Override
  public int updateInternal(Report r) {
    // Update the report without sensitive information
    return updateInternal(r, null);
  }

  public int updateInternal(Report r, Person user) {
    // Write sensitive information (if allowed)
    ReportSensitiveInformation rsi = r.getReportSensitiveInformation();
    if (rsi != null) {
      rsi.setText(Utils.sanitizeHtml(rsi.getText()));
    }
    AnetObjectEngine.getInstance().getReportSensitiveInformationDao().insertOrUpdate(rsi, user, r);

    DaoUtils.setUpdateFields(r);

    StringBuilder sql = new StringBuilder("/* updateReport */ UPDATE reports SET "
        + "state = :state, \"updatedAt\" = :updatedAt, \"locationUuid\" = :locationUuid, "
        + "intent = :intent, exsum = :exsum, text = :reportText, "
        + "\"keyOutcomes\" = :keyOutcomes, \"nextSteps\" = :nextSteps, "
        + "\"approvalStepUuid\" = :approvalStepUuid, ");
    if (DaoUtils.isMsSql()) {
      sql.append(
          "\"engagementDate\" = CAST(:engagementDate AS datetime2), \"releasedAt\" = CAST(:releasedAt AS datetime2), ");
    } else {
      sql.append("\"engagementDate\" = :engagementDate, \"releasedAt\" = :releasedAt, ");
    }
    sql.append(
        "duration = :duration, atmosphere = :atmosphere, \"atmosphereDetails\" = :atmosphereDetails, "
            + "\"cancelledReason\" = :cancelledReason, "
            + "\"principalOrganizationUuid\" = :principalOrgUuid, \"advisorOrganizationUuid\" = :advisorOrgUuid, "
            + "\"customFields\" = :customFields " + "WHERE uuid = :uuid");

    return getDbHandle().createUpdate(sql.toString()).bindBean(r)
        .bind("updatedAt", DaoUtils.asLocalDateTime(r.getUpdatedAt()))
        .bind("engagementDate", DaoUtils.asLocalDateTime(r.getEngagementDate()))
        .bind("releasedAt", DaoUtils.asLocalDateTime(r.getReleasedAt()))
        .bind("state", DaoUtils.getEnumId(r.getState()))
        .bind("atmosphere", DaoUtils.getEnumId(r.getAtmosphere()))
        .bind("cancelledReason", DaoUtils.getEnumId(r.getCancelledReason())).execute();
  }

  @InTransaction
  public void updateToDraftState(Report r) {
    getDbHandle().createUpdate(
        "/* UpdateFutureEngagementToDraft */ UPDATE reports SET state = :state , \"approvalStepUuid\" = NULL "
            + "WHERE uuid = :reportUuid")
        .bind("state", DaoUtils.getEnumId(ReportState.DRAFT)).bind("reportUuid", r.getUuid())
        .execute();
  }

  @InTransaction
  public int addAttendeeToReport(ReportPerson rp, Report r) {
    return getDbHandle().createUpdate("/* addReportAttendee */ INSERT INTO \"reportPeople\" "
        + "(\"personUuid\", \"reportUuid\", \"isPrimary\") VALUES (:personUuid, :reportUuid, :isPrimary)")
        .bind("personUuid", rp.getUuid()).bind("reportUuid", r.getUuid())
        .bind("isPrimary", rp.isPrimary()).execute();
  }

  @InTransaction
  public int removeAttendeeFromReport(Person p, Report r) {
    return getDbHandle()
        .createUpdate("/* deleteReportAttendee */ DELETE FROM \"reportPeople\" "
            + "WHERE \"reportUuid\" = :reportUuid AND \"personUuid\" = :personUuid")
        .bind("reportUuid", r.getUuid()).bind("personUuid", p.getUuid()).execute();
  }

  @InTransaction
  public int updateAttendeeOnReport(ReportPerson rp, Report r) {
    return getDbHandle().createUpdate("/* updateAttendeeOnReport*/ UPDATE \"reportPeople\" "
        + "SET \"isPrimary\" = :isPrimary WHERE \"reportUuid\" = :reportUuid AND \"personUuid\" = :personUuid")
        .bind("reportUuid", r.getUuid()).bind("personUuid", rp.getUuid())
        .bind("isPrimary", rp.isPrimary()).execute();
  }

  @InTransaction
  public int addAuthorizationGroupToReport(AuthorizationGroup a, Report r) {
    return getDbHandle().createUpdate(
        "/* addAuthorizationGroupToReport */ INSERT INTO \"reportAuthorizationGroups\" (\"authorizationGroupUuid\", \"reportUuid\") "
            + "VALUES (:authorizationGroupUuid, :reportUuid)")
        .bind("reportUuid", r.getUuid()).bind("authorizationGroupUuid", a.getUuid()).execute();
  }

  @InTransaction
  public int removeAuthorizationGroupFromReport(AuthorizationGroup a, Report r) {
    return getDbHandle().createUpdate(
        "/* removeAuthorizationGroupFromReport*/ DELETE FROM \"reportAuthorizationGroups\" "
            + "WHERE \"reportUuid\" = :reportUuid AND \"authorizationGroupUuid\" = :authorizationGroupUuid")
        .bind("reportUuid", r.getUuid()).bind("authorizationGroupUuid", a.getUuid()).execute();
  }

  @InTransaction
  public int addTaskToReport(Task p, Report r) {
    return getDbHandle()
        .createUpdate(
            "/* addTaskToReport */ INSERT INTO \"reportTasks\" (\"taskUuid\", \"reportUuid\") "
                + "VALUES (:taskUuid, :reportUuid)")
        .bind("reportUuid", r.getUuid()).bind("taskUuid", p.getUuid()).execute();
  }

  @InTransaction
  public int removeTaskFromReport(String taskUuid, Report r) {
    return getDbHandle()
        .createUpdate("/* removeTaskFromReport*/ DELETE FROM \"reportTasks\" "
            + "WHERE \"reportUuid\" = :reportUuid AND \"taskUuid\" = :taskUuid")
        .bind("reportUuid", r.getUuid()).bind("taskUuid", taskUuid).execute();
  }

  @InTransaction
  public int addTagToReport(Tag t, Report r) {
    return getDbHandle()
        .createUpdate(
            "/* addTagToReport */ INSERT INTO \"reportTags\" (\"reportUuid\", \"tagUuid\") "
                + "VALUES (:reportUuid, :tagUuid)")
        .bind("reportUuid", r.getUuid()).bind("tagUuid", t.getUuid()).execute();
  }

  @InTransaction
  public int removeTagFromReport(Tag t, Report r) {
    return getDbHandle()
        .createUpdate("/* removeTagFromReport */ DELETE FROM \"reportTags\" "
            + "WHERE \"reportUuid\" = :reportUuid AND \"tagUuid\" = :tagUuid")
        .bind("reportUuid", r.getUuid()).bind("tagUuid", t.getUuid()).execute();
  }

  public CompletableFuture<List<ReportPerson>> getAttendeesForReport(
      @GraphQLRootContext Map<String, Object> context, String reportUuid) {
    return new ForeignKeyFetcher<ReportPerson>().load(context, FkDataLoaderKey.REPORT_ATTENDEES,
        reportUuid);
  }

  @InTransaction
  public List<AuthorizationGroup> getAuthorizationGroupsForReport(String reportUuid) {
    return getDbHandle().createQuery(
        "/* getAuthorizationGroupsForReport */ SELECT * FROM \"authorizationGroups\", \"reportAuthorizationGroups\" "
            + "WHERE \"reportAuthorizationGroups\".\"reportUuid\" = :reportUuid "
            + "AND \"reportAuthorizationGroups\".\"authorizationGroupUuid\" = \"authorizationGroups\".uuid")
        .bind("reportUuid", reportUuid).map(new AuthorizationGroupMapper()).list();
  }

  public CompletableFuture<List<Task>> getTasksForReport(
      @GraphQLRootContext Map<String, Object> context, String reportUuid) {
    return new ForeignKeyFetcher<Task>().load(context, FkDataLoaderKey.REPORT_TASKS, reportUuid);
  }

  public CompletableFuture<List<Tag>> getTagsForReport(
      @GraphQLRootContext Map<String, Object> context, String reportUuid) {
    return new ForeignKeyFetcher<Tag>().load(context, FkDataLoaderKey.REPORT_TAGS, reportUuid);
  }

  @Override
  public AnetBeanList<Report> search(ReportSearchQuery query) {
    return search(null, query);
  }

  public AnetBeanList<Report> search(Set<String> subFields, ReportSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getReportSearcher().runSearch(subFields,
        query);
  }

  @Override
  protected Report getObjectForSubscriptionDelete(String uuid) {
    final Report obj = new Report();
    final Report tmp = getByUuid(uuid);
    obj.setState(tmp.getState());
    return obj;
  }

  /*
   * Deletes a given report from the database. Ensures consistency by removing all references to a
   * report before deleting a report.
   */
  @InTransaction
  @Override
  public int deleteInternal(String reportUuid) {
    // Delete tags
    getDbHandle().execute(
        "/* deleteReport.tags */ DELETE FROM \"reportTags\" where \"reportUuid\" = ?", reportUuid);

    // Delete tasks
    getDbHandle().execute(
        "/* deleteReport.tasks */ DELETE FROM \"reportTasks\" where \"reportUuid\" = ?",
        reportUuid);

    // Delete attendees
    getDbHandle().execute(
        "/* deleteReport.attendees */ DELETE FROM \"reportPeople\" where \"reportUuid\" = ?",
        reportUuid);

    // Delete comments
    getDbHandle().execute(
        "/* deleteReport.comments */ DELETE FROM comments where \"reportUuid\" = ?", reportUuid);

    // Delete \"reportActions\"
    getDbHandle().execute(
        "/* deleteReport.actions */ DELETE FROM \"reportActions\" where \"reportUuid\" = ?",
        reportUuid);

    // Delete relation to authorization groups
    getDbHandle().execute(
        "/* deleteReport.\"authorizationGroups\" */ DELETE FROM \"reportAuthorizationGroups\" where \"reportUuid\" = ?",
        reportUuid);

    // Delete report
    // GraphQL mutations *have* to return something, so we return the number of deleted report rows
    return getDbHandle()
        .createUpdate("/* deleteReport.report */ DELETE FROM reports where uuid = :reportUuid")
        .bind("reportUuid", reportUuid).execute();
  }

  private Instant getRollupEngagmentStart(Instant start) {
    String maxReportAgeStr = AnetObjectEngine.getInstance()
        .getAdminSetting(AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS);
    if (maxReportAgeStr == null) {
      throw new WebApplicationException(
          "Missing Admin Setting for " + AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS);
    }
    long maxReportAge = Long.parseLong(maxReportAgeStr);
    return start.atZone(DaoUtils.getDefaultZoneId()).minusDays(maxReportAge).toInstant();
  }

  /*
   * Generates the Rollup Graph for a particular Organization Type, starting at the root of the org
   * hierarchy
   */
  public List<RollupGraph> getDailyRollupGraph(Instant start, Instant end, OrganizationType orgType,
      Map<String, Organization> nonReportingOrgs) {
    final List<Map<String, Object>> results = rollupQuery(start, end, orgType, null, false);
    final Map<String, Organization> orgMap =
        AnetObjectEngine.getInstance().buildTopLevelOrgHash(orgType);

    return generateRollupGraphFromResults(results, orgMap, nonReportingOrgs);
  }

  /*
   * Generates a Rollup graph for a particular organization. Starting with a given parent
   * Organization
   */
  public List<RollupGraph> getDailyRollupGraph(Instant start, Instant end, String parentOrgUuid,
      OrganizationType orgType, Map<String, Organization> nonReportingOrgs) {
    List<Organization> orgList = null;
    final Map<String, Organization> orgMap;
    if (!parentOrgUuid.equals(Organization.DUMMY_ORG_UUID)) {
      // doing this as two separate queries because I do need all the information about the
      // organizations
      OrganizationSearchQuery query = new OrganizationSearchQuery();
      query.setParentOrgUuid(parentOrgUuid);
      query.setParentOrgRecursively(true);
      query.setPageSize(0);
      orgList = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
      Optional<Organization> parentOrg =
          orgList.stream().filter(o -> o.getUuid().equals(parentOrgUuid)).findFirst();
      if (parentOrg.isPresent() == false) {
        throw new WebApplicationException("No such organization with uuid " + parentOrgUuid,
            Status.NOT_FOUND);
      }
      orgMap = Utils.buildParentOrgMapping(orgList, parentOrgUuid);
    } else {
      orgMap = new HashMap<String, Organization>(); // guaranteed to match no orgs!
    }

    final List<Map<String, Object>> results = rollupQuery(start, end, orgType, orgList,
        parentOrgUuid.equals(Organization.DUMMY_ORG_UUID));

    return generateRollupGraphFromResults(results, orgMap, nonReportingOrgs);
  }

  /* Generates Advisor Report Insights for Organizations */
  @InTransaction
  public List<Map<String, Object>> getAdvisorReportInsights(Instant start, Instant end,
      String orgUuid) {
    final Map<String, Object> sqlArgs = new HashMap<String, Object>();
    StringBuilder sql = new StringBuilder();

    sql.append("/* AdvisorReportInsightsQuery */ ");
    sql.append("SELECT ");
    sql.append(
        "CASE WHEN a.\"organizationUuid\" IS NULL THEN b.\"organizationUuid\" ELSE a.\"organizationUuid\" END AS \"organizationUuid\",");
    sql.append(
        "CASE WHEN a.\"organizationShortName\" IS NULL THEN b.\"organizationShortName\" ELSE a.\"organizationShortName\" END AS \"organizationShortName\",");
    sql.append("%1$s");
    sql.append("%2$s");
    sql.append("CASE WHEN a.week IS NULL THEN b.week ELSE a.week END AS week,");
    sql.append(
        "CASE WHEN a.\"nrReportsSubmitted\" IS NULL THEN 0 ELSE a.\"nrReportsSubmitted\" END AS \"nrReportsSubmitted\",");
    sql.append(
        "CASE WHEN b.\"nrEngagementsAttended\" IS NULL THEN 0 ELSE b.\"nrEngagementsAttended\" END AS \"nrEngagementsAttended\"");

    sql.append(" FROM (");

    sql.append("SELECT ");
    sql.append("organizations.uuid AS \"organizationUuid\",");
    sql.append("organizations.\"shortName\" AS \"organizationShortName\",");
    sql.append("%3$s");
    sql.append("%4$s");
    sql.append(" " + String.format(getWeekFormat(), "reports.\"createdAt\"") + " AS week,");
    sql.append("COUNT(reports.\"authorUuid\") AS \"nrReportsSubmitted\"");

    sql.append(" FROM ");
    sql.append("positions,");
    sql.append("reports,");
    sql.append("%5$s");
    sql.append("organizations");

    sql.append(" WHERE positions.\"currentPersonUuid\" = reports.\"authorUuid\"");
    sql.append(" %6$s");
    sql.append(" AND reports.\"advisorOrganizationUuid\" = organizations.uuid");
    sql.append(" AND positions.type = :positionAdvisor");
    sql.append(" AND reports.state IN ( :reportPublished, :reportPending, :reportDraft )");
    sql.append(" AND reports.\"createdAt\" BETWEEN :startDate and :endDate");
    sql.append(" %11$s");

    sql.append(" GROUP BY ");
    sql.append("organizations.uuid,");
    sql.append("organizations.\"shortName\",");
    sql.append("%7$s");
    sql.append("%8$s");
    sql.append(" " + String.format(getWeekFormat(), "reports.\"createdAt\""));
    sql.append(") a");

    sql.append(" FULL OUTER JOIN (");
    sql.append("SELECT ");
    sql.append("organizations.uuid AS \"organizationUuid\",");
    sql.append("organizations.\"shortName\" AS \"organizationShortName\",");
    sql.append("%3$s");
    sql.append("%4$s");
    sql.append(" " + String.format(getWeekFormat(), "reports.\"engagementDate\"") + " AS week,");
    sql.append("COUNT(\"reportPeople\".\"personUuid\") AS \"nrEngagementsAttended\"");

    sql.append(" FROM ");
    sql.append("positions,");
    sql.append("%5$s");
    sql.append("reports,");
    sql.append("\"reportPeople\",");
    sql.append("organizations");

    sql.append(" WHERE positions.\"currentPersonUuid\" = \"reportPeople\".\"personUuid\"");
    sql.append(" %6$s");
    sql.append(" AND \"reportPeople\".\"reportUuid\" = reports.uuid");
    sql.append(" AND reports.\"advisorOrganizationUuid\" = organizations.uuid");
    sql.append(" AND positions.type = :positionAdvisor");
    sql.append(" AND reports.state IN ( :reportPublished, :reportPending, :reportDraft )");
    sql.append(" AND reports.\"engagementDate\" BETWEEN :startDate and :endDate");
    sql.append(" %11$s");

    sql.append(" GROUP BY ");
    sql.append("organizations.uuid,");
    sql.append("organizations.\"shortName\",");
    sql.append("%7$s");
    sql.append("%8$s");
    sql.append(" " + String.format(getWeekFormat(), "reports.\"engagementDate\""));
    sql.append(") b");

    sql.append(" ON ");
    sql.append(" a.\"organizationUuid\" = b.\"organizationUuid\"");
    sql.append(" %9$s");
    sql.append(" AND a.week = b.week");

    sql.append(" ORDER BY ");
    sql.append("\"organizationShortName\",");
    sql.append("%10$s");
    sql.append("week;");

    final Object[] fmtArgs;
    if (!Organization.DUMMY_ORG_UUID.equals(orgUuid)) {
      fmtArgs = new String[] {
          "CASE WHEN a.\"personUuid\" IS NULL THEN b.\"personUuid\" ELSE a.\"personUuid\" END AS \"personUuid\",",
          "CASE WHEN a.name IS NULL THEN b.name ELSE a.name END AS name,",
          "people.uuid AS \"personUuid\",", "people.name AS name,", "people,",
          "AND positions.\"currentPersonUuid\" = people.uuid", "people.uuid,", "people.name,",
          "AND a.\"personUuid\" = b.\"personUuid\"", "name,",
          "AND organizations.uuid = :organizationUuid"};
      sqlArgs.put("organizationUuid", orgUuid);
    } else {
      fmtArgs = new String[] {"", "", "", "", "", "", "", "", "", "", ""};
    }

    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "startDate", start);
    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "endDate", end);
    sqlArgs.put("positionAdvisor", DaoUtils.getEnumId(Position.PositionType.ADVISOR));
    sqlArgs.put("reportDraft", DaoUtils.getEnumId(ReportState.DRAFT));
    sqlArgs.put("reportPending", DaoUtils.getEnumId(ReportState.PENDING_APPROVAL));
    sqlArgs.put("reportPublished", DaoUtils.getEnumId(ReportState.PUBLISHED));

    return getDbHandle().createQuery(String.format(sql.toString(), fmtArgs)).bindMap(sqlArgs)
        .map(new MapMapper(false)).list();
  }

  /**
   * Helper method that builds and executes the daily rollup query. Searching for just all reports
   * and for reports in certain organizations.
   * 
   * @param orgType the type of organization to be looking for
   * @param orgs the list of orgs for whose reports to find, null means all
   * @param missingOrgReports true if we want to look for reports specifically with NULL org uuid's
   */
  @InTransaction
  public List<Map<String, Object>> rollupQuery(Instant start, Instant end, OrganizationType orgType,
      List<Organization> orgs, boolean missingOrgReports) {
    String orgColumn =
        String.format("\"%s\"", orgType == OrganizationType.ADVISOR_ORG ? "advisorOrganizationUuid"
            : "principalOrganizationUuid");
    final Map<String, Object> sqlArgs = new HashMap<String, Object>();
    final Map<String, List<?>> listArgs = new HashMap<>();

    StringBuilder sql = new StringBuilder();
    sql.append(
        "/* RollupQuery */ SELECT " + orgColumn + " as \"orgUuid\", state, count(*) AS count ");
    sql.append("FROM reports WHERE ");

    sql.append("\"releasedAt\" >= :startDate and \"releasedAt\" < :endDate "
        + "AND \"engagementDate\" > :engagementDateStart ");
    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "startDate", start);
    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "endDate", end);
    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "engagementDateStart",
        getRollupEngagmentStart(start));

    if (!Utils.isEmptyOrNull(orgs)) {
      sql.append("AND " + orgColumn + " IN ( <orgUuids> ) ");
      listArgs.put("orgUuids",
          orgs.stream().map(org -> org.getUuid()).collect(Collectors.toList()));
    } else if (missingOrgReports) {
      sql.append(" AND " + orgColumn + " IS NULL ");
    }

    sql.append("GROUP BY " + orgColumn + ", state");

    final Query q = getDbHandle().createQuery(sql.toString()).bindMap(sqlArgs);
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(listArg.getKey(), listArg.getValue());
    }
    return q.map(new MapMapper(false)).list();
  }

  /*
   * Given the results from the database on the number of reports grouped by organization And the
   * map of each organization to the organization that their reports roll up to this method returns
   * the final rollup graph information.
   */
  private List<RollupGraph> generateRollupGraphFromResults(List<Map<String, Object>> dbResults,
      Map<String, Organization> orgMap, Map<String, Organization> nonReportingOrgs) {
    final Map<String, Map<ReportState, Integer>> rollup = new HashMap<>();

    for (Map<String, Object> result : dbResults) {
      final String orgUuid = (String) result.get("orgUuid");
      if (nonReportingOrgs.containsKey(orgUuid)) {
        // Skip non-reporting organizations
        continue;
      }
      final int count = ((Number) result.get("count")).intValue();
      final ReportState state = ReportState.values()[(Integer) result.get("state")];

      final String parentOrgUuid = DaoUtils.getUuid(orgMap.get(orgUuid));
      Map<ReportState, Integer> orgBar = rollup.get(parentOrgUuid);
      if (orgBar == null) {
        orgBar = new HashMap<ReportState, Integer>();
        rollup.put(parentOrgUuid, orgBar);
      }
      orgBar.put(state, Utils.orIfNull(orgBar.get(state), 0) + count);
    }

    // Add all (top-level) organizations without any reports
    for (final Map.Entry<String, Organization> entry : orgMap.entrySet()) {
      final String orgUuid = entry.getKey();
      if (nonReportingOrgs.containsKey(orgUuid)) {
        // Skip non-reporting organizations
        continue;
      }
      final String parentOrgUuid = DaoUtils.getUuid(orgMap.get(orgUuid));
      if (!rollup.keySet().contains(parentOrgUuid)) {
        final Map<ReportState, Integer> orgBar = new HashMap<ReportState, Integer>();
        orgBar.put(ReportState.PUBLISHED, 0);
        orgBar.put(ReportState.CANCELLED, 0);
        rollup.put(parentOrgUuid, orgBar);
      }
    }

    final List<RollupGraph> result = new LinkedList<RollupGraph>();
    for (Map.Entry<String, Map<ReportState, Integer>> entry : rollup.entrySet()) {
      Map<ReportState, Integer> values = entry.getValue();
      RollupGraph bar = new RollupGraph();
      bar.setOrg(orgMap.get(entry.getKey()));
      bar.setPublished(Utils.orIfNull(values.get(ReportState.PUBLISHED), 0));
      bar.setCancelled(Utils.orIfNull(values.get(ReportState.CANCELLED), 0));
      result.add(bar);
    }

    return result;
  }

  static class SelfIdBatcher extends IdBatcher<Report> {
    private static final String sql = "/* batch.getReportsByUuids */ SELECT " + REPORT_FIELDS
        + "FROM reports WHERE reports.uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new ReportMapper());
    }
  }

  @Override
  public List<Report> getByIds(List<String> uuids) {
    final IdBatcher<Report> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  static class ReportPeopleBatcher extends ForeignKeyBatcher<ReportPerson> {
    private static final String sql = "/* batch.getAttendeesForReport */ SELECT "
        + PersonDao.PERSON_FIELDS
        + ", \"reportPeople\".\"reportUuid\" , \"reportPeople\".\"isPrimary\" FROM \"reportPeople\" "
        + "LEFT JOIN people ON \"reportPeople\".\"personUuid\" = people.uuid "
        + "WHERE \"reportPeople\".\"reportUuid\" IN ( <foreignKeys> )";

    public ReportPeopleBatcher() {
      super(sql, "foreignKeys", new ReportPersonMapper(), "reportUuid");
    }
  }

  public List<List<ReportPerson>> getAttendees(List<String> foreignKeys) {
    final ForeignKeyBatcher<ReportPerson> attendeesBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(ReportPeopleBatcher.class);
    return attendeesBatcher.getByForeignKeys(foreignKeys);
  }

  static class TagsBatcher extends ForeignKeyBatcher<Tag> {
    private static final String sql = "/* batch.getTagsForReport */ SELECT * FROM \"reportTags\" "
        + "INNER JOIN tags ON \"reportTags\".\"tagUuid\" = tags.uuid "
        + "WHERE \"reportTags\".\"reportUuid\" IN ( <foreignKeys> ) ORDER BY tags.name";

    public TagsBatcher() {
      super(sql, "foreignKeys", new TagMapper(), "reportUuid");
    }
  }

  public List<List<Tag>> getTags(List<String> foreignKeys) {
    final ForeignKeyBatcher<Tag> tagsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(TagsBatcher.class);
    return tagsBatcher.getByForeignKeys(foreignKeys);
  }

  static class TasksBatcher extends ForeignKeyBatcher<Task> {
    private static final String sql =
        "/* batch.getTasksForReport */ SELECT * FROM tasks, \"reportTasks\" "
            + "WHERE \"reportTasks\".\"reportUuid\" IN ( <foreignKeys> ) "
            + "AND \"reportTasks\".\"taskUuid\" = tasks.uuid ORDER BY uuid";

    public TasksBatcher() {
      super(sql, "foreignKeys", new TaskMapper(), "reportUuid");
    }
  }

  public List<List<Task>> getTasks(List<String> foreignKeys) {
    final ForeignKeyBatcher<Task> tasksBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(TasksBatcher.class);
    return tasksBatcher.getByForeignKeys(foreignKeys);
  }

  static class ReportSearchBatcher extends SearchQueryBatcher<Report, ReportSearchQuery> {
    public ReportSearchBatcher() {
      super(AnetObjectEngine.getInstance().getReportDao());
    }
  }

  public List<List<Report>> getReportsBySearch(
      List<ImmutablePair<String, ReportSearchQuery>> foreignKeys) {
    final ReportSearchBatcher instance =
        AnetObjectEngine.getInstance().getInjector().getInstance(ReportSearchBatcher.class);
    return instance.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Report>> getReportsBySearch(Map<String, Object> context,
      String uuid, ReportSearchQuery query) {
    return new SearchQueryFetcher<Report, ReportSearchQuery>().load(context,
        SqDataLoaderKey.REPORTS_SEARCH, new ImmutablePair<>(uuid, query));
  }

  public void sendApprovalNeededEmail(Report r) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final ApprovalStep step = r.loadApprovalStep(engine.getContext()).join();
    final List<Position> approvers = step.loadApprovers(engine.getContext()).join();
    final AnetEmail approverEmail = new AnetEmail();
    final ApprovalNeededEmail action = new ApprovalNeededEmail();
    action.setReport(r);
    approverEmail.setAction(action);
    approverEmail.setToAddresses(approvers.stream()
        .filter(a -> (a.getPersonUuid() != null) && !a.getPersonUuid().equals(r.getAuthorUuid()))
        .map(a -> a.loadPerson(engine.getContext()).join().getEmailAddress())
        .collect(Collectors.toList()));
    AnetEmailWorker.sendEmailAsync(approverEmail);
  }

  public void sendReportPublishedEmail(Report r) {
    final AnetEmail email = new AnetEmail();
    final ReportPublishedEmail action = new ReportPublishedEmail();
    action.setReport(r);
    email.setAction(action);
    email.addToAddress(
        r.loadAuthor(AnetObjectEngine.getInstance().getContext()).join().getEmailAddress());
    AnetEmailWorker.sendEmailAsync(email);
  }

  public int approve(Report r, Person user, ApprovalStep step) {
    // Write the approval action
    final ReportAction action = new ReportAction();
    action.setReportUuid(r.getUuid());
    action.setStepUuid(step.getUuid());
    // User could be null when the publication action is being done automatically by a worker
    action.setPersonUuid(DaoUtils.getUuid(user));
    action.setType(ActionType.APPROVE);
    AnetObjectEngine.getInstance().getReportActionDao().insert(action);

    // Update the report
    final String nextStepUuid = getNextStepUuid(r, step);
    r.setApprovalStepUuid(nextStepUuid);
    if (nextStepUuid == null) {
      if (r.getCancelledReason() != null) {
        // Done with cancel, move to CANCELLED and set releasedAt
        r.setState(ReportState.CANCELLED);
        r.setReleasedAt(Instant.now());
      } else {
        // Done with approvals, move to APPROVED
        r.setState(ReportState.APPROVED);
      }
    }
    final int numRows = update(r, r.getAuthor());
    if (numRows != 0 && nextStepUuid != null) {
      sendApprovalNeededEmail(r);
    }
    return numRows;
  }

  private String getNextStepUuid(Report report, ApprovalStep step) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final String currentStepUuid = step.getUuid();
    String nextStepUuid = step.getNextStepUuid();
    if (nextStepUuid == null) {
      // Find out if there's a next approval chain
      final List<ApprovalStep> reportApprovalSteps =
          report.computeApprovalSteps(engine.getContext(), engine).join();
      final Iterator<ApprovalStep> iterator = reportApprovalSteps.iterator();
      while (iterator.hasNext()) {
        final ApprovalStep reportApprovalStep = iterator.next();
        if (Objects.equals(DaoUtils.getUuid(reportApprovalStep), currentStepUuid)) {
          // Found the current step, update the next step
          if (iterator.hasNext()) {
            final ApprovalStep reportApprovalStepNext = iterator.next();
            nextStepUuid = DaoUtils.getUuid(reportApprovalStepNext);
          }
          break;
        }
      }
    }
    return nextStepUuid;
  }

  public int publish(Report r, Person user) {
    // Write the publication action
    final ReportAction action = new ReportAction();
    action.setReportUuid(r.getUuid());
    // User could be null when the publication action is being done automatically by a worker
    action.setPersonUuid(DaoUtils.getUuid(user));
    action.setType(ActionType.PUBLISH);
    AnetObjectEngine.getInstance().getReportActionDao().insert(action);

    // Move the report to PUBLISHED state
    r.setState(ReportState.PUBLISHED);
    r.setReleasedAt(Instant.now());
    final int numRows = update(r, r.getAuthor());
    if (numRows != 0) {
      sendReportPublishedEmail(r);
    }
    return numRows;
  }

  /*
   * Retrieves the reports which used to be for upcoming engagements and for which the engagements
   * have just become past engagements. These reports need to get the draft state as they need to go
   * through the report approval chain before being published.
   */
  @InTransaction
  public List<Report> getFutureToPastReports(Instant end) {
    final Map<String, Object> sqlArgs = new HashMap<String, Object>();
    StringBuilder sql = new StringBuilder();

    sql.append("/* getFutureToPastReports */");
    sql.append(
        " SELECT reports.uuid AS reports_uuid, reports.\"authorUuid\" AS \"reports_authorUuid\"");
    sql.append(" FROM reports");
    // We are not interested in draft reports, as they will remain draft.
    // We are not interested in cancelled reports, as they will remain cancelled.
    sql.append(
        " WHERE reports.state IN ( :reportApproved, :reportRejected, :reportPendingApproval, :reportPublished )");
    // Get past reports relative to the endDate argument
    sql.append(" AND reports.\"engagementDate\" <= :endDate");
    sql.append(" AND ((");
    // Get reports for engagements which just became past engagements during or
    // after the planning approval process, but which are not in the report approval process yet
    sql.append("   reports.uuid IN (");
    sql.append("     SELECT pr.uuid");
    sql.append("     FROM (");
    sql.append("       SELECT r.uuid, ra.\"approvalStepUuid\"");
    sql.append("       FROM reports r");
    // FIXME: Hard-coded MS SQL or PostgreSQL specific query stanza
    if (DaoUtils.isMsSql()) {
      sql.append("     CROSS APPLY (SELECT");
      sql.append("       TOP (1)");
    } else {
      sql.append("     INNER JOIN LATERAL (SELECT"); // PostgreSQL
    }
    sql.append("           \"reportActions\".\"reportUuid\",");
    sql.append("           \"reportActions\".\"approvalStepUuid\"");
    sql.append("         FROM \"reportActions\"");
    sql.append("         WHERE \"reportActions\".\"reportUuid\" = r.uuid");
    sql.append("         AND \"reportActions\".\"approvalStepUuid\" IS NOT NULL");
    sql.append("         ORDER BY \"reportActions\".\"createdAt\" DESC");
    if (DaoUtils.isMsSql()) {
      sql.append("     ) ra");
    } else {
      sql.append("       LIMIT 1"); // PostgreSQL
      sql.append("     ) ra ON TRUE");
    }
    sql.append("       WHERE ra.\"approvalStepUuid\" IN");
    sql.append("         ( SELECT \"approvalSteps\".uuid FROM \"approvalSteps\"");
    sql.append("           WHERE \"approvalSteps\".type = :planningApprovalStepType )");
    sql.append("     ) pr");
    sql.append("   )");
    sql.append(" ) OR (");
    // Also get reports pending planning approval when the approval action was not taken yet
    sql.append("   reports.\"approvalStepUuid\" IN");
    sql.append("     ( SELECT \"approvalSteps\".uuid FROM \"approvalSteps\"");
    sql.append("       WHERE \"approvalSteps\".type = :planningApprovalStepType )");
    sql.append(" ))");
    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "endDate", end);
    sqlArgs.put("reportApproved", DaoUtils.getEnumId(ReportState.APPROVED));
    sqlArgs.put("reportRejected", DaoUtils.getEnumId(ReportState.REJECTED));
    sqlArgs.put("reportPendingApproval", DaoUtils.getEnumId(ReportState.PENDING_APPROVAL));
    sqlArgs.put("reportPublished", DaoUtils.getEnumId(ReportState.PUBLISHED));
    sqlArgs.put("planningApprovalStepType", DaoUtils.getEnumId(ApprovalStepType.PLANNING_APPROVAL));
    return getDbHandle().createQuery(sql.toString()).bindMap(sqlArgs).map(new ReportMapper())
        .list();
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Report obj) {
    final boolean isParam = (obj != null);
    if (isParam && obj.getState() != ReportState.PUBLISHED
        && obj.getState() != ReportState.CANCELLED) {
      return null;
    }

    final SubscriptionUpdateGroup update =
        getCommonSubscriptionUpdate(obj, TABLE_NAME, "reports.uuid");
    // update author
    update.stmts.add(getCommonSubscriptionUpdateStatement(isParam,
        isParam ? obj.getAuthorUuid() : null, "people", "reports.authorUuid"));
    // update attendees
    update.stmts.add(new SubscriptionUpdateStatement("people",
        "SELECT \"personUuid\"" + " FROM \"reportPeople\"" + " WHERE \"reportUuid\" = "
            + paramOrJoin("reports.uuid", isParam),
        // param is already added above
        Collections.emptyMap()));
    // update author position
    update.stmts.add(new SubscriptionUpdateStatement("positions",
        "SELECT uuid" + " FROM positions" + " WHERE \"currentPersonUuid\" = "
            + paramOrJoin("reports.authorUuid", isParam),
        // param is already added above
        Collections.emptyMap()));
    // update attendee positions
    update.stmts.add(new SubscriptionUpdateStatement("positions",
        "SELECT uuid" + " FROM positions" + " WHERE \"currentPersonUuid\" in ("
            + "   SELECT \"personUuid\"" + "   FROM \"reportPeople\"" + "   WHERE \"reportUuid\" = "
            + paramOrJoin("reports.uuid", isParam) + " )",
        // param is already added above
        Collections.emptyMap()));
    // update organizations
    // TODO: is this correct?
    update.stmts
        .add(getCommonSubscriptionUpdateStatement(isParam, isParam ? obj.getAdvisorOrgUuid() : null,
            "organizations", "reports.advisorOrganizationUuid"));
    update.stmts.add(
        getCommonSubscriptionUpdateStatement(isParam, isParam ? obj.getPrincipalOrgUuid() : null,
            "organizations", "reports.principalOrganizationUuid"));
    // update tasks
    update.stmts.add(new SubscriptionUpdateStatement("tasks",
        "SELECT \"taskUuid\"" + " FROM \"reportTasks\"" + " WHERE \"reportUuid\" = "
            + paramOrJoin("reports.uuid", isParam),
        // param is already added above
        Collections.emptyMap()));
    // update location
    update.stmts.add(getCommonSubscriptionUpdateStatement(isParam,
        isParam ? obj.getLocationUuid() : null, "locations", "reports.locationUuid"));

    return update;
  }

}
