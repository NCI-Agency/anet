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
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.Query;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlReportSearcher extends AbstractMssqlSearcherBase<Report, ReportSearchQuery>
    implements IReportSearcher {

  public AnetBeanList<Report> runSearch(ReportSearchQuery query, Person user,
      boolean systemSearch) {
    start("MssqlReportSearch");
    selectClauses.add("DISTINCT " + ReportDao.REPORT_FIELDS);
    fromClauses.add("reports");
    fromClauses.add("LEFT JOIN reportTags ON reportTags.reportUuid = reports.uuid"
        + " LEFT JOIN tags ON reportTags.tagUuid = tags.uuid");

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
      // so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now.
      // See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      selectClauses.add("ISNULL(c_reports.rank, 0) + ISNULL(f_reports.rank, 0)"
          + " + ISNULL(c_tags.rank, 0) + ISNULL(f_tags.rank, 0) AS search_rank");
      fromClauses.add(
          "LEFT JOIN CONTAINSTABLE (reports, (text, intent, keyOutcomes, nextSteps), :containsQuery) c_reports"
              + " ON reports.uuid = c_reports.[Key]"
              + " LEFT JOIN FREETEXTTABLE(reports, (text, intent, keyOutcomes, nextSteps), :freetextQuery) f_reports"
              + " ON reports.uuid = f_reports.[Key]");
      fromClauses.add("LEFT JOIN CONTAINSTABLE (tags, (name, description), :containsQuery) c_tags"
          + " ON tags.uuid = c_tags.[Key]"
          + " LEFT JOIN FREETEXTTABLE(tags, (name, description), :freetextQuery) f_tags"
          + " ON tags.uuid = f_tags.[Key]");
      whereClauses.add("(c_reports.rank IS NOT NULL OR f_reports.rank IS NOT NULL"
          + " OR c_tags.rank IS NOT NULL OR f_tags.rank IS NOT NULL)");
      final String text = query.getText();
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
      sqlArgs.put("freetextQuery", text);
    }

    addEqualsClause("authorUuid", "reports.authorUuid", query.getAuthorUuid());
    addDateClause("startDate", "reports.engagementDate", Comparison.AFTER,
        query.getEngagementDateStart());
    addDateClause("endDate", "reports.engagementDate", Comparison.BEFORE,
        query.getEngagementDateEnd());
    addDateClause("startCreatedAt", "reports.createdAt", Comparison.AFTER,
        query.getCreatedAtStart());
    addDateClause("endCreatedAt", "reports.createdAt", Comparison.BEFORE, query.getCreatedAtEnd());
    addDateClause("updatedAtStart", "reports.updatedAt", Comparison.AFTER,
        query.getUpdatedAtStart());
    addDateClause("updatedAtEnd", "reports.updatedAt", Comparison.BEFORE, query.getUpdatedAtEnd());
    addDateClause("releasedAtStart", "reports.releasedAt", Comparison.AFTER,
        query.getReleasedAtStart());
    addDateClause("releasedAtEnd", "reports.releasedAt", Comparison.BEFORE,
        query.getReleasedAtEnd());

    if (query.getIncludeEngagementDayOfWeek()) {
      selectClauses.add("DATEPART(dw, reports.engagementDate) as engagementDayOfWeek");
    }
    if (query.getEngagementDayOfWeek() != null) {
      whereClauses.add("DATEPART(dw, reports.engagementDate) = :engagementDayOfWeek");
      sqlArgs.put("engagementDayOfWeek", query.getEngagementDayOfWeek());
    }

    if (query.getAttendeeUuid() != null) {
      whereClauses.add(
          "reports.uuid IN (SELECT reportUuid from reportPeople where personUuid = :attendeeUuid)");
      sqlArgs.put("attendeeUuid", query.getAttendeeUuid());
    }

    addEqualsClause("atmosphere", "reports.atmosphere", query.getAtmosphere());

    if (query.getTaskUuid() != null) {
      if (Task.DUMMY_TASK_UUID.equals(query.getTaskUuid())) {
        whereClauses
            .add("NOT EXISTS (SELECT taskUuid from reportTasks where reportUuid = reports.uuid)");
      } else {
        whereClauses
            .add("reports.uuid IN (SELECT reportUuid from reportTasks where taskUuid = :taskUuid)");
        sqlArgs.put("taskUuid", query.getTaskUuid());
      }
    }

    if (query.getOrgUuid() != null) {
      if (query.getAdvisorOrgUuid() != null || query.getPrincipalOrgUuid() != null) {
        throw new WebApplicationException(
            "Cannot combine orgUuid with principalOrgUuid or advisorOrgUuid parameters",
            Status.BAD_REQUEST);
      }
      if (!query.getIncludeOrgChildren()) {
        whereClauses.add(
            "(reports.advisorOrganizationUuid = :orgUuid OR reports.principalOrganizationUuid = :orgUuid)");
      } else {
        withClauses.add("parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        whereClauses.add("(reports.advisorOrganizationUuid IN (SELECT uuid from parent_orgs)"
            + " OR reports.principalOrganizationUuid IN (SELECT uuid from parent_orgs))");
      }
      sqlArgs.put("orgUuid", query.getOrgUuid());
    }

    if (query.getAdvisorOrgUuid() != null) {
      if (Organization.DUMMY_ORG_UUID.equals(query.getAdvisorOrgUuid())) {
        whereClauses.add("reports.advisorOrganizationUuid IS NULL");
      } else if (!query.getIncludeAdvisorOrgChildren()) {
        addEqualsClause("advisorOrganizationUuid", "reports.advisorOrganizationUuid",
            query.getAdvisorOrgUuid());
      } else {
        withClauses.add("advisor_parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :advisorOrgUuid UNION ALL"
            + " SELECT o.uuid from advisor_parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        whereClauses
            .add("reports.advisorOrganizationUuid IN (SELECT uuid from advisor_parent_orgs)");
        sqlArgs.put("advisorOrgUuid", query.getAdvisorOrgUuid());
      }
    }

    if (query.getPrincipalOrgUuid() != null) {
      if (Organization.DUMMY_ORG_UUID.equals(query.getPrincipalOrgUuid())) {
        whereClauses.add("reports.principalOrganizationUuid IS NULL");
      } else if (!query.getIncludePrincipalOrgChildren()) {
        addEqualsClause("principalOrganizationUuid", "reports.principalOrganizationUuid",
            query.getPrincipalOrgUuid());
      } else {
        withClauses.add("principal_parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :principalOrgUuid UNION ALL"
            + " SELECT o.uuid from principal_parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        whereClauses
            .add("reports.principalOrganizationUuid IN (SELECT uuid from principal_parent_orgs)");
        sqlArgs.put("principalOrgUuid", query.getPrincipalOrgUuid());
      }
    }

    if (query.getLocationUuid() != null) {
      if (Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid())) {
        whereClauses.add("reports.locationUuid IS NULL");
      } else {
        addEqualsClause("locationUuid", "reports.locationUuid", query.getLocationUuid());
      }
    }

    if (query.getPendingApprovalOf() != null) {
      whereClauses.add("reports.authorUuid != :approverUuid");
      whereClauses.add("reports.approvalStepUuid IN"
          + " (SELECT approvalStepUuid from approvers where positionUuid IN"
          + " (SELECT uuid FROM positions where currentPersonUuid = :approverUuid))");
      sqlArgs.put("approverUuid", query.getPendingApprovalOf());
    }

    addInClause("states", "reports.state", query.getState());

    if (query.getCancelledReason() != null) {
      if (ReportCancelledReason.NO_REASON_GIVEN.equals(query.getCancelledReason())) {
        whereClauses.add("reports.cancelledReason IS NULL");
      } else {
        addEqualsClause("cancelledReason", "reports.cancelledReason", query.getCancelledReason());
      }
    }

    if (query.getTagUuid() != null) {
      whereClauses
          .add("reports.uuid IN (SELECT reportUuid from reportTags where tagUuid = :tagUuid)");
      sqlArgs.put("tagUuid", query.getTagUuid());
    }

    if (query.getAuthorPositionUuid() != null) {
      // Search for reports authored by people serving in that position at the report's creation
      // date
      whereClauses.add("reports.uuid IN (SELECT r.uuid FROM reports r " + PositionDao
          .generateCurrentPositionFilter("r.authorUuid", "r.createdAt", "authorPositionUuid")
          + ")");
      sqlArgs.put("authorPositionUuid", query.getAuthorPositionUuid());
    }

    if (query.getAuthorizationGroupUuid() != null) {
      if (query.getAuthorizationGroupUuid().isEmpty()) {
        listArgs.put("authorizationGroupUuids", Arrays.asList("-1"));
      } else {
        listArgs.put("authorizationGroupUuids", query.getAuthorizationGroupUuid());
      }
      whereClauses.add("reports.uuid IN (SELECT ra.reportUuid FROM reportAuthorizationGroups ra"
          + " WHERE ra.authorizationGroupUuid IN ( <authorizationGroupUuids> ))");
    }

    if (query.getAttendeePositionUuid() != null) {
      // Search for reports attended by people serving in that position at the engagement date
      whereClauses.add("reports.uuid IN (SELECT r.uuid FROM reports r"
          + " JOIN reportPeople rp ON rp.reportUuid = r.uuid "
          + PositionDao.generateCurrentPositionFilter("rp.personUuid", "r.engagementDate",
              "attendeePositionUuid")
          + ")");
      sqlArgs.put("attendeePositionUuid", query.getAttendeePositionUuid());
    }

    if (query.getSensitiveInfo()) {
      fromClauses.add("LEFT JOIN reportAuthorizationGroups ra ON ra.reportUuid = reports.uuid"
          + " LEFT JOIN authorizationGroups ag ON ag.uuid = ra.authorizationGroupUuid"
          + " LEFT JOIN authorizationGroupPositions agp ON agp.authorizationGroupUuid = ag.uuid"
          + " LEFT JOIN positions pos ON pos.uuid = agp.positionUuid");
      whereClauses.add("pos.currentPersonUuid = :userUuid");
      sqlArgs.put("userUuid", user.getUuid());
    }

    if (!systemSearch) {
      // Apply a filter to restrict access to other's draft, rejected or approved reports.
      // When the search is performed by the system (for instance by a worker, systemSearch = true)
      // do not apply this filter.
      if (user == null) {
        whereClauses.add("reports.state != :draftState");
        whereClauses.add("reports.state != :rejectedState");
        whereClauses.add("reports.state != :approvedState");
        sqlArgs.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
        sqlArgs.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
        sqlArgs.put("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
      } else {
        whereClauses.add(
            "((reports.state != :draftState AND reports.state != :rejectedState) OR (reports.authorUuid = :userUuid))");
        sqlArgs.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
        sqlArgs.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
        sqlArgs.put("userUuid", user.getUuid());
        if (AuthUtils.isAdmin(user) == false) {
          // Admin users may access all approved reports, other users only owned approved reports
          whereClauses
              .add("((reports.state != :approvedState) OR (reports.authorUuid = :userUuid))");
          sqlArgs.put("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
        }
      }
    }

    finish(query);
    return getResult(query, new ReportMapper(), user);
  }

  @Override
  protected void finish(ReportSearchQuery query) {
    addWithClauses();
    sql.append("SELECT *, count(*) OVER() AS totalCount FROM (");
    addSelectClauses();
    addFromClauses();
    addWhereClauses();
    sql.append(") l");
    addOrderByClauses(query);
  }

  @Override
  protected void getOrderByClauses(ReportSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

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
        orderByClauses
            .addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports_engagementDate"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, null, "reports_uuid"));
  }

  @InTransaction
  protected AnetBeanList<Report> getResult(ReportSearchQuery query, ReportMapper mapper,
      Person user) {
    final Query sqlQuery =
        MssqlSearcher.addPagination(query, getDbHandle(), sql, sqlArgs, listArgs);
    return AnetBeanList.getReportList(user, sqlQuery, query.getPageNum(), query.getPageSize(),
        mapper);
  }

}
