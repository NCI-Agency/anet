package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.search.AbstractReportSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlReportSearcher extends AbstractReportSearcher {

  private final MssqlSearchQueryBuilder<Report, ReportSearchQuery> outerQb;

  public MssqlReportSearcher() {
    super(new MssqlSearchQueryBuilder<Report, ReportSearchQuery>(""));
    outerQb = new MssqlSearchQueryBuilder<Report, ReportSearchQuery>("MssqlReportSearch");
  }

  @Override
  protected void buildQuery(ReportSearchQuery query, Person user, boolean systemSearch) {
    qb.addSelectClause("DISTINCT " + ReportDao.REPORT_FIELDS);
    super.buildQuery(query, user, systemSearch);
  }

  @InTransaction
  @Override
  public AnetBeanList<Report> runSearch(ReportSearchQuery query, Person user,
      boolean systemSearch) {
    buildQuery(query, user, systemSearch);
    outerQb.addSelectClause("*");
    outerQb.addTotalCount();
    outerQb.addFromClause("( " + qb.build() + " ) l");
    outerQb.addSqlArgs(qb.getSqlArgs());
    outerQb.addListArgs(qb.getListArgs());
    final AnetBeanList<Report> result =
        outerQb.buildAndRun(getDbHandle(), query, new ReportMapper());
    for (final Report report : result.getList()) {
      report.setUser(user);
    }
    return result;
  }

  @Override
  protected void addTextQuery(ReportSearchQuery query) {
    // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
    // so we can sort on it (show the most relevant hits at the top).
    // Note that summing up independent ranks is not ideal, but it's the best we can do now.
    // See
    // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
    qb.addSelectClause("ISNULL(c_reports.rank, 0) + ISNULL(f_reports.rank, 0)"
        + " + ISNULL(c_tags.rank, 0) + ISNULL(f_tags.rank, 0) AS search_rank");
    qb.addFromClause(
        "LEFT JOIN CONTAINSTABLE (reports, (text, intent, keyOutcomes, nextSteps), :containsQuery) c_reports"
            + " ON reports.uuid = c_reports.[Key]"
            + " LEFT JOIN FREETEXTTABLE(reports, (text, intent, keyOutcomes, nextSteps), :freetextQuery) f_reports"
            + " ON reports.uuid = f_reports.[Key]");
    qb.addFromClause("LEFT JOIN CONTAINSTABLE (tags, (name, description), :containsQuery) c_tags"
        + " ON tags.uuid = c_tags.[Key]"
        + " LEFT JOIN FREETEXTTABLE(tags, (name, description), :freetextQuery) f_tags"
        + " ON tags.uuid = f_tags.[Key]");
    qb.addWhereClause("(c_reports.rank IS NOT NULL OR f_reports.rank IS NOT NULL"
        + " OR c_tags.rank IS NOT NULL OR f_tags.rank IS NOT NULL)");
    final String text = query.getText();
    qb.addSqlArg("containsQuery", qb.getFullTextQuery(text));
    qb.addSqlArg("freetextQuery", text);
  }

  @Override
  protected void addIncludeEngagementDayOfWeekQuery(ReportSearchQuery query) {
    qb.addSelectClause("DATEPART(dw, reports.engagementDate) AS engagementDayOfWeek");
  }

  @Override
  protected void addEngagementDayOfWeekQuery(ReportSearchQuery query) {
    qb.addEqualsClause("engagementDayOfWeek", "DATEPART(dw, reports.engagementDate)",
        query.getEngagementDayOfWeek());
  }

  @Override
  protected void addOrgUuidQuery(ReportSearchQuery query) {
    if (!query.getIncludeOrgChildren()) {
      qb.addWhereClause(
          "(reports.advisorOrganizationUuid = :orgUuid OR reports.principalOrganizationUuid = :orgUuid)");
    } else {
      outerQb.addWithClause("parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
          + " SELECT o.uuid FROM parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
          + ")");
      qb.addWhereClause("(reports.advisorOrganizationUuid IN (SELECT uuid FROM parent_orgs)"
          + " OR reports.principalOrganizationUuid IN (SELECT uuid FROM parent_orgs))");
    }
    qb.addSqlArg("orgUuid", query.getOrgUuid());
  }

  @Override
  protected void addAdvisorOrgUuidQuery(ReportSearchQuery query) {
    if (Organization.DUMMY_ORG_UUID.equals(query.getAdvisorOrgUuid())) {
      qb.addWhereClause("reports.advisorOrganizationUuid IS NULL");
    } else if (!query.getIncludeAdvisorOrgChildren()) {
      qb.addEqualsClause("advisorOrganizationUuid", "reports.advisorOrganizationUuid",
          query.getAdvisorOrgUuid());
    } else {
      outerQb.addWithClause("advisor_parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :advisorOrgUuid UNION ALL"
          + " SELECT o.uuid FROM advisor_parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
          + ")");
      qb.addWhereClause(
          "reports.advisorOrganizationUuid IN (SELECT uuid FROM advisor_parent_orgs)");
      qb.addSqlArg("advisorOrgUuid", query.getAdvisorOrgUuid());
    }
  }

  @Override
  protected void addPrincipalOrgUuidQuery(ReportSearchQuery query) {
    if (Organization.DUMMY_ORG_UUID.equals(query.getPrincipalOrgUuid())) {
      qb.addWhereClause("reports.principalOrganizationUuid IS NULL");
    } else if (!query.getIncludePrincipalOrgChildren()) {
      qb.addEqualsClause("principalOrganizationUuid", "reports.principalOrganizationUuid",
          query.getPrincipalOrgUuid());
    } else {
      outerQb.addWithClause("principal_parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :principalOrgUuid UNION ALL"
          + " SELECT o.uuid FROM principal_parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
          + ")");
      qb.addWhereClause(
          "reports.principalOrganizationUuid IN (SELECT uuid FROM principal_parent_orgs)");
      qb.addSqlArg("principalOrgUuid", query.getPrincipalOrgUuid());
    }
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, ReportSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      outerQb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    // Beware of the sort field names, they have to match what's in the selected fields!
    switch (query.getSortBy()) {
      case CREATED_AT:
        outerQb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), null, "reports_createdAt"));
        break;
      case RELEASED_AT:
        outerQb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), null, "reports_releasedAt"));
        break;
      case UPDATED_AT:
        outerQb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), null, "reports_updatedAt"));
        break;
      case ENGAGEMENT_DATE:
      default:
        outerQb
            .addAllOrderByClauses(getOrderBy(query.getSortOrder(), null, "reports_engagementDate"));
        break;
    }
    outerQb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, null, "reports_uuid"));
  }

}
