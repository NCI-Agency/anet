package mil.dds.anet.search.sqlite;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
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
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.search.mssql.MssqlSearchQueryBuilder;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqliteReportSearcher extends AbstractSearcher implements IReportSearcher {

  private String isoDowFormat;
  private String isoDowComparison;

  public SqliteReportSearcher(String isoDowFormat) {
    this.isoDowFormat = isoDowFormat;
    this.isoDowComparison = "(" + this.isoDowFormat + ") = :%s";
  }

  public SqliteReportSearcher() {
    this("strftime('%%w', substr(reports.\"%s\", 1, 10)) + 1"); // %w day of week 0-6 with Sunday==0
  }

  @InTransaction
  @Override
  public AnetBeanList<Report> runSearch(ReportSearchQuery query, Person user,
      boolean systemSearch) {
    final MssqlSearchQueryBuilder<Report, ReportSearchQuery> outerQb =
        new MssqlSearchQueryBuilder<Report, ReportSearchQuery>("SqliteReportSearch");
    final MssqlSearchQueryBuilder<Report, ReportSearchQuery> innerQb =
        new MssqlSearchQueryBuilder<Report, ReportSearchQuery>("SqliteReportSearch");
    innerQb.addSelectClause("reports.uuid");
    innerQb.addFromClause("reports");
    innerQb
        .addFromClause("LEFT JOIN \"reportTags\" ON \"reportTags\".\"reportUuid\" = reports.uuid");
    innerQb.addFromClause("LEFT JOIN tags ON \"reportTags\".\"tagUuid\" = tags.uuid");

    if (query.isTextPresent()) {
      innerQb.addWhereClause("(text LIKE '%' || :text || '%' OR intent LIKE '%' || :text || '%'"
          + " OR \"keyOutcomes\" LIKE '%' || :text || '%'"
          + " OR \"nextSteps\" LIKE '%' || :text || '%' OR tags.name LIKE '%' || :text || '%'"
          + " OR tags.description LIKE '%' || :text || '%')");
      final String text = query.getText();
      innerQb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
    }

    innerQb.addEqualsClause("authorUuid", "reports.\"authorUuid\"", query.getAuthorUuid());
    innerQb.addDateClause("startDate", "reports.\"engagementDate\"", Comparison.AFTER,
        query.getEngagementDateStart());
    innerQb.addDateClause("endDate", "reports.\"engagementDate\"", Comparison.BEFORE,
        query.getEngagementDateEnd());
    innerQb.addDateClause("startCreatedAt", "reports.\"createdAt\"", Comparison.AFTER,
        query.getCreatedAtStart());
    innerQb.addDateClause("endCreatedAt", "reports.\"createdAt\"", Comparison.BEFORE,
        query.getCreatedAtEnd());
    innerQb.addDateClause("updatedAtStart", "reports.\"updatedAt\"", Comparison.AFTER,
        query.getUpdatedAtStart());
    innerQb.addDateClause("updatedAtEnd", "reports.\"updatedAt\"", Comparison.BEFORE,
        query.getUpdatedAtEnd());
    innerQb.addDateClause("releasedAtStart", "reports.\"releasedAt\"", Comparison.AFTER,
        query.getReleasedAtStart());
    innerQb.addDateClause("releasedAtEnd", "reports.\"releasedAt\"", Comparison.BEFORE,
        query.getReleasedAtEnd());

    if (query.getEngagementDayOfWeek() != null) {
      innerQb.addWhereClause(
          String.format(this.isoDowComparison, "engagementDate", "engagementDayOfWeek"));
      innerQb.addSqlArg("engagementDayOfWeek", query.getEngagementDayOfWeek());
    }

    if (query.getAttendeeUuid() != null) {
      innerQb.addWhereClause(
          "reports.uuid IN (SELECT \"reportUuid\" from \"reportPeople\" where \"personUuid\" = :attendeeUuid)");
      innerQb.addSqlArg("attendeeUuid", query.getAttendeeUuid());
    }

    if (query.getAuthorPositionUuid() != null) {
      // Search for reports authored by people serving in that position at the report's creation
      // date
      innerQb.addWhereClause("reports.uuid IN (SELECT r.uuid FROM reports r "
          + PositionDao.generateCurrentPositionFilter("r.\"authorUuid\"", "r.\"createdAt\"",
              "authorPositionUuid")
          + ")");
      innerQb.addSqlArg("authorPositionUuid", query.getAuthorPositionUuid());
    }

    if (query.getAttendeePositionUuid() != null) {
      // Search for reports attended by people serving in that position at the engagement date
      innerQb.addWhereClause("reports.uuid IN (SELECT r.uuid FROM reports r"
          + " JOIN \"reportPeople\" rp ON rp.\"reportUuid\" = r.uuid "
          + PositionDao.generateCurrentPositionFilter("rp.\"personUuid\"", "r.\"engagementDate\"",
              "attendeePositionUuid")
          + ")");
      innerQb.addSqlArg("attendeePositionUuid", query.getAttendeePositionUuid());
    }

    innerQb.addEqualsClause("atmosphere", "reports.atmosphere", query.getAtmosphere());

    if (query.getTaskUuid() != null) {
      if (Task.DUMMY_TASK_UUID.equals(query.getTaskUuid())) {
        innerQb.addWhereClause(
            "NOT EXISTS (SELECT \"taskUuid\" from \"reportTasks\" where \"reportUuid\" = reports.uuid)");
      } else {
        innerQb.addWhereClause(
            "reports.uuid IN (SELECT \"reportUuid\" from \"reportTasks\" where \"taskUuid\" = :taskUuid)");
        innerQb.addSqlArg("taskUuid", query.getTaskUuid());
      }
    }

    if (query.getOrgUuid() != null) {
      if (query.getAdvisorOrgUuid() != null || query.getPrincipalOrgUuid() != null) {
        throw new WebApplicationException(
            "Cannot combine orgUuid with principalOrgUuid or advisorOrgUuid parameters",
            Status.BAD_REQUEST);
      }
      if (!query.getIncludeOrgChildren()) {
        innerQb.addWhereClause(
            "(reports.\"advisorOrganizationUuid\" = :orgUuid OR reports.\"principalOrganizationUuid\" = :orgUuid)");
      } else {
        outerQb.addWithClause("RECURSIVE parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ")");
        innerQb
            .addWhereClause("(reports.\"advisorOrganizationUuid\" IN (SELECT uuid from parent_orgs)"
                + " OR reports.\"principalOrganizationUuid\" IN (SELECT uuid from parent_orgs))");
      }
      innerQb.addSqlArg("orgUuid", query.getOrgUuid());
    }

    if (query.getAdvisorOrgUuid() != null) {
      if (Organization.DUMMY_ORG_UUID.equals(query.getAdvisorOrgUuid())) {
        innerQb.addWhereClause("reports.\"advisorOrganizationUuid\" IS NULL");
      } else if (!query.getIncludeAdvisorOrgChildren()) {
        innerQb.addEqualsClause("advisorOrganizationUuid", "reports.\"advisorOrganizationUuid\"",
            query.getAdvisorOrgUuid());
      } else {
        outerQb.addWithClause("RECURSIVE advisor_parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :advisorOrgUuid UNION ALL"
            + " SELECT o.uuid from advisor_parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ")");
        innerQb.addWhereClause(
            "reports.\"advisorOrganizationUuid\" IN (SELECT uuid from advisor_parent_orgs)");
        innerQb.addSqlArg("advisorOrgUuid", query.getAdvisorOrgUuid());
      }
    }

    if (query.getPrincipalOrgUuid() != null) {
      if (Organization.DUMMY_ORG_UUID.equals(query.getPrincipalOrgUuid())) {
        innerQb.addWhereClause("reports.\"principalOrganizationUuid\" IS NULL");
      } else if (!query.getIncludePrincipalOrgChildren()) {
        innerQb.addEqualsClause("principalOrganizationUuid",
            "reports.\"principalOrganizationUuid\"", query.getPrincipalOrgUuid());
      } else {
        outerQb.addWithClause("RECURSIVE principal_parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :principalOrgUuid UNION ALL"
            + " SELECT o.uuid from principal_parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ")");
        innerQb.addWhereClause(
            "reports.\"principalOrganizationUuid\" IN (SELECT uuid from principal_parent_orgs)");
        innerQb.addSqlArg("principalOrgUuid", query.getPrincipalOrgUuid());
      }
    }

    if (query.getLocationUuid() != null) {
      if (Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid())) {
        innerQb.addWhereClause("reports.\"locationUuid\" IS NULL");
      } else {
        innerQb.addEqualsClause("locationUuid", "reports.\"locationUuid\"",
            query.getLocationUuid());
      }
    }

    if (query.getPendingApprovalOf() != null) {
      innerQb.addWhereClause("reports.\"authorUuid\" != :approverUuid");
      innerQb.addWhereClause("reports.\"approvalStepUuid\" IN"
          + " (SELECT \"approvalStepUuid\" from approvers where \"positionUuid\" IN"
          + " (SELECT uuid FROM positions where \"currentPersonUuid\" = :approverUuid))");
      innerQb.addSqlArg("approverUuid", query.getPendingApprovalOf());
    }

    innerQb.addInClause("states", "reports.state", query.getState());

    if (query.getCancelledReason() != null) {
      if (ReportCancelledReason.NO_REASON_GIVEN.equals(query.getCancelledReason())) {
        innerQb.addWhereClause("reports.\"cancelledReason\" IS NULL");
      } else {
        innerQb.addEqualsClause("cancelledReason", "reports.\"cancelledReason\"",
            query.getCancelledReason());
      }
    }

    if (!systemSearch) {
      // Apply a filter to restrict access to other's draft, rejected or approved reports.
      // When the search is performed by the system (for instance by a worker, systemSearch = true)
      // do not apply this filter.
      if (user == null) {
        innerQb.addWhereClause("reports.state != :draftState");
        innerQb.addWhereClause("reports.state != :rejectedState");
        innerQb.addWhereClause("reports.state != :approvedState");
        innerQb.addSqlArg("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
        innerQb.addSqlArg("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
        innerQb.addSqlArg("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
      } else {
        innerQb.addWhereClause(
            "((reports.state != :draftState AND reports.state != :rejectedState) OR (reports.\"authorUuid\" = :userUuid))");
        innerQb.addSqlArg("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
        innerQb.addSqlArg("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
        innerQb.addSqlArg("userUuid", user.getUuid());
        if (!AuthUtils.isAdmin(user)) {
          // Admin users may access all approved reports, other users only owned approved reports
          innerQb.addWhereClause(
              "((reports.state != :approvedState) OR (reports.\"authorUuid\" = :userUuid))");
          innerQb.addSqlArg("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
        }
      }
    }

    outerQb.addSelectClause("DISTINCT " + ReportDao.REPORT_FIELDS);
    if (query.getIncludeEngagementDayOfWeek()) {
      outerQb.addSelectClause(
          String.format(this.isoDowFormat, "engagementDate") + " AS engagementDayOfWeek");
    }
    outerQb.addFromClause("reports");
    outerQb.addSelectClause("reports.uuid IN ( " + innerQb.build() + " )");
    outerQb.addSqlArgs(innerQb.getSqlArgs());
    outerQb.addListArgs(innerQb.getListArgs());
    addOrderByClauses(outerQb, query);
    final AnetBeanList<Report> result =
        outerQb.buildAndRun(getDbHandle(), query, new ReportMapper());
    for (final Report report : result.getList()) {
      report.setUser(user);
    }
    return result;
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, ReportSearchQuery query) {
    switch (query.getSortBy()) {
      case ENGAGEMENT_DATE:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), null, "reports.\"engagementDate\""));
        break;
      case RELEASED_AT:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), null, "reports.\"releasedAt\""));
        break;
      case UPDATED_AT:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), null, "reports.\"releasedAt\""));
        break;
      case CREATED_AT:
      default:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), null, "reports.\"updatedAt\""));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, null, "uuid"));
  }

}
