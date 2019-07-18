package mil.dds.anet.search;

import java.util.Arrays;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
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
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractReportSearcher extends AbstractSearcher<Report, ReportSearchQuery>
    implements IReportSearcher {

  public AbstractReportSearcher(AbstractSearchQueryBuilder<Report, ReportSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  public AnetBeanList<Report> runSearch(
      AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb, ReportSearchQuery query) {
    buildQuery(query);
    outerQb.addSelectClause("*");
    outerQb.addTotalCount();
    outerQb.addFromClause("( " + qb.build() + " ) l");
    outerQb.addSqlArgs(qb.getSqlArgs());
    outerQb.addListArgs(qb.getListArgs());
    addOrderByClauses(outerQb, query);
    final AnetBeanList<Report> result =
        outerQb.buildAndRun(getDbHandle(), query, new ReportMapper());
    for (final Report report : result.getList()) {
      report.setUser(query.getUser());
    }
    return result;
  }

  @Override
  protected void buildQuery(ReportSearchQuery query) {
    qb.addSelectClause("DISTINCT " + ReportDao.REPORT_FIELDS);
    qb.addFromClause("reports");
    qb.addFromClause("LEFT JOIN \"reportTags\" ON \"reportTags\".\"reportUuid\" = reports.uuid");
    qb.addFromClause("LEFT JOIN tags ON \"reportTags\".\"tagUuid\" = tags.uuid");

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      qb.addM2mBatchClause(query.getBatchParams());
    }

    qb.addEqualsClause("authorUuid", "reports.\"authorUuid\"", query.getAuthorUuid());
    qb.addDateClause("startDate", "reports.\"engagementDate\"", Comparison.AFTER,
        query.getEngagementDateStart());
    qb.addDateClause("endDate", "reports.\"engagementDate\"", Comparison.BEFORE,
        query.getEngagementDateEnd());
    qb.addDateClause("startCreatedAt", "reports.\"createdAt\"", Comparison.AFTER,
        query.getCreatedAtStart());
    qb.addDateClause("endCreatedAt", "reports.\"createdAt\"", Comparison.BEFORE,
        query.getCreatedAtEnd());
    qb.addDateClause("updatedAtStart", "reports.\"updatedAt\"", Comparison.AFTER,
        query.getUpdatedAtStart());
    qb.addDateClause("updatedAtEnd", "reports.\"updatedAt\"", Comparison.BEFORE,
        query.getUpdatedAtEnd());
    qb.addDateClause("releasedAtStart", "reports.\"releasedAt\"", Comparison.AFTER,
        query.getReleasedAtStart());
    qb.addDateClause("releasedAtEnd", "reports.\"releasedAt\"", Comparison.BEFORE,
        query.getReleasedAtEnd());

    if (query.getIncludeEngagementDayOfWeek()) {
      addIncludeEngagementDayOfWeekQuery(query);
    }

    if (query.getEngagementDayOfWeek() != null) {
      addEngagementDayOfWeekQuery(query);
    }

    if (query.getAttendeeUuid() != null) {
      qb.addWhereClause(
          "reports.uuid IN (SELECT \"reportUuid\" FROM \"reportPeople\" WHERE \"personUuid\" = :attendeeUuid)");
      qb.addSqlArg("attendeeUuid", query.getAttendeeUuid());
    }

    qb.addEqualsClause("atmosphere", "reports.atmosphere", query.getAtmosphere());

    if (query.getTaskUuid() != null) {
      if (Task.DUMMY_TASK_UUID.equals(query.getTaskUuid())) {
        qb.addWhereClause(
            "NOT EXISTS (SELECT \"taskUuid\" FROM \"reportTasks\" WHERE \"reportUuid\" = reports.uuid)");
      } else {
        qb.addWhereClause(
            "reports.uuid IN (SELECT \"reportUuid\" FROM \"reportTasks\" WHERE \"taskUuid\" = :taskUuid)");
        qb.addSqlArg("taskUuid", query.getTaskUuid());
      }
    }

    if (query.getOrgUuid() != null) {
      if (query.getAdvisorOrgUuid() != null || query.getPrincipalOrgUuid() != null) {
        throw new WebApplicationException(
            "Cannot combine orgUuid with principalOrgUuid or advisorOrgUuid parameters",
            Status.BAD_REQUEST);
      }
      addOrgUuidQuery(query);
    }

    if (query.getAdvisorOrgUuid() != null) {
      addAdvisorOrgUuidQuery(query);
    }

    if (query.getPrincipalOrgUuid() != null) {
      addPrincipalOrgUuidQuery(query);
    }

    if (query.getLocationUuid() != null) {
      if (Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid())) {
        qb.addWhereClause("reports.\"locationUuid\" IS NULL");
      } else {
        qb.addEqualsClause("locationUuid", "reports.\"locationUuid\"", query.getLocationUuid());
      }
    }

    if (query.getPendingApprovalOf() != null) {
      qb.addWhereClause("reports.\"authorUuid\" != :approverUuid");
      qb.addWhereClause("reports.\"approvalStepUuid\" IN"
          + " (SELECT \"approvalStepUuid\" FROM approvers WHERE \"positionUuid\" IN"
          + " (SELECT uuid FROM positions WHERE \"currentPersonUuid\" = :approverUuid))");
      qb.addSqlArg("approverUuid", query.getPendingApprovalOf());
    }

    qb.addInClause("states", "reports.state", query.getState());

    if (query.getCancelledReason() != null) {
      if (ReportCancelledReason.NO_REASON_GIVEN.equals(query.getCancelledReason())) {
        qb.addWhereClause("reports.\"cancelledReason\" IS NULL");
      } else {
        qb.addEqualsClause("cancelledReason", "reports.\"cancelledReason\"",
            query.getCancelledReason());
      }
    }

    if (query.getTagUuid() != null) {
      qb.addWhereClause(
          "reports.uuid IN (SELECT \"reportUuid\" FROM \"reportTags\" WHERE \"tagUuid\" = :tagUuid)");
      qb.addSqlArg("tagUuid", query.getTagUuid());
    }

    if (query.getAuthorPositionUuid() != null) {
      // Search for reports authored by people serving in that position at the report's creation
      // date
      qb.addWhereClause("reports.uuid IN (SELECT r.uuid FROM reports r "
          + PositionDao.generateCurrentPositionFilter("r.\"authorUuid\"", "r.\"createdAt\"",
              "authorPositionUuid")
          + ")");
      qb.addSqlArg("authorPositionUuid", query.getAuthorPositionUuid());
    }

    if (query.getAuthorizationGroupUuid() != null) {
      if (query.getAuthorizationGroupUuid().isEmpty()) {
        qb.addListArg("authorizationGroupUuids", Arrays.asList("-1"));
      } else {
        qb.addListArg("authorizationGroupUuids", query.getAuthorizationGroupUuid());
      }
      qb.addWhereClause(
          "reports.uuid IN (SELECT ra.\"reportUuid\" FROM \"reportAuthorizationGroups\" ra"
              + " WHERE ra.\"authorizationGroupUuid\" IN ( <authorizationGroupUuids> ))");
    }

    if (query.getAttendeePositionUuid() != null) {
      // Search for reports attended by people serving in that position at the engagement date
      qb.addWhereClause("reports.uuid IN (SELECT r.uuid FROM reports r"
          + " JOIN \"reportPeople\" rp ON rp.\"reportUuid\" = r.uuid "
          + PositionDao.generateCurrentPositionFilter("rp.\"personUuid\"", "r.\"engagementDate\"",
              "attendeePositionUuid")
          + ")");
      qb.addSqlArg("attendeePositionUuid", query.getAttendeePositionUuid());
    }

    if (query.getSensitiveInfo()) {
      qb.addFromClause(
          "LEFT JOIN \"reportAuthorizationGroups\" ra ON ra.\"reportUuid\" = reports.uuid"
              + " LEFT JOIN \"authorizationGroups\" ag ON ag.uuid = ra.\"authorizationGroupUuid\""
              + " LEFT JOIN \"authorizationGroupPositions\" agp ON agp.\"authorizationGroupUuid\" = ag.uuid"
              + " LEFT JOIN positions pos ON pos.uuid = agp.\"positionUuid\"");
      qb.addWhereClause("pos.\"currentPersonUuid\" = :userUuid");
      qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
    }

    if (!query.isSystemSearch()) {
      // Apply a filter to restrict access to other's draft, rejected or approved reports.
      // When the search is performed by the system (for instance by a worker, systemSearch = true)
      // do not apply this filter.
      if (query.getUser() == null) {
        qb.addWhereClause("reports.state != :draftState");
        qb.addWhereClause("reports.state != :rejectedState");
        qb.addWhereClause("reports.state != :approvedState");
        qb.addSqlArg("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
        qb.addSqlArg("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
        qb.addSqlArg("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
      } else {
        qb.addWhereClause(
            "((reports.state != :draftState AND reports.state != :rejectedState) OR (reports.\"authorUuid\" = :userUuid))");
        qb.addSqlArg("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
        qb.addSqlArg("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
        qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
        if (!AuthUtils.isAdmin(query.getUser())) {
          // Admin users may access all approved reports, other users only owned approved reports
          qb.addWhereClause(
              "((reports.state != :approvedState) OR (reports.\"authorUuid\" = :userUuid))");
          qb.addSqlArg("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
        }
      }
    }

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(ReportSearchQuery query);

  protected abstract void addIncludeEngagementDayOfWeekQuery(ReportSearchQuery query);

  protected abstract void addEngagementDayOfWeekQuery(ReportSearchQuery query);

  protected abstract void addOrgUuidQuery(ReportSearchQuery query);

  protected void addOrgUuidQuery(AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb,
      ReportSearchQuery query) {
    if (!query.getIncludeOrgChildren()) {
      qb.addWhereClause(
          "(reports.\"advisorOrganizationUuid\" = :orgUuid OR reports.\"principalOrganizationUuid\" = :orgUuid)");
    } else {
      outerQb.addWithClause("parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
          + " SELECT o.uuid FROM parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
          + ")");
      qb.addWhereClause("(reports.\"advisorOrganizationUuid\" IN (SELECT uuid FROM parent_orgs)"
          + " OR reports.\"principalOrganizationUuid\" IN (SELECT uuid FROM parent_orgs))");
    }
    qb.addSqlArg("orgUuid", query.getOrgUuid());
  }

  protected abstract void addAdvisorOrgUuidQuery(ReportSearchQuery query);

  protected void addAdvisorOrgUuidQuery(
      AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb, ReportSearchQuery query) {
    if (Organization.DUMMY_ORG_UUID.equals(query.getAdvisorOrgUuid())) {
      qb.addWhereClause("reports.\"advisorOrganizationUuid\" IS NULL");
    } else if (!query.getIncludeAdvisorOrgChildren()) {
      qb.addEqualsClause("advisorOrganizationUuid", "reports.\"advisorOrganizationUuid\"",
          query.getAdvisorOrgUuid());
    } else {
      outerQb.addWithClause("advisor_parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :advisorOrgUuid UNION ALL"
          + " SELECT o.uuid FROM advisor_parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
          + ")");
      qb.addWhereClause(
          "reports.\"advisorOrganizationUuid\" IN (SELECT uuid FROM advisor_parent_orgs)");
      qb.addSqlArg("advisorOrgUuid", query.getAdvisorOrgUuid());
    }
  }

  protected abstract void addPrincipalOrgUuidQuery(ReportSearchQuery query);

  protected void addPrincipalOrgUuidQuery(
      AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb, ReportSearchQuery query) {
    if (Organization.DUMMY_ORG_UUID.equals(query.getPrincipalOrgUuid())) {
      qb.addWhereClause("reports.\"principalOrganizationUuid\" IS NULL");
    } else if (!query.getIncludePrincipalOrgChildren()) {
      qb.addEqualsClause("principalOrganizationUuid", "reports.\"principalOrganizationUuid\"",
          query.getPrincipalOrgUuid());
    } else {
      outerQb.addWithClause("principal_parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :principalOrgUuid UNION ALL"
          + " SELECT o.uuid FROM principal_parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
          + ")");
      qb.addWhereClause(
          "reports.\"principalOrganizationUuid\" IN (SELECT uuid FROM principal_parent_orgs)");
      qb.addSqlArg("principalOrgUuid", query.getPrincipalOrgUuid());
    }
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, ReportSearchQuery query) {
    // Beware of the sort field names, they have to match what's in the selected fields of the inner
    // query!
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), null, "\"reports_createdAt\""));
        break;
      case RELEASED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), null, "\"reports_releasedAt\""));
        break;
      case UPDATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), null, "\"reports_updatedAt\""));
        break;
      case ENGAGEMENT_DATE:
      default:
        qb.addAllOrderByClauses(
            getOrderBy(query.getSortOrder(), null, "\"reports_engagementDate\""));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, null, "reports_uuid"));
  }

}
