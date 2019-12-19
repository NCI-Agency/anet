package mil.dds.anet.search;

import com.google.common.base.Joiner;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery.EngagementStatus;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
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
    return outerQb.buildAndRun(getDbHandle(), query, new ReportMapper());
  }

  protected void buildQuery(ReportSearchQuery query) {
    qb.addSelectClause("DISTINCT " + ReportDao.REPORT_FIELDS);
    qb.addFromClause("reports");
    qb.addFromClause("LEFT JOIN \"reportTags\" ON \"reportTags\".\"reportUuid\" = reports.uuid");
    qb.addFromClause("LEFT JOIN tags ON \"reportTags\".\"tagUuid\" = tags.uuid");

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      addBatchClause(query);
    }

    qb.addEqualsClause("authorUuid", "reports.\"authorUuid\"", query.getAuthorUuid());
    qb.addDateRangeClause("startDate", "reports.\"engagementDate\"", Comparison.AFTER,
        query.getEngagementDateStart(), "endDate", "reports.\"engagementDate\"", Comparison.BEFORE,
        query.getEngagementDateEnd());
    qb.addDateRangeClause("startCreatedAt", "reports.\"createdAt\"", Comparison.AFTER,
        query.getCreatedAtStart(), "endCreatedAt", "reports.\"createdAt\"", Comparison.BEFORE,
        query.getCreatedAtEnd());
    qb.addDateRangeClause("updatedAtStart", "reports.\"updatedAt\"", Comparison.AFTER,
        query.getUpdatedAtStart(), "updatedAtEnd", "reports.\"updatedAt\"", Comparison.BEFORE,
        query.getUpdatedAtEnd());
    qb.addDateRangeClause("releasedAtStart", "reports.\"releasedAt\"", Comparison.AFTER,
        query.getReleasedAtStart(), "releasedAtEnd", "reports.\"releasedAt\"", Comparison.BEFORE,
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

    if (query.getEngagementStatus() != null) {
      final List<String> engagementStatusClauses = new ArrayList<>();
      List<EngagementStatus> esValues = query.getEngagementStatus();
      esValues.stream().forEach(es -> {
        switch (es) {
          case HAPPENED:
            engagementStatusClauses.add(" reports.\"engagementDate\" <= :endOfHappened");
            DaoUtils.addInstantAsLocalDateTime(qb.sqlArgs, "endOfHappened", Utils.endOfToday());
            break;
          case FUTURE:
            engagementStatusClauses.add(" reports.\"engagementDate\" > :startOfFuture");
            DaoUtils.addInstantAsLocalDateTime(qb.sqlArgs, "startOfFuture", Utils.endOfToday());
            break;
          case CANCELLED:
            engagementStatusClauses.add(" reports.state = :cancelledState");
            qb.addSqlArg("cancelledState", DaoUtils.getEnumId(ReportState.CANCELLED));
            break;
          default:
            // ignore this one
            break;
        }
      });
      qb.addWhereClause("(" + Joiner.on(" OR ").join(engagementStatusClauses) + ")");
    }

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
      }
    }

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(ReportSearchQuery query);

  protected abstract void addBatchClause(ReportSearchQuery query);

  @SuppressWarnings("unchecked")
  protected void addBatchClause(AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb,
      ReportSearchQuery query) {
    qb.addBatchClause((AbstractBatchParams<Report, ReportSearchQuery>) query.getBatchParams(),
        outerQb);
  }

  protected abstract void addIncludeEngagementDayOfWeekQuery(ReportSearchQuery query);

  protected abstract void addEngagementDayOfWeekQuery(ReportSearchQuery query);

  protected abstract void addOrgUuidQuery(ReportSearchQuery query);

  protected void addOrgUuidQuery(AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb,
      ReportSearchQuery query) {
    if (!query.getIncludeOrgChildren()) {
      qb.addWhereClause(
          "(reports.\"advisorOrganizationUuid\" = :orgUuid OR reports.\"principalOrganizationUuid\" = :orgUuid)");
      qb.addSqlArg("orgUuid", query.getOrgUuid());
    } else {
      qb.addRecursiveClause(outerQb, "reports",
          new String[] {"\"advisorOrganizationUuid\"", "\"principalOrganizationUuid\""},
          "parent_orgs", "organizations", "\"parentOrgUuid\"", "orgUuid", query.getOrgUuid());
    }
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
      qb.addRecursiveClause(outerQb, "reports", "\"advisorOrganizationUuid\"",
          "advisor_parent_orgs", "organizations", "\"parentOrgUuid\"", "advisorOrganizationUuid",
          query.getAdvisorOrgUuid());
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
      qb.addRecursiveClause(outerQb, "reports", "\"principalOrganizationUuid\"",
          "principal_parent_orgs", "organizations", "\"parentOrgUuid\"",
          "principalOrganizationUuid", query.getPrincipalOrgUuid());
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
