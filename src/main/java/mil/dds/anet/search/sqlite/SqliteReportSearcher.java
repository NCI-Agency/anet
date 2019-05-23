package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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

public class SqliteReportSearcher extends AbstractSqliteSearcherBase<Report, ReportSearchQuery>
    implements IReportSearcher {

  private String isoDowFormat;
  private String isoDowComparison;

  public SqliteReportSearcher(String isoDowFormat) {
    this.isoDowFormat = isoDowFormat;
    this.isoDowComparison = "(" + this.isoDowFormat + ") = :%s";
  }

  public SqliteReportSearcher() {
    this("strftime('%%w', substr(reports.\"%s\", 1, 10)) + 1"); // %w day of week 0-6 with Sunday==0
  }

  public AnetBeanList<Report> runSearch(ReportSearchQuery query, Person user,
      boolean systemSearch) {
    start("SqliteReportSearch");
    sql.append("SELECT DISTINCT " + ReportDao.REPORT_FIELDS);
    if (query.getIncludeEngagementDayOfWeek()) {
      sql.append(", ");
      sql.append(String.format(this.isoDowFormat, "engagementDate"));
      sql.append(" as \"engagementDayOfWeek\" ");
    }
    sql.append(" FROM reports ");
    sql.append("WHERE reports.uuid IN ( SELECT reports.uuid FROM reports ");
    sql.append("LEFT JOIN \"reportTags\" ON \"reportTags\".\"reportUuid\" = reports.uuid ");
    sql.append("LEFT JOIN tags ON \"reportTags\".\"tagUuid\" = tags.uuid ");

    if (query.isTextPresent()) {
      final String text = query.getText();
      whereClauses.add("(text LIKE '%' || :text || '%' OR " + "intent LIKE '%' || :text || '%' OR "
          + "\"keyOutcomes\" LIKE '%' || :text || '%' OR "
          + "\"nextSteps\" LIKE '%' || :text || '%' OR " + "tags.name LIKE '%' || :text || '%' OR "
          + "tags.description LIKE '%' || :text || '%'" + ")");
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    addEqualsClause("authorUuid", "reports.\"authorUuid\"", query.getAuthorUuid());
    addDateClause("startDate", "reports.\"engagementDate\"", Comparison.AFTER,
        query.getEngagementDateStart());
    addDateClause("endDate", "reports.\"engagementDate\"", Comparison.BEFORE,
        query.getEngagementDateEnd());
    addDateClause("startCreatedAt", "reports.\"createdAt\"", Comparison.AFTER,
        query.getCreatedAtStart());
    addDateClause("endCreatedAt", "reports.\"createdAt\"", Comparison.BEFORE,
        query.getCreatedAtEnd());
    addDateClause("updatedAtStart", "reports.\"updatedAt\"", Comparison.AFTER,
        query.getUpdatedAtStart());
    addDateClause("updatedAtEnd", "reports.\"updatedAt\"", Comparison.BEFORE,
        query.getUpdatedAtEnd());
    addDateClause("releasedAtStart", "reports.\"releasedAt\"", Comparison.AFTER,
        query.getReleasedAtStart());
    addDateClause("releasedAtEnd", "reports.\"releasedAt\"", Comparison.BEFORE,
        query.getReleasedAtEnd());

    if (query.getEngagementDayOfWeek() != null) {
      whereClauses
          .add(String.format(this.isoDowComparison, "engagementDate", "engagementDayOfWeek"));
      sqlArgs.put("engagementDayOfWeek", query.getEngagementDayOfWeek());
    }

    if (query.getAttendeeUuid() != null) {
      whereClauses.add(
          "reports.uuid IN (SELECT \"reportUuid\" from \"reportPeople\" where \"personUuid\" = :attendeeUuid)");
      sqlArgs.put("attendeeUuid", query.getAttendeeUuid());
    }

    if (query.getAuthorPositionUuid() != null) {
      // Search for reports authored by people serving in that position at the report's creation
      // date
      whereClauses.add("reports.uuid IN ( SELECT r.uuid FROM reports r "
          + PositionDao.generateCurrentPositionFilter("r.\"authorUuid\"", "r.\"createdAt\"",
              "authorPositionUuid")
          + ")");
      sqlArgs.put("authorPositionUuid", query.getAuthorPositionUuid());
    }

    if (query.getAttendeePositionUuid() != null) {
      // Search for reports attended by people serving in that position at the engagement date
      whereClauses.add("reports.uuid IN ( SELECT r.uuid FROM reports r "
          + "JOIN \"reportPeople\" rp ON rp.\"reportUuid\" = r.uuid "
          + PositionDao.generateCurrentPositionFilter("rp.\"personUuid\"", "r.\"engagementDate\"",
              "attendeePositionUuid")
          + ")");
      sqlArgs.put("attendeePositionUuid", query.getAttendeePositionUuid());
    }

    addEqualsClause("atmosphere", "reports.atmosphere", query.getAtmosphere());

    if (query.getTaskUuid() != null) {
      if (Task.DUMMY_TASK_UUID.equals(query.getTaskUuid())) {
        whereClauses.add(
            "NOT EXISTS (SELECT \"taskUuid\" from \"reportTasks\" where \"reportUuid\" = reports.uuid)");
      } else {
        whereClauses.add(
            "reports.uuid IN (SELECT \"reportUuid\" from \"reportTasks\" where \"taskUuid\" = :taskUuid)");
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
            "(reports.\"advisorOrganizationUuid\" = :orgUuid OR reports.\"principalOrganizationUuid\" = :orgUuid)");
      } else {
        withClauses.add("WITH RECURSIVE parent_orgs(uuid) AS ( "
            + "SELECT uuid FROM organizations WHERE uuid = :orgUuid " + "UNION ALL "
            + "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
            + ") ");
        whereClauses.add("(reports.\"advisorOrganizationUuid\" IN (SELECT uuid from parent_orgs) "
            + "OR reports.\"principalOrganizationUuid\" IN (SELECT uuid from parent_orgs))");
      }
      sqlArgs.put("orgUuid", query.getOrgUuid());
    }

    if (query.getAdvisorOrgUuid() != null) {
      if (Organization.DUMMY_ORG_UUID.equals(query.getAdvisorOrgUuid())) {
        whereClauses.add("reports.\"advisorOrganizationUuid\" IS NULL");
      } else if (!query.getIncludeAdvisorOrgChildren()) {
        addEqualsClause("advisorOrganizationUuid", "reports.\"advisorOrganizationUuid\"",
            query.getAdvisorOrgUuid());
      } else {
        withClauses.add("WITH RECURSIVE advisor_parent_orgs(uuid) AS ( "
            + "SELECT uuid FROM organizations WHERE uuid = :advisorOrgUuid " + "UNION ALL "
            + "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
            + ") ");
        whereClauses
            .add("reports.\"advisorOrganizationUuid\" IN (SELECT uuid from advisor_parent_orgs)");
        sqlArgs.put("advisorOrgUuid", query.getAdvisorOrgUuid());
      }
    }

    if (query.getPrincipalOrgUuid() != null) {
      if (Organization.DUMMY_ORG_UUID.equals(query.getPrincipalOrgUuid())) {
        whereClauses.add("reports.\"principalOrganizationUuid\" IS NULL");
      } else if (!query.getIncludePrincipalOrgChildren()) {
        addEqualsClause("principalOrganizationUuid", "reports.\"principalOrganizationUuid\"",
            query.getPrincipalOrgUuid());
      } else {
        withClauses.add("WITH RECURSIVE principal_parent_orgs(uuid) AS ( "
            + "SELECT uuid FROM organizations WHERE uuid = :principalOrgUuid " + "UNION ALL "
            + "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
            + ") ");
        whereClauses.add(
            "reports.\"principalOrganizationUuid\" IN (SELECT uuid from principal_parent_orgs)");
        sqlArgs.put("principalOrgUuid", query.getPrincipalOrgUuid());
      }
    }

    if (query.getLocationUuid() != null) {
      if (Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid())) {
        whereClauses.add("reports.\"locationUuid\" IS NULL");
      } else {
        addEqualsClause("locationUuid", "reports.\"locationUuid\"", query.getLocationUuid());
      }
    }

    if (query.getPendingApprovalOf() != null) {
      whereClauses.add("reports.\"authorUuid\" != :approverUuid");
      whereClauses.add("reports.\"approvalStepUuid\" IN "
          + "(SELECT \"approvalStepUuid\" from approvers where \"positionUuid\" IN "
          + "(SELECT uuid FROM positions where \"currentPersonUuid\" = :approverUuid))");
      sqlArgs.put("approverUuid", query.getPendingApprovalOf());
    }

    addInClause("states", "reports.state", query.getState());

    if (query.getCancelledReason() != null) {
      if (ReportCancelledReason.NO_REASON_GIVEN.equals(query.getCancelledReason())) {
        whereClauses.add("reports.\"cancelledReason\" IS NULL");
      } else {
        addEqualsClause("cancelledReason", "reports.\"cancelledReason\"",
            query.getCancelledReason());
      }
    }

    if (whereClauses.size() == 0) {
      return new AnetBeanList<Report>(query.getPageNum(), query.getPageSize(),
          new ArrayList<Report>());
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
            "((reports.state != :draftState AND reports.state != :rejectedState) OR (reports.\"authorUuid\" = :userUuid))");
        sqlArgs.put("draftState", DaoUtils.getEnumId(ReportState.DRAFT));
        sqlArgs.put("rejectedState", DaoUtils.getEnumId(ReportState.REJECTED));
        sqlArgs.put("userUuid", user.getUuid());
        if (!AuthUtils.isAdmin(user)) {
          // Admin users may access all approved reports, other users only owned approved reports
          whereClauses
              .add("((reports.state != :approvedState) OR (reports.\"authorUuid\" = :userUuid))");
          sqlArgs.put("approvedState", DaoUtils.getEnumId(ReportState.APPROVED));
        }
      }
    }

    finish(query);
    sql.append(")"); // close open parenthesis
    return getResult(query, new ReportMapper(), user);
  }

  @Override
  protected void getOrderByClauses(ReportSearchQuery query) {
    switch (query.getSortBy()) {
      case ENGAGEMENT_DATE:
        orderByClauses
            .addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports.\"engagementDate\""));
        break;
      case RELEASED_AT:
        orderByClauses
            .addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports.\"releasedAt\""));
        break;
      case UPDATED_AT:
        orderByClauses
            .addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports.\"releasedAt\""));
        break;
      case CREATED_AT:
      default:
        orderByClauses
            .addAll(Utils.addOrderBy(query.getSortOrder(), null, "reports.\"updatedAt\""));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, null, "uuid"));
  }

  @InTransaction
  protected AnetBeanList<Report> getResult(ReportSearchQuery query, ReportMapper mapper,
      Person user) {
    final Query q = getDbHandle().createQuery(sql.toString()).bindMap(sqlArgs)
        .bind("offset", query.getPageSize() * query.getPageNum())
        .bind("limit", query.getPageSize());
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(listArg.getKey(), listArg.getValue());
    }
    final AnetBeanList<Report> result =
        AnetBeanList.getReportList(user, q, query.getPageNum(), query.getPageSize(), mapper);
    result.setTotalCount(result.getList().size());
    return result;
  }

}
