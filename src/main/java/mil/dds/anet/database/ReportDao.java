package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import com.google.common.collect.ObjectArrays;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response.Status;
import java.lang.invoke.MethodHandles;
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
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportAction.ActionType;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.RollupGraph.RollupGraphType;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.database.mappers.ReportPersonMapper;
import mil.dds.anet.database.mappers.TaskMapper;
import mil.dds.anet.emails.AnetEmailAction;
import mil.dds.anet.emails.ApprovalNeededEmail;
import mil.dds.anet.emails.ReportPublishedEmail;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class ReportDao extends AnetSubscribableObjectDao<Report, ReportSearchQuery> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // Must always retrieve these e.g. for ORDER BY or search post-processing
  public static final String[] minimalFields =
      {"uuid", "approvalStepUuid", "advisorOrganizationUuid", "createdAt", "updatedAt",
          "engagementDate", "releasedAt", "state", "classification"};
  public static final String[] additionalFields = {"duration", "intent", "exsum", "locationUuid",
      "interlocutorOrganizationUuid", "atmosphere", "cancelledReason", "atmosphereDetails", "text",
      "keyOutcomes", "nextSteps", "customFields"};
  public static final String[] allFields =
      ObjectArrays.concat(minimalFields, additionalFields, String.class);
  public static final String TABLE_NAME = "reports";
  public static final String REPORT_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, allFields, true);

  private static final String weekFormat = "EXTRACT(WEEK FROM %s)";

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
    final String sql = "/* insertReport */ INSERT INTO reports "
        + "(uuid, state, \"createdAt\", \"updatedAt\", \"locationUuid\", intent, exsum, "
        + "text, \"keyOutcomes\", \"nextSteps\", "
        + "\"engagementDate\", \"releasedAt\", duration, atmosphere, \"cancelledReason\", "
        + "\"atmosphereDetails\", \"advisorOrganizationUuid\", "
        + "\"interlocutorOrganizationUuid\", \"customFields\", \"classification\") VALUES "
        + "(:uuid, :state, :createdAt, :updatedAt, :locationUuid, :intent, "
        + ":exsum, :reportText, :keyOutcomes, :nextSteps, :engagementDate, :releasedAt, "
        + ":duration, :atmosphere, :cancelledReason, :atmosphereDetails, :advisorOrgUuid, "
        + ":interlocutorOrgUuid, :customFields, :classification)";

    getDbHandle().createUpdate(sql).bindBean(r)
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
    if (r.getReportPeople() != null) {
      // Setify based on uuid to prevent violations of unique key constraint.
      Map<String, ReportPerson> reportPeopleMap = new HashMap<>();
      r.getReportPeople().stream().forEach(rp -> reportPeopleMap.put(rp.getUuid(), rp));
      rb.insertReportPeople(r.getUuid(), new ArrayList<>(reportPeopleMap.values()));
    }

    if (r.getAuthorizationGroups() != null) {
      rb.insertReportAuthorizationGroups(r.getUuid(), r.getAuthorizationGroups());
    }
    if (r.getTasks() != null) {
      rb.insertReportTasks(r.getUuid(), r.getTasks());
    }
    return r;
  }

  public interface ReportBatch {
    @SqlBatch("INSERT INTO \"reportPeople\""
        + " (\"reportUuid\", \"personUuid\", \"isPrimary\", \"isAuthor\", \"isAttendee\", \"isInterlocutor\")"
        + " VALUES (:reportUuid, :uuid, :primary, :author, :attendee, :interlocutor)")
    void insertReportPeople(@Bind("reportUuid") String reportUuid,
        @BindBean List<ReportPerson> reportPeople);

    @SqlBatch("INSERT INTO \"reportAuthorizationGroups\" (\"reportUuid\", \"authorizationGroupUuid\") VALUES (:reportUuid, :uuid)")
    void insertReportAuthorizationGroups(@Bind("reportUuid") String reportUuid,
        @BindBean List<AuthorizationGroup> authorizationGroups);

    @SqlBatch("INSERT INTO \"reportTasks\" (\"reportUuid\", \"taskUuid\") VALUES (:reportUuid, :uuid)")
    void insertReportTasks(@Bind("reportUuid") String reportUuid, @BindBean List<Task> tasks);
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

    final String sql = "/* updateReport */ UPDATE reports SET "
        + "state = :state, \"updatedAt\" = :updatedAt, \"locationUuid\" = :locationUuid, "
        + "intent = :intent, exsum = :exsum, text = :reportText, \"keyOutcomes\" = :keyOutcomes, "
        + "\"nextSteps\" = :nextSteps, \"approvalStepUuid\" = :approvalStepUuid, "
        + "\"engagementDate\" = :engagementDate, \"releasedAt\" = :releasedAt, "
        + "duration = :duration, atmosphere = :atmosphere, "
        + "\"atmosphereDetails\" = :atmosphereDetails, "
        + "\"cancelledReason\" = :cancelledReason, "
        + "\"interlocutorOrganizationUuid\" = :interlocutorOrgUuid, "
        + "\"advisorOrganizationUuid\" = :advisorOrgUuid, " + "\"customFields\" = :customFields, "
        + "\"classification\" = :classification WHERE uuid = :uuid";

    return getDbHandle().createUpdate(sql).bindBean(r)
        .bind("updatedAt", DaoUtils.asLocalDateTime(r.getUpdatedAt()))
        .bind("engagementDate", DaoUtils.asLocalDateTime(r.getEngagementDate()))
        .bind("releasedAt", DaoUtils.asLocalDateTime(r.getReleasedAt()))
        .bind("state", DaoUtils.getEnumId(r.getState()))
        .bind("atmosphere", DaoUtils.getEnumId(r.getAtmosphere()))
        .bind("cancelledReason", DaoUtils.getEnumId(r.getCancelledReason())).execute();
  }

  @InTransaction
  public int updateToDraftState(Report r) {
    return getDbHandle().createUpdate(
        "/* UpdateFutureEngagementToDraft */ UPDATE reports SET state = :state , \"approvalStepUuid\" = NULL "
            + "WHERE uuid = :reportUuid")
        .bind("state", DaoUtils.getEnumId(ReportState.DRAFT)).bind("reportUuid", r.getUuid())
        .execute();
  }

  @InTransaction
  public int addPersonToReport(ReportPerson rp, Report r) {
    return getDbHandle().createUpdate("/* addReportPerson */ INSERT INTO \"reportPeople\" "
        + "(\"personUuid\", \"reportUuid\", \"isPrimary\", \"isAuthor\", \"isAttendee\", \"isInterlocutor\")"
        + " VALUES (:personUuid, :reportUuid, :primary, :author, :attendee, :interlocutor)")
        .bind("personUuid", rp.getUuid()).bind("reportUuid", r.getUuid()).bindBean(rp).execute();
  }

  @InTransaction
  public int removePersonFromReport(Person p, Report r) {
    return getDbHandle()
        .createUpdate("/* deleteReportPerson */ DELETE FROM \"reportPeople\" "
            + "WHERE \"reportUuid\" = :reportUuid AND \"personUuid\" = :personUuid")
        .bind("reportUuid", r.getUuid()).bind("personUuid", p.getUuid()).execute();
  }

  @InTransaction
  public int updatePersonOnReport(ReportPerson rp, Report r) {
    return getDbHandle().createUpdate("/* updatePersonOnReport*/ UPDATE \"reportPeople\" "
        + "SET \"isPrimary\" = :primary, \"isAuthor\" = :author, \"isAttendee\" = :attendee, \"isInterlocutor\" = :interlocutor"
        + " WHERE \"reportUuid\" = :reportUuid AND \"personUuid\" = :personUuid")
        .bind("reportUuid", r.getUuid()).bind("personUuid", rp.getUuid()).bindBean(rp).execute();
  }

  @InTransaction
  public int addAuthorizationGroupToReport(AuthorizationGroup a, Report r) {
    return getDbHandle().createUpdate(
        "/* addAuthorizationGroupToReport */ INSERT INTO \"reportAuthorizationGroups\" (\"authorizationGroupUuid\", \"reportUuid\") "
            + "VALUES (:authorizationGroupUuid, :reportUuid)")
        .bind("reportUuid", r.getUuid()).bind("authorizationGroupUuid", a.getUuid()).execute();
  }

  @InTransaction
  public int removeAuthorizationGroupFromReport(String authorizationGroupUuid, String reportUuid) {
    return getDbHandle().createUpdate(
        "/* removeAuthorizationGroupFromReport*/ DELETE FROM \"reportAuthorizationGroups\" "
            + "WHERE \"reportUuid\" = :reportUuid AND \"authorizationGroupUuid\" = :authorizationGroupUuid")
        .bind("reportUuid", reportUuid).bind("authorizationGroupUuid", authorizationGroupUuid)
        .execute();
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

  public CompletableFuture<List<ReportPerson>> getPeopleForReport(
      @GraphQLRootContext Map<String, Object> context, String reportUuid) {
    return new ForeignKeyFetcher<ReportPerson>().load(context, FkDataLoaderKey.REPORT_PEOPLE,
        reportUuid);
  }

  @InTransaction
  public List<AuthorizationGroup> getAuthorizationGroupsForReport(String reportUuid) {
    return getDbHandle().createQuery("/* getAuthorizationGroupsForReport */ SELECT "
        + AuthorizationGroupDao.AUTHORIZATION_GROUP_FIELDS
        + " FROM \"authorizationGroups\", \"reportAuthorizationGroups\" "
        + "WHERE \"reportAuthorizationGroups\".\"reportUuid\" = :reportUuid "
        + "AND \"reportAuthorizationGroups\".\"authorizationGroupUuid\" = \"authorizationGroups\".uuid")
        .bind("reportUuid", reportUuid).map(new AuthorizationGroupMapper()).list();
  }

  public CompletableFuture<List<Task>> getTasksForReport(
      @GraphQLRootContext Map<String, Object> context, String reportUuid) {
    return new ForeignKeyFetcher<Task>().load(context, FkDataLoaderKey.REPORT_TASKS, reportUuid);
  }

  @Override
  public AnetBeanList<Report> search(ReportSearchQuery query) {
    return search(AnetObjectEngine.getInstance().getContext(), query).join();
  }

  public CompletableFuture<AnetBeanList<Report>> search(Map<String, Object> context,
      ReportSearchQuery query) {
    return search(context, null, query);
  }

  public CompletableFuture<AnetBeanList<Report>> search(Map<String, Object> context,
      Set<String> subFields, ReportSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getReportSearcher().runSearch(context,
        subFields, query);
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
  @Override
  public int deleteInternal(String reportUuid) {
    // Delete tasks
    getDbHandle().execute(
        "/* deleteReport.tasks */ DELETE FROM \"reportTasks\" where \"reportUuid\" = ?",
        reportUuid);

    // Delete reportPeople
    getDbHandle().execute(
        "/* deleteReport.reportPeople */ DELETE FROM \"reportPeople\" where \"reportUuid\" = ?",
        reportUuid);

    // Delete comments
    getDbHandle().execute(
        "/* deleteReport.comments */ DELETE FROM comments where \"reportUuid\" = ?", reportUuid);

    // Delete reportActions
    getDbHandle().execute(
        "/* deleteReport.actions */ DELETE FROM \"reportActions\" where \"reportUuid\" = ?",
        reportUuid);

    // Delete relation to authorization groups
    getDbHandle().execute(
        "/* deleteReport.\"authorizationGroups\" */ DELETE FROM \"reportAuthorizationGroups\" where \"reportUuid\" = ?",
        reportUuid);

    final AnetObjectEngine instance = AnetObjectEngine.getInstance();
    // Delete customSensitiveInformation
    instance.getCustomSensitiveInformationDao().deleteFor(reportUuid);

    final NoteDao noteDao = instance.getNoteDao();
    // Delete assessments
    noteDao.deleteAssessments(TABLE_NAME, reportUuid);
    // Delete other noteRelatedObjects
    noteDao.deleteNoteRelatedObjects(TABLE_NAME, reportUuid);
    // Delete orphan notes
    noteDao.deleteOrphanNotes();

    final AttachmentDao attachmentDao = instance.getAttachmentDao();
    // Delete attachments
    attachmentDao.deleteAttachments(TABLE_NAME, reportUuid);

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
    try {
      long maxReportAge = Long.parseLong(maxReportAgeStr);
      return start.atZone(DaoUtils.getServerNativeZoneId()).minusDays(maxReportAge).toInstant();
    } catch (NumberFormatException e) {
      throw new WebApplicationException("Invalid Admin Setting for "
          + AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS + ": " + maxReportAgeStr);
    }
  }

  /*
   * Generates the Rollup Graph for a particular Organization Type, starting at the root of the org
   * hierarchy
   */
  public List<RollupGraph> getDailyRollupGraph(Instant start, Instant end, RollupGraphType orgType,
      Map<String, Organization> nonReportingOrgs) {
    final List<Map<String, Object>> results = rollupQuery(start, end, orgType, null, false);
    final Map<String, Organization> orgMap = AnetObjectEngine.getInstance().buildTopLevelOrgHash();

    return generateRollupGraphFromResults(results, orgMap, nonReportingOrgs);
  }

  /*
   * Generates a Rollup graph for a particular organization. Starting with a given parent
   * Organization
   */
  public List<RollupGraph> getDailyRollupGraph(Instant start, Instant end, String parentOrgUuid,
      RollupGraphType orgType, Map<String, Organization> nonReportingOrgs) {
    List<Organization> orgList = null;
    final Map<String, Organization> orgMap;
    if (!parentOrgUuid.equals(Organization.DUMMY_ORG_UUID)) {
      // doing this as two separate queries because I do need all the information about the
      // organizations
      OrganizationSearchQuery query = new OrganizationSearchQuery();
      query.setParentOrgUuid(Collections.singletonList(parentOrgUuid));
      query.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
      query.setPageSize(0);
      orgList = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
      Optional<Organization> parentOrg =
          orgList.stream().filter(o -> o.getUuid().equals(parentOrgUuid)).findFirst();
      if (parentOrg.isEmpty()) {
        throw new WebApplicationException("No such organization with uuid " + parentOrgUuid,
            Status.NOT_FOUND);
      }
      orgMap = Utils.buildOrgToParentOrgMapping(orgList, parentOrgUuid);
    } else {
      orgMap = new HashMap<>(); // guaranteed to match no orgs!
    }

    final List<Map<String, Object>> results = rollupQuery(start, end, orgType, orgList,
        parentOrgUuid.equals(Organization.DUMMY_ORG_UUID));

    return generateRollupGraphFromResults(results, orgMap, nonReportingOrgs);
  }

  /* Generates Advisor Report Insights for Organizations */
  @InTransaction
  public List<Map<String, Object>> getAdvisorReportInsights(Instant start, Instant end,
      String orgUuid) {
    final Map<String, Object> sqlArgs = new HashMap<>();
    final StringBuilder sql = new StringBuilder();

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
    sql.append(" ").append(String.format(weekFormat, "reports.\"createdAt\"")).append(" AS week,");
    sql.append("COUNT(\"reportPeople\".\"personUuid\") AS \"nrReportsSubmitted\"");

    sql.append(" FROM ");
    sql.append("positions,");
    sql.append("reports,");
    sql.append("\"reportPeople\",");
    sql.append("%5$s");
    sql.append("organizations");

    sql.append(" WHERE positions.\"currentPersonUuid\" = \"reportPeople\".\"personUuid\"");
    sql.append(" AND \"reportPeople\".\"reportUuid\" = reports.uuid");
    sql.append(" AND \"reportPeople\".\"isInterlocutor\" = :isInterlocutor");
    sql.append(" %6$s");
    sql.append(" AND reports.\"advisorOrganizationUuid\" = organizations.uuid");
    sql.append(
        " AND reports.state IN ( :reportPublished, :reportApproved, :reportPending, :reportDraft )");
    sql.append(" AND reports.\"createdAt\" BETWEEN :startDate and :endDate");
    sql.append(" %11$s");

    sql.append(" GROUP BY ");
    sql.append("organizations.uuid,");
    sql.append("organizations.\"shortName\",");
    sql.append("%7$s");
    sql.append("%8$s");
    sql.append(" ").append(String.format(weekFormat, "reports.\"createdAt\""));
    sql.append(") a");

    sql.append(" FULL OUTER JOIN (");
    sql.append("SELECT ");
    sql.append("organizations.uuid AS \"organizationUuid\",");
    sql.append("organizations.\"shortName\" AS \"organizationShortName\",");
    sql.append("%3$s");
    sql.append("%4$s");
    sql.append(" ").append(String.format(weekFormat, "reports.\"engagementDate\""))
        .append(" AS week,");
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
    sql.append(" AND \"reportPeople\".\"isInterlocutor\" = :isInterlocutor");
    sql.append(" AND reports.\"advisorOrganizationUuid\" = organizations.uuid");
    sql.append(
        " AND reports.state IN ( :reportPublished, :reportApproved, :reportPending, :reportDraft )");
    sql.append(" AND reports.\"engagementDate\" BETWEEN :startDate and :endDate");
    sql.append(" %11$s");

    sql.append(" GROUP BY ");
    sql.append("organizations.uuid,");
    sql.append("organizations.\"shortName\",");
    sql.append("%7$s");
    sql.append("%8$s");
    sql.append(" ").append(String.format(weekFormat, "reports.\"engagementDate\""));
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
    sqlArgs.put("reportDraft", DaoUtils.getEnumId(ReportState.DRAFT));
    sqlArgs.put("reportPending", DaoUtils.getEnumId(ReportState.PENDING_APPROVAL));
    sqlArgs.put("reportApproved", DaoUtils.getEnumId(ReportState.APPROVED));
    sqlArgs.put("reportPublished", DaoUtils.getEnumId(ReportState.PUBLISHED));
    sqlArgs.put("isInterlocutor", false);

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
  public List<Map<String, Object>> rollupQuery(Instant start, Instant end, RollupGraphType orgType,
      List<Organization> orgs, boolean missingOrgReports) {
    String orgColumn =
        String.format("\"%s\"", RollupGraphType.ADVISOR.equals(orgType) ? "advisorOrganizationUuid"
            : "interlocutorOrganizationUuid");
    final Map<String, Object> sqlArgs = new HashMap<>();
    final Map<String, List<?>> listArgs = new HashMap<>();

    StringBuilder sql = new StringBuilder();
    sql.append("/* RollupQuery */ SELECT ").append(orgColumn)
        .append(" as \"orgUuid\", state, count(*) AS count ");
    sql.append("FROM reports WHERE ");

    sql.append("\"releasedAt\" >= :startDate and \"releasedAt\" < :endDate "
        + "AND \"engagementDate\" > :engagementDateStart ");
    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "startDate", start);
    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "endDate", end);
    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "engagementDateStart",
        getRollupEngagmentStart(start));

    if (!Utils.isEmptyOrNull(orgs)) {
      sql.append("AND ").append(orgColumn).append(" IN ( <orgUuids> ) ");
      listArgs.put("orgUuids",
          orgs.stream().map(AbstractAnetBean::getUuid).collect(Collectors.toList()));
    } else if (missingOrgReports) {
      sql.append(" AND ").append(orgColumn).append(" IS NULL ");
    }

    sql.append("GROUP BY ").append(orgColumn).append(", state");

    final Query q = getDbHandle().createQuery(sql.toString()).bindMap(sqlArgs);
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(NULL_KEYWORD, listArg.getKey(), listArg.getValue());
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
      Map<ReportState, Integer> orgBar =
          rollup.computeIfAbsent(parentOrgUuid, k -> new HashMap<>());
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
      if (!rollup.containsKey(parentOrgUuid)) {
        final Map<ReportState, Integer> orgBar = new HashMap<>();
        orgBar.put(ReportState.PUBLISHED, 0);
        orgBar.put(ReportState.CANCELLED, 0);
        rollup.put(parentOrgUuid, orgBar);
      }
    }

    final List<RollupGraph> result = new LinkedList<>();
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
    private static final String sql =
        "/* batch.getPeopleForReport */ SELECT " + PersonDao.PERSON_FIELDS
            + ", \"reportPeople\".\"reportUuid\", \"reportPeople\".\"isPrimary\""
            + ", \"reportPeople\".\"isAuthor\", \"reportPeople\".\"isAttendee\""
            + ", \"reportPeople\".\"isInterlocutor\" FROM \"reportPeople\" "
            + "LEFT JOIN people ON \"reportPeople\".\"personUuid\" = people.uuid "
            + "WHERE \"reportPeople\".\"reportUuid\" IN ( <foreignKeys> ) "
            + "ORDER BY people.name, people.uuid";

    public ReportPeopleBatcher() {
      super(sql, "foreignKeys", new ReportPersonMapper(), "reportUuid");
    }
  }

  public List<List<ReportPerson>> getReportPeople(List<String> foreignKeys) {
    final ForeignKeyBatcher<ReportPerson> reportPeopleBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(ReportPeopleBatcher.class);
    return reportPeopleBatcher.getByForeignKeys(foreignKeys);
  }

  static class TasksBatcher extends ForeignKeyBatcher<Task> {
    private static final String sql = "/* batch.getTasksForReport */ SELECT " + TaskDao.TASK_FIELDS
        + ", \"reportTasks\".\"reportUuid\" FROM tasks, \"reportTasks\" "
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

  public void sendApprovalNeededEmail(Report r, ApprovalStep approvalStep) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final List<ReportPerson> authors = r.loadAuthors(engine.getContext()).join();
    final List<Position> approverPositions = approvalStep.loadApprovers(engine.getContext()).join();
    final List<Person> approvers = approverPositions.stream()
        .filter(a -> (a.getPersonUuid() != null)
            && authors.stream().noneMatch(p -> a.getPersonUuid().equals(p.getUuid())))
        .map(a -> a.loadPerson(engine.getContext()).join()).toList();
    final ApprovalNeededEmail action = new ApprovalNeededEmail();
    action.setReport(r);
    sendEmailToReportPeople(action, approvers);
  }

  public void sendReportPublishedEmail(Report r) {
    final ReportPublishedEmail action = new ReportPublishedEmail();
    action.setReport(r);
    sendEmailToReportAuthors(action, r);
  }

  public static void sendEmailToReportAuthors(AnetEmailAction action, Report report) {
    final List<ReportPerson> authors =
        report.loadAuthors(AnetObjectEngine.getInstance().getContext()).join();
    sendEmailToReportPeople(action, authors);
  }

  public static void sendEmailToReportPeople(AnetEmailAction action,
      List<? extends Person> people) {
    // Make sure all email addresses are loaded
    CompletableFuture.allOf(people.stream()
        .map(a -> a.loadEmailAddresses(AnetObjectEngine.getInstance().getContext(), null))
        .toArray(CompletableFuture<?>[]::new)).join();
    AnetEmail email = new AnetEmail();
    email.setAction(action);
    final List<String> addresses = people.stream()
        .map(p -> p.getNotificationEmailAddress().map(EmailAddress::getAddress).orElse(null))
        .filter(ea -> !Utils.isEmptyOrNull(ea)).toList();
    email.setToAddresses(addresses);
    AnetEmailWorker.sendEmailAsync(email);
  }

  public int submit(final Report r, final Person user) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    // Get all the approval steps for this report
    final List<ApprovalStep> steps = r.computeApprovalSteps(engine.getContext(), engine).join();

    // Write the submission action
    final boolean futureEngagement = r.isFutureEngagement();
    final ReportAction action = new ReportAction();
    action.setReportUuid(r.getUuid());
    action.setPersonUuid(user.getUuid());
    action.setType(ActionType.SUBMIT);
    action.setPlanned(futureEngagement);
    engine.getReportActionDao().insert(action);

    if (Utils.isEmptyOrNull(steps)) {
      final AnetConfiguration config = AnetObjectEngine.getConfiguration();
      if ((futureEngagement && Boolean.TRUE
          .equals(config.getDictionaryEntry("reportWorkflow.optionalPlanningApprovalWorkflow")))
          || (!futureEngagement && Boolean.TRUE
              .equals(config.getDictionaryEntry("reportWorkflow.optionalApprovalWorkflow")))) {
        // Approval is optional, approve directly by writing the approval action
        final ReportAction approval = new ReportAction();
        approval.setReportUuid(r.getUuid());
        approval.setPersonUuid(user.getUuid());
        approval.setType(ActionType.APPROVE);
        approval.setPlanned(futureEngagement); // so the FutureEngagementWorker can find this
        engine.getReportActionDao().insert(approval);
        r.setState(ReportState.APPROVED);
      } else {
        // No approval workflow has been defined, and approval is not optional!
        final String msg;
        final String defaultOrgUuid = engine.getDefaultOrgUuid();
        if (Utils.isEmptyOrNull(defaultOrgUuid)) {
          msg = "The default approval organization is undefined";
        } else {
          final Organization defaultOrg = engine.getOrganizationDao().getByUuid(defaultOrgUuid);
          msg = defaultOrg == null
              ? "The default approval organization with uuid '" + defaultOrgUuid
                  + "' does not exist"
              : "The default approval organization " + defaultOrg
                  + " is missing an approval workflow";
        }
        throw new WebApplicationException(msg + "; please contact your administrator!");
      }
    } else {
      // Push the report into the first step of this workflow
      r.setApprovalStep(steps.get(0));
      r.setState(ReportState.PENDING_APPROVAL);
    }
    final int numRows = update(r, user);
    if (numRows != 0 && !Utils.isEmptyOrNull(steps)) {
      sendApprovalNeededEmail(r, steps.get(0));
      logger.info("Putting report {} into step {}", r.getUuid(), steps.get(0).getUuid());
    }
    return numRows;
  }

  public int approve(Report r, Person user, ApprovalStep step) {
    // Write the approval action
    final ReportAction action = new ReportAction();
    action.setReportUuid(r.getUuid());
    action.setStepUuid(step.getUuid());
    // User could be null when the approval action is being done automatically by a worker
    action.setPersonUuid(DaoUtils.getUuid(user));
    action.setType(ActionType.APPROVE);
    action.setPlanned(ApprovalStep.isPlanningStep(step));
    AnetObjectEngine.getInstance().getReportActionDao().insert(action);

    // Update the report
    final ApprovalStep nextStep = getNextStep(r, step);
    r.setApprovalStepUuid(DaoUtils.getUuid(nextStep));
    if (nextStep == null) {
      if (r.getCancelledReason() != null) {
        // Done with cancel, move to CANCELLED and set releasedAt
        r.setState(ReportState.CANCELLED);
        r.setReleasedAt(Instant.now());
      } else {
        // Done with approvals, move to APPROVED
        r.setState(ReportState.APPROVED);
      }
    }
    final Optional<ReportPerson> firstAuthor =
        r.loadAuthors(AnetObjectEngine.getInstance().getContext()).join().stream().findFirst();
    final int numRows = update(r, firstAuthor.orElse(null));
    if (numRows != 0 && nextStep != null) {
      sendApprovalNeededEmail(r, nextStep);
    }
    return numRows;
  }

  private ApprovalStep getNextStep(Report report, ApprovalStep step) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final String currentStepUuid = step.getUuid();
    // Find out if there's a next approval chain
    final List<ApprovalStep> reportApprovalSteps =
        report.computeApprovalSteps(engine.getContext(), engine).join();
    for (final Iterator<ApprovalStep> iterator = reportApprovalSteps.iterator(); iterator
        .hasNext();) {
      final ApprovalStep reportApprovalStep = iterator.next();
      if (Objects.equals(DaoUtils.getUuid(reportApprovalStep), currentStepUuid)) {
        // Found the current step, update the next step
        if (iterator.hasNext()) {
          return iterator.next();
        }
        break;
      }
    }
    return null;
  }

  public int publish(Report r, Person user) {
    // Write the publication action
    final ReportAction action = new ReportAction();
    action.setReportUuid(r.getUuid());
    // User could be null when the publication action is being done automatically by a worker
    action.setPersonUuid(DaoUtils.getUuid(user));
    action.setType(ActionType.PUBLISH);
    final List<ReportAction> workflow =
        r.loadWorkflow(AnetObjectEngine.getInstance().getContext()).join();
    if (!workflow.isEmpty()) {
      final ReportAction lastAction = workflow.get(workflow.size() - 1);
      // Keep 'planned' from previous (possibly automatic) APPROVE action,
      // so the FutureEngagementWorker will pick it up if it was indeed planned
      action.setPlanned(lastAction.isPlanned());
    }
    AnetObjectEngine.getInstance().getReportActionDao().insert(action);

    // Move the report to PUBLISHED state
    r.setState(ReportState.PUBLISHED);
    r.setReleasedAt(Instant.now());
    final Optional<ReportPerson> firstAuthor =
        r.loadAuthors(AnetObjectEngine.getInstance().getContext()).join().stream().findFirst();
    final int numRows = update(r, firstAuthor.orElse(null));
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
    final Map<String, Object> sqlArgs = new HashMap<>();
    StringBuilder sql = new StringBuilder();

    sql.append("/* getFutureToPastReports */");
    sql.append(" SELECT r.uuid AS reports_uuid");
    sql.append(" FROM reports r");
    // Get the last report action
    sql.append(" LEFT JOIN LATERAL (SELECT");
    sql.append("   ra.\"approvalStepUuid\", ra.planned");
    sql.append("   FROM \"reportActions\" ra");
    sql.append("   WHERE ra.\"reportUuid\" = r.uuid");
    sql.append("   ORDER BY ra.\"createdAt\" DESC");
    sql.append(" LIMIT 1) ra ON TRUE");
    // We are not interested in draft reports, as they will remain draft.
    // We are not interested in cancelled reports, as they will remain cancelled.
    sql.append(" WHERE r.state IN (");
    sql.append("   :reportApproved, :reportRejected, :reportPendingApproval, :reportPublished");
    sql.append(" )");
    // Get past reports relative to the endDate argument
    sql.append(" AND r.\"engagementDate\" <= :endDate");
    // Get reports for engagements which just became past engagements during or
    // after the planning approval process, but which are not in the report approval process yet
    sql.append(" AND ra.planned = :planned");
    DaoUtils.addInstantAsLocalDateTime(sqlArgs, "endDate", end);
    sqlArgs.put("reportApproved", DaoUtils.getEnumId(ReportState.APPROVED));
    sqlArgs.put("reportRejected", DaoUtils.getEnumId(ReportState.REJECTED));
    sqlArgs.put("reportPendingApproval", DaoUtils.getEnumId(ReportState.PENDING_APPROVAL));
    sqlArgs.put("reportPublished", DaoUtils.getEnumId(ReportState.PUBLISHED));
    sqlArgs.put("planned", true);
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

    // update report; this also adds the param
    final SubscriptionUpdateGroup update =
        getCommonSubscriptionUpdate(obj, TABLE_NAME, "reports.uuid");
    // update reportPeople
    update.stmts.add(new SubscriptionUpdateStatement("people",
        "SELECT \"personUuid\" FROM \"reportPeople\" WHERE \"reportUuid\" = "
            + paramOrJoin("reports.uuid", isParam),
        // param is already added above
        Collections.emptyMap()));
    // update reportPeople positions
    update.stmts.add(new SubscriptionUpdateStatement("positions",
        "SELECT uuid FROM positions WHERE \"currentPersonUuid\" in ("
            + " SELECT \"personUuid\" FROM \"reportPeople\" WHERE \"reportUuid\" = "
            + paramOrJoin("reports.uuid", isParam) + " )",
        // param is already added above
        Collections.emptyMap()));
    // update organizations
    // TODO: is this correct?
    update.stmts
        .add(getCommonSubscriptionUpdateStatement(isParam, isParam ? obj.getAdvisorOrgUuid() : null,
            "organizations", "reports.advisorOrganizationUuid"));
    update.stmts.add(
        getCommonSubscriptionUpdateStatement(isParam, isParam ? obj.getInterlocutorOrgUuid() : null,
            "organizations", "reports.interlocutorOrganizationUuid"));
    // update tasks
    update.stmts.add(new SubscriptionUpdateStatement("tasks",
        "SELECT \"taskUuid\" FROM \"reportTasks\" WHERE \"reportUuid\" = "
            + paramOrJoin("reports.uuid", isParam),
        // param is already added above
        Collections.emptyMap()));
    // update location
    update.stmts.add(getCommonSubscriptionUpdateStatement(isParam,
        isParam ? obj.getLocationUuid() : null, "locations", "reports.locationUuid"));
    // update authorizationGroups
    update.stmts.add(new SubscriptionUpdateStatement("authorizationGroups",
        "SELECT \"authorizationGroupUuid\" FROM \"reportAuthorizationGroups\""
            + " WHERE \"reportUuid\" = " + paramOrJoin("reports.uuid", isParam),
        // param is already added above
        Collections.emptyMap()));

    return update;
  }

}
