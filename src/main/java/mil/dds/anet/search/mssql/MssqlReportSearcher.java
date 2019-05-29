package mil.dds.anet.search.mssql;

import java.util.Arrays;
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
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlReportSearcher extends AbstractSearcher implements IReportSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Report> runSearch(ReportSearchQuery query, Person user,
      boolean systemSearch) {
    final MssqlSearchQueryBuilder<Report, ReportSearchQuery> outerQb =
        new MssqlSearchQueryBuilder<Report, ReportSearchQuery>("MssqlReportSearch");
    final MssqlSearchQueryBuilder<Report, ReportSearchQuery> innerQb =
        new MssqlSearchQueryBuilder<Report, ReportSearchQuery>("MssqlReportSearch");
    innerQb.addSelectClause("DISTINCT " + ReportDao.REPORT_FIELDS);
    innerQb.addFromClause("reports");
    innerQb.addFromClause("LEFT JOIN reportTags ON reportTags.reportUuid = reports.uuid"
        + " LEFT JOIN tags ON reportTags.tagUuid = tags.uuid");

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
      // so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now.
      // See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      innerQb.addSelectClause("ISNULL(c_reports.rank, 0) + ISNULL(f_reports.rank, 0)"
          + " + ISNULL(c_tags.rank, 0) + ISNULL(f_tags.rank, 0) AS search_rank");
      innerQb.addFromClause(
          "LEFT JOIN CONTAINSTABLE (reports, (text, intent, keyOutcomes, nextSteps), :containsQuery) c_reports"
              + " ON reports.uuid = c_reports.[Key]"
              + " LEFT JOIN FREETEXTTABLE(reports, (text, intent, keyOutcomes, nextSteps), :freetextQuery) f_reports"
              + " ON reports.uuid = f_reports.[Key]");
      innerQb.addFromClause(
          "LEFT JOIN CONTAINSTABLE (tags, (name, description), :containsQuery) c_tags"
              + " ON tags.uuid = c_tags.[Key]"
              + " LEFT JOIN FREETEXTTABLE(tags, (name, description), :freetextQuery) f_tags"
              + " ON tags.uuid = f_tags.[Key]");
      innerQb.addWhereClause("(c_reports.rank IS NOT NULL OR f_reports.rank IS NOT NULL"
          + " OR c_tags.rank IS NOT NULL OR f_tags.rank IS NOT NULL)");
      final String text = query.getText();
      innerQb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
      innerQb.addSqlArg("freetextQuery", text);
    }

    innerQb.addEqualsClause("authorUuid", "reports.authorUuid", query.getAuthorUuid());
    innerQb.addDateClause("startDate", "reports.engagementDate", Comparison.AFTER,
        query.getEngagementDateStart());
    innerQb.addDateClause("endDate", "reports.engagementDate", Comparison.BEFORE,
        query.getEngagementDateEnd());
    innerQb.addDateClause("startCreatedAt", "reports.createdAt", Comparison.AFTER,
        query.getCreatedAtStart());
    innerQb.addDateClause("endCreatedAt", "reports.createdAt", Comparison.BEFORE,
        query.getCreatedAtEnd());
    innerQb.addDateClause("updatedAtStart", "reports.updatedAt", Comparison.AFTER,
        query.getUpdatedAtStart());
    innerQb.addDateClause("updatedAtEnd", "reports.updatedAt", Comparison.BEFORE,
        query.getUpdatedAtEnd());
    innerQb.addDateClause("releasedAtStart", "reports.releasedAt", Comparison.AFTER,
        query.getReleasedAtStart());
    innerQb.addDateClause("releasedAtEnd", "reports.releasedAt", Comparison.BEFORE,
        query.getReleasedAtEnd());

    if (query.getIncludeEngagementDayOfWeek()) {
      innerQb.addSelectClause("DATEPART(dw, reports.engagementDate) as engagementDayOfWeek");
    }
    if (query.getEngagementDayOfWeek() != null) {
      innerQb.addWhereClause("DATEPART(dw, reports.engagementDate) = :engagementDayOfWeek");
      innerQb.addSqlArg("engagementDayOfWeek", query.getEngagementDayOfWeek());
    }

    if (query.getAttendeeUuid() != null) {
      innerQb.addWhereClause(
          "reports.uuid IN (SELECT reportUuid from reportPeople where personUuid = :attendeeUuid)");
      innerQb.addSqlArg("attendeeUuid", query.getAttendeeUuid());
    }

    innerQb.addEqualsClause("atmosphere", "reports.atmosphere", query.getAtmosphere());

    if (query.getTaskUuid() != null) {
      if (Task.DUMMY_TASK_UUID.equals(query.getTaskUuid())) {
        innerQb.addWhereClause(
            "NOT EXISTS (SELECT taskUuid from reportTasks where reportUuid = reports.uuid)");
      } else {
        innerQb.addWhereClause(
            "reports.uuid IN (SELECT reportUuid from reportTasks where taskUuid = :taskUuid)");
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
            "(reports.advisorOrganizationUuid = :orgUuid OR reports.principalOrganizationUuid = :orgUuid)");
      } else {
        outerQb.addWithClause("parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        innerQb.addWhereClause("(reports.advisorOrganizationUuid IN (SELECT uuid from parent_orgs)"
            + " OR reports.principalOrganizationUuid IN (SELECT uuid from parent_orgs))");
      }
      innerQb.addSqlArg("orgUuid", query.getOrgUuid());
    }

    if (query.getAdvisorOrgUuid() != null) {
      if (Organization.DUMMY_ORG_UUID.equals(query.getAdvisorOrgUuid())) {
        innerQb.addWhereClause("reports.advisorOrganizationUuid IS NULL");
      } else if (!query.getIncludeAdvisorOrgChildren()) {
        innerQb.addEqualsClause("advisorOrganizationUuid", "reports.advisorOrganizationUuid",
            query.getAdvisorOrgUuid());
      } else {
        outerQb.addWithClause("advisor_parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :advisorOrgUuid UNION ALL"
            + " SELECT o.uuid from advisor_parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        innerQb.addWhereClause(
            "reports.advisorOrganizationUuid IN (SELECT uuid from advisor_parent_orgs)");
        innerQb.addSqlArg("advisorOrgUuid", query.getAdvisorOrgUuid());
      }
    }

    if (query.getPrincipalOrgUuid() != null) {
      if (Organization.DUMMY_ORG_UUID.equals(query.getPrincipalOrgUuid())) {
        innerQb.addWhereClause("reports.principalOrganizationUuid IS NULL");
      } else if (!query.getIncludePrincipalOrgChildren()) {
        innerQb.addEqualsClause("principalOrganizationUuid", "reports.principalOrganizationUuid",
            query.getPrincipalOrgUuid());
      } else {
        outerQb.addWithClause("principal_parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :principalOrgUuid UNION ALL"
            + " SELECT o.uuid from principal_parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        innerQb.addWhereClause(
            "reports.principalOrganizationUuid IN (SELECT uuid from principal_parent_orgs)");
        innerQb.addSqlArg("principalOrgUuid", query.getPrincipalOrgUuid());
      }
    }

    if (query.getLocationUuid() != null) {
      if (Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid())) {
        innerQb.addWhereClause("reports.locationUuid IS NULL");
      } else {
        innerQb.addEqualsClause("locationUuid", "reports.locationUuid", query.getLocationUuid());
      }
    }

    if (query.getPendingApprovalOf() != null) {
      innerQb.addWhereClause("reports.authorUuid != :approverUuid");
      innerQb.addWhereClause("reports.approvalStepUuid IN"
          + " (SELECT approvalStepUuid from approvers where positionUuid IN"
          + " (SELECT uuid FROM positions where currentPersonUuid = :approverUuid))");
      innerQb.addSqlArg("approverUuid", query.getPendingApprovalOf());
    }

    innerQb.addInClause("states", "reports.state", query.getState());

    if (query.getCancelledReason() != null) {
      if (ReportCancelledReason.NO_REASON_GIVEN.equals(query.getCancelledReason())) {
        innerQb.addWhereClause("reports.cancelledReason IS NULL");
      } else {
        innerQb.addEqualsClause("cancelledReason", "reports.cancelledReason",
            query.getCancelledReason());
      }
    }

    if (query.getTagUuid() != null) {
      innerQb.addWhereClause(
          "reports.uuid IN (SELECT reportUuid from reportTags where tagUuid = :tagUuid)");
      innerQb.addSqlArg("tagUuid", query.getTagUuid());
    }

    if (query.getAuthorPositionUuid() != null) {
      // Search for reports authored by people serving in that position at the report's creation
      // date
      innerQb.addWhereClause("reports.uuid IN (SELECT r.uuid FROM reports r " + PositionDao
          .generateCurrentPositionFilter("r.authorUuid", "r.createdAt", "authorPositionUuid")
          + ")");
      innerQb.addSqlArg("authorPositionUuid", query.getAuthorPositionUuid());
    }

    if (query.getAuthorizationGroupUuid() != null) {
      if (query.getAuthorizationGroupUuid().isEmpty()) {
        innerQb.addListArg("authorizationGroupUuids", Arrays.asList("-1"));
      } else {
        innerQb.addListArg("authorizationGroupUuids", query.getAuthorizationGroupUuid());
      }
      innerQb
          .addWhereClause("reports.uuid IN (SELECT ra.reportUuid FROM reportAuthorizationGroups ra"
              + " WHERE ra.authorizationGroupUuid IN ( <authorizationGroupUuids> ))");
    }

    if (query.getAttendeePositionUuid() != null) {
      // Search for reports attended by people serving in that position at the engagement date
      innerQb.addWhereClause("reports.uuid IN (SELECT r.uuid FROM reports r"
          + " JOIN reportPeople rp ON rp.reportUuid = r.uuid "
          + PositionDao.generateCurrentPositionFilter("rp.personUuid", "r.engagementDate",
              "attendeePositionUuid")
          + ")");
      innerQb.addSqlArg("attendeePositionUuid", query.getAttendeePositionUuid());
    }

    if (query.getSensitiveInfo()) {
      innerQb.addFromClause("LEFT JOIN reportAuthorizationGroups ra ON ra.reportUuid = reports.uuid"
          + " LEFT JOIN authorizationGroups ag ON ag.uuid = ra.authorizationGroupUuid"
          + " LEFT JOIN authorizationGroupPositions agp ON agp.authorizationGroupUuid = ag.uuid"
          + " LEFT JOIN positions pos ON pos.uuid = agp.positionUuid");
      innerQb.addWhereClause("pos.currentPersonUuid = :userUuid");
      innerQb.addSqlArg("userUuid", user.getUuid());
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
            "((reports.state != :draftState AND reports.state != :rejectedState) OR (reports.authorUuid = :userUuid))");
        innerQb.addSqlArg("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
        innerQb.addSqlArg("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
        innerQb.addSqlArg("userUuid", user.getUuid());
        if (AuthUtils.isAdmin(user) == false) {
          // Admin users may access all approved reports, other users only owned approved reports
          innerQb.addWhereClause(
              "((reports.state != :approvedState) OR (reports.authorUuid = :userUuid))");
          innerQb.addSqlArg("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
        }
      }
    }

    outerQb.addSelectClause("*");
    outerQb.addSelectClause("count(*) OVER() AS totalCount");
    outerQb.addFromClause("( " + innerQb.build() + " ) l");
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
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    // Beware of the sort field names, they have to match what's in the selected fields!
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), null, "reports_createdAt"));
        break;
      case RELEASED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), null, "reports_releasedAt"));
        break;
      case UPDATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), null, "reports_updatedAt"));
        break;
      case ENGAGEMENT_DATE:
      default:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), null, "reports_engagementDate"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, null, "reports_uuid"));
  }

}
