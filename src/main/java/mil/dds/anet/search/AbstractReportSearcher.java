package mil.dds.anet.search;

import com.google.common.base.Joiner;
import com.google.common.collect.Sets;
import graphql.GraphQLContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.EngagementStatus;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public abstract class AbstractReportSearcher extends AbstractSearcher<Report, ReportSearchQuery>
    implements IReportSearcher {

  private static final Set<String> ALL_FIELDS = Sets.newHashSet(ReportDao.allFields);
  private static final Set<String> MINIMAL_FIELDS = Sets.newHashSet(ReportDao.minimalFields);
  private static final Map<String, String> FIELD_MAPPING = Map.of("reportText", "text", // -
      "location", "locationUuid", // -
      "approvalStep", "approvalStepUuid", // -
      "advisorOrg", "advisorOrganizationUuid", // -
      "interlocutorOrg", "interlocutorOrganizationUuid", // -
      "event", "eventUuid");

  protected AbstractReportSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<Report, ReportSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  protected ReportSearchQuery getQueryForPostProcessing(ReportSearchQuery query) {
    if (query.getPendingApprovalOf() == null) {
      return query;
    }
    try {
      final ReportSearchQuery modifiedQuery = query.clone();
      // pagination will be done after post-processing
      modifiedQuery.setPageSize(0);
      return modifiedQuery;
    } catch (CloneNotSupportedException e) {
      return query; // what else can we do?
    }
  }

  protected CompletableFuture<AnetBeanList<Report>> postProcessResults(GraphQLContext context,
      ReportSearchQuery query, AnetBeanList<Report> result) {
    if (query.getPendingApprovalOf() == null) {
      return CompletableFuture.completedFuture(result);
    }
    // Post-process results to filter out the reports that can't be approved
    final List<Report> list = result.getList();
    @SuppressWarnings({"unchecked"})
    final CompletableFuture<Boolean>[] allReports = (CompletableFuture<Boolean>[]) list.stream()
        .map(r -> (r.getApprovalStepUuid() == null || r.getAdvisorOrgUuid() == null)
            ? CompletableFuture.completedFuture(false)
            : engine().canUserApproveStep(context, query.getPendingApprovalOf(),
                r.getApprovalStepUuid(), r.getAdvisorOrgUuid()))
        .toArray(CompletableFuture<?>[]::new);
    return CompletableFuture.allOf(allReports).thenCompose(v -> {
      final Iterator<Report> iterator = list.iterator();
      for (final CompletableFuture<Boolean> cf : allReports) {
        iterator.next();
        if (!cf.join()) {
          iterator.remove();
        }
      }
      final int totalCount = list.size();
      final int pageNum = query.getPageNum();
      final int pageSize = query.getPageSize();
      result.setTotalCount(totalCount);
      result.setPageNum(pageNum);
      result.setPageSize(pageSize);
      if (pageSize > 0) {
        // Do pagination
        final int fromIndex = pageNum * pageSize;
        final int toIndex = Math.min(totalCount, fromIndex + pageSize);
        if (fromIndex >= totalCount || fromIndex > toIndex) {
          result.setList(Collections.emptyList());
        } else {
          result.setList(list.subList(fromIndex, toIndex));
        }
      }
      return CompletableFuture.completedFuture(result);
    });
  }

  @Override
  protected void buildQuery(ReportSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected String getTableFields(Set<String> subFields) {
    return getTableFields(ReportDao.TABLE_NAME, ALL_FIELDS, MINIMAL_FIELDS, FIELD_MAPPING,
        subFields);
  }

  protected void buildQuery(Set<String> subFields, ReportSearchQuery query) {
    // Base select and from clauses are added by child classes

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      addBatchClause(query);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          engine().getReportDao().getSubscriptionUpdate(null)));
    }

    // We do not store status in reports as we consider them all ACTIVE. Hence, we want to return
    // no results when querying for INACTIVE reports
    if (query.getStatus() == WithStatus.Status.INACTIVE) {
      qb.addWhereClause("0 = 1");
    }

    if (query.getAuthorUuid() != null) {
      qb.addWhereClause("reports.uuid IN (SELECT \"reportUuid\" FROM \"reportPeople\""
          + " WHERE \"isAuthor\" = :isAuthor AND \"personUuid\" = :authorUuid)");
      qb.addSqlArg("isAuthor", true);
      qb.addSqlArg("authorUuid", query.getAuthorUuid());
    }
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
      addIncludeEngagementDayOfWeekSelect();
    }

    if (query.getEngagementDayOfWeek() != null) {
      addEngagementDayOfWeekQuery(query);
    }

    if (query.getAttendeeUuid() != null) {
      qb.addWhereClause("reports.uuid IN (SELECT \"reportUuid\" FROM \"reportPeople\""
          + " WHERE \"personUuid\" = :attendeeUuid and \"isAttendee\" = :isAttendee)");
      qb.addSqlArg("isAttendee", true);
      qb.addSqlArg("attendeeUuid", query.getAttendeeUuid());
    }

    qb.addEnumEqualsClause("atmosphere", "reports.atmosphere", query.getAtmosphere());

    if (!Utils.isEmptyOrNull(query.getTaskUuid())) {
      addTaskUuidQuery(query);
    }

    if (!Utils.isEmptyOrNull(query.getOrgUuid())) {
      addOrgUuidQuery(query);
    }

    if (!Utils.isEmptyOrNull(query.getLocationUuid())) {
      addLocationUuidQuery(query);
    }

    if (!Utils.isEmptyOrNull(query.getEventUuid())) {
      qb.addWhereClause("reports.\"eventUuid\" = :eventUuid");
      qb.addSqlArg("eventUuid", query.getEventUuid());
    }

    if (query.getPendingApprovalOf() != null) {
      qb.addWhereClause("reports.\"approvalStepUuid\" IN"
          + " (SELECT \"approvalStepUuid\" FROM approvers WHERE \"positionUuid\" IN"
          + " (SELECT uuid FROM positions WHERE \"currentPersonUuid\" = :approverUuid))");
      qb.addSqlArg("approverUuid", query.getPendingApprovalOf());
    }

    if (Utils.isEmptyOrNull(query.getState()) && query.getPendingApprovalOf() == null) {
      // When not otherwise specified, restrict search to specific report states
      final List<ReportState> reportStates;
      if (Utils.isEmptyOrNull(query.getEngagementStatus())) {
        // approved or published
        reportStates = List.of(ReportState.APPROVED, ReportState.PUBLISHED);
      } else {
        // approved, published or cancelled
        reportStates = List.of(ReportState.APPROVED, ReportState.PUBLISHED, ReportState.CANCELLED);
      }
      qb.addInClause("states", "reports.state", reportStates);
    } else {
      // search for the states specified in the query
      qb.addInClause("states", "reports.state", query.getState());
    }

    if (query.getEngagementStatus() != null) {
      final List<String> engagementStatusClauses = new ArrayList<>();
      List<EngagementStatus> esValues = query.getEngagementStatus();
      esValues.forEach(es -> {
        switch (es) {
          case HAPPENED:
            engagementStatusClauses.add(" reports.\"engagementDate\" <= :endOfHappened");
            DaoUtils.addInstantAsLocalDateTime(qb.sqlArgs, "endOfHappened", Instant.now());
            break;
          case FUTURE:
            engagementStatusClauses.add(" reports.\"engagementDate\" > :startOfFuture");
            DaoUtils.addInstantAsLocalDateTime(qb.sqlArgs, "startOfFuture", Instant.now());
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
        qb.addEnumEqualsClause("cancelledReason", "reports.\"cancelledReason\"",
            query.getCancelledReason());
      }
    }

    if (query.getAuthorPositionUuid() != null) {
      // Search for reports authored by people serving in that position at the report's creation
      // date
      qb.addWhereClause("reports.uuid IN (SELECT r.uuid FROM reports r"
          + " JOIN \"reportPeople\" rp ON rp.\"reportUuid\" = r.uuid "
          + PositionDao.generatePositionFilterAtDate("rp.\"personUuid\"", "r.\"createdAt\"",
              "authorPositionUuid")
          + " AND rp.\"isAuthor\" = :isAuthor)");
      qb.addSqlArg("isAuthor", true);
      qb.addSqlArg("authorPositionUuid", query.getAuthorPositionUuid());
    }

    if (query.getAuthorizationGroupUuid() != null) {
      if (query.getAuthorizationGroupUuid().isEmpty()) {
        qb.addListArg("authorizationGroupUuids", Arrays.asList("-1"));
      } else {
        qb.addListArg("authorizationGroupUuids", query.getAuthorizationGroupUuid());
      }
      qb.addWhereClause(
          "reports.uuid IN (SELECT ram.\"reportUuid\" FROM \"reportAuthorizedMembers\" ram"
              + " WHERE ram.\"relatedObjectType\" = '" + AuthorizationGroupDao.TABLE_NAME + "'"
              + " AND ram.\"relatedObjectUuid\" IN ( <authorizationGroupUuids> ))");
    }

    if (query.getAttendeePositionUuid() != null) {
      // Search for reports attended by people serving in that position at the engagement date
      qb.addWhereClause(
          "reports.uuid IN (SELECT r.uuid FROM reports r"
              + " JOIN \"reportPeople\" rp ON rp.\"reportUuid\" = r.uuid "
              + PositionDao.generatePositionFilterAtDate("rp.\"personUuid\"",
                  "r.\"engagementDate\"", "attendeePositionUuid")
              + " AND rp.\"isAttendee\" = :isAttendee)");
      qb.addSqlArg("isAttendee", true);
      qb.addSqlArg("attendeePositionUuid", query.getAttendeePositionUuid());
    }

    if (query.getSensitiveInfo()) {
      qb.addWhereClause(
          "reports.uuid IN (SELECT \"reportUuid\" FROM \"reportsSensitiveInformation\")");
      final String isAuthorParam = "isAuthorForSensitiveInfo";
      final String relatedObjectParam = "personUuidForSensitiveInfo";
      qb.addWhereClause(DaoUtils.getReportsWhenAuthorized(isAuthorParam, relatedObjectParam));
      qb.addSqlArg(isAuthorParam, true);
      qb.addSqlArg(relatedObjectParam, DaoUtils.getUuid(query.getUser()));
    }

    if (query.getClassification() != null) {
      if ("".equals(query.getClassification())) {
        qb.addIsNullOrEmptyClause("reports.classification");
      } else {
        qb.addStringEqualsClause("classification", "reports.classification",
            query.getClassification());
      }
    }

    if (!query.isSystemSearch() && (!AuthUtils.isAdmin(query.getUser())
        || !Boolean.TRUE.equals(query.getIncludeAllDrafts()))) {
      // Apply a filter to restrict access to other's draft or rejected reports.
      // When the search is performed by the system (for instance by a worker, systemSearch = true),
      // do not apply this filter.
      // Admins see all drafts/rejected when "include all drafts" is true,
      // else admins and other users only ever see their own drafts/rejected (and all other reports)
      qb.addWhereClause("((reports.state != :draftState AND reports.state != :rejectedState) OR ("
          + "reports.uuid IN (SELECT \"reportUuid\" FROM \"reportPeople\""
          + " WHERE \"isAuthor\" = :isAuthor AND \"personUuid\" = :userUuid)))");
      qb.addSqlArg("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
      qb.addSqlArg("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
      qb.addSqlArg("isAuthor", true);
      qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
    }

    if (query.getEmailNetwork() != null) {
      // Should never match
      qb.addWhereClause("FALSE");
    }

    addOrderByClauses(qb, query);
  }

  protected abstract void addBatchClause(ReportSearchQuery query);

  @SuppressWarnings("unchecked")
  protected void addBatchClause(AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb,
      ReportSearchQuery query) {
    qb.addBatchClause((AbstractBatchParams<Report, ReportSearchQuery>) query.getBatchParams(),
        outerQb);
  }

  protected abstract void addIncludeEngagementDayOfWeekSelect();

  protected abstract void addEngagementDayOfWeekQuery(ReportSearchQuery query);

  protected abstract void addTaskUuidQuery(ReportSearchQuery query);

  protected void addTaskUuidQuery(AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb,
      ReportSearchQuery query) {
    qb.addFromClause("INNER JOIN \"reportTasks\" rt ON rt.\"reportUuid\" = reports.uuid");
    if (query.getTaskUuid().size() == 1
        && Task.DUMMY_TASK_UUID.equals(query.getTaskUuid().get(0))) {
      qb.addWhereClause("rt.\"taskUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(outerQb, "rt", "\"taskUuid\"", "parent_tasks", "tasks",
          "\"parentTaskUuid\"", "parentTaskUuid", query.getTaskUuid(), true);
    }
  }

  protected abstract void addOrgUuidQuery(ReportSearchQuery query);

  protected void addOrgUuidQuery(AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb,
      ReportSearchQuery query) {
    if (RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy())
        || RecurseStrategy.PARENTS.equals(query.getOrgRecurseStrategy())) {
      qb.addRecursiveClause(outerQb, "reports",
          new String[] {"\"advisorOrganizationUuid\"", "\"interlocutorOrganizationUuid\""},
          "parent_orgs", "organizations", "uuid", "\"parentOrgUuid\"", "orgUuid",
          query.getOrgUuid(), RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy()),
          false);
    } else {
      qb.addWhereClause("(reports.\"advisorOrganizationUuid\" IN ( <orgUuid> )"
          + " OR reports.\"interlocutorOrganizationUuid\" IN ( <orgUuid> ))");
      qb.addListArg("orgUuid", query.getOrgUuid());
    }
  }

  protected abstract void addLocationUuidQuery(ReportSearchQuery query);

  protected void addLocationUuidQuery(AbstractSearchQueryBuilder<Report, ReportSearchQuery> outerQb,
      ReportSearchQuery query) {
    if (query.getLocationUuid().size() == 1
        && Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid().get(0))) {
      qb.addWhereClause("reports.\"locationUuid\" IS NULL");
    } else if (ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy())
        || ISearchQuery.RecurseStrategy.PARENTS.equals(query.getLocationRecurseStrategy())) {
      qb.addRecursiveClause(outerQb, "reports", new String[] {"\"locationUuid\""},
          "parent_locations", "\"locationRelationships\"", "\"childLocationUuid\"",
          "\"parentLocationUuid\"", "locationUuid", query.getLocationUuid(),
          ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy()), true);
    } else {
      qb.addInListClause("locationUuid", "reports.\"locationUuid\"", query.getLocationUuid());
    }
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, ReportSearchQuery query) {
    // Beware of the sort field names, they have to match what's in the selected fields of the inner
    // query!
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "reports_createdAt"));
        break;
      case RELEASED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "reports_releasedAt"));
        break;
      case UPDATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "reports_updatedAt"));
        break;
      case ENGAGEMENT_DATE:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "reports_engagementDate"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "reports_uuid"));
  }

}
