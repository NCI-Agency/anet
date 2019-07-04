package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.search.AbstractReportSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class PostgresqlReportSearcher extends AbstractReportSearcher {

  private final String isoDowFormat;
  private final PostgresqlSearchQueryBuilder<Report, ReportSearchQuery> outerQb;

  public PostgresqlReportSearcher() {
    super(new PostgresqlSearchQueryBuilder<Report, ReportSearchQuery>(""));
    this.isoDowFormat = "EXTRACT(ISODOW FROM %s)";
    outerQb = new PostgresqlSearchQueryBuilder<Report, ReportSearchQuery>("PostgresqlReportSearch");
  }

  @Override
  protected void buildQuery(ReportSearchQuery query) {
    qb.addSelectClause("reports.uuid");
    super.buildQuery(query);
  }

  @InTransaction
  @Override
  public AnetBeanList<Report> runSearch(ReportSearchQuery query) {
    buildQuery(query);
    outerQb.addSelectClause("DISTINCT " + ReportDao.REPORT_FIELDS);
    if (query.getIncludeEngagementDayOfWeek()) {
      outerQb.addSelectClause(String.format(this.isoDowFormat, "reports.\"engagementDate\"")
          + " AS \"engagementDayOfWeek\"");
    }
    outerQb.addTotalCount();
    outerQb.addFromClause("reports");
    outerQb.addWhereClause("reports.uuid IN ( " + qb.build() + " )");
    outerQb.addSqlArgs(qb.getSqlArgs());
    outerQb.addListArgs(qb.getListArgs());
    final AnetBeanList<Report> result =
        outerQb.buildAndRun(getDbHandle(), query, new ReportMapper());
    for (final Report report : result.getList()) {
      report.setUser(query.getUser());
    }
    return result;
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, ReportSearchQuery query) {
    switch (query.getSortBy()) {
      case ENGAGEMENT_DATE:
        outerQb.addAllOrderByClauses(
            getOrderBy(query.getSortOrder(), "reports", "\"engagementDate\""));
        break;
      case RELEASED_AT:
        outerQb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "reports", "\"releasedAt\""));
        break;
      case UPDATED_AT:
        outerQb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "reports", "\"releasedAt\""));
        break;
      case CREATED_AT:
      default:
        outerQb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "reports", "\"updatedAt\""));
        break;
    }
    outerQb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "reports", "uuid"));
  }

  @Override
  protected void addTextQuery(ReportSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClauses("text", new String[] {"reports.text", "reports.intent",
        "reports.\"keyOutcomes\"", "reports.\"nextSteps\"", "tags.name", "tags.description"}, text);
  }

  @Override
  protected void addIncludeEngagementDayOfWeekQuery(ReportSearchQuery query) {
    // added in {@link #runSearch}
  }

  @Override
  protected void addEngagementDayOfWeekQuery(ReportSearchQuery query) {
    qb.addEqualsClause("engagementDayOfWeek",
        String.format(this.isoDowFormat, "reports.\"engagementDate\""),
        query.getEngagementDayOfWeek());
  }

  @Override
  protected void addOrgUuidQuery(ReportSearchQuery query) {
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

  @Override
  protected void addAdvisorOrgUuidQuery(ReportSearchQuery query) {
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

  @Override
  protected void addPrincipalOrgUuidQuery(ReportSearchQuery query) {
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

}
