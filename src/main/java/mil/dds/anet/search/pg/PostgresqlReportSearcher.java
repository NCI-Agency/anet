package mil.dds.anet.search.pg;

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

  public PostgresqlReportSearcher() {
    super(new PostgresqlSearchQueryBuilder<Report, ReportSearchQuery>("PostgresqlReportSearch"));
    this.isoDowFormat = "EXTRACT(ISODOW FROM %s)";
  }

  @InTransaction
  @Override
  public AnetBeanList<Report> runSearch(ReportSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new ReportMapper());
  }

  @Override
  protected void buildQuery(ReportSearchQuery query) {
    qb.addSelectClause(ReportDao.REPORT_FIELDS);
    qb.addTotalCount();
    qb.addFromClause("reports");
    super.buildQuery(query);
  }

  @Override
  protected void addTextQuery(ReportSearchQuery query) {
    addFullTextSearch("reports", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addBatchClause(ReportSearchQuery query) {
    addBatchClause(qb, query);
  }

  @Override
  protected void addIncludeEngagementDayOfWeekQuery(ReportSearchQuery query) {
    qb.addSelectClause(String.format(this.isoDowFormat, "reports.\"engagementDate\"")
        + " AS \"engagementDayOfWeek\"");
  }

  @Override
  protected void addEngagementDayOfWeekQuery(ReportSearchQuery query) {
    qb.addEqualsClause("engagementDayOfWeek",
        String.format(this.isoDowFormat, "reports.\"engagementDate\""),
        query.getEngagementDayOfWeek());
  }

  @Override
  protected void addOrgUuidQuery(ReportSearchQuery query) {
    addOrgUuidQuery(qb, query);
  }

  @Override
  protected void addAdvisorOrgUuidQuery(ReportSearchQuery query) {
    addAdvisorOrgUuidQuery(qb, query);
  }

  @Override
  protected void addPrincipalOrgUuidQuery(ReportSearchQuery query) {
    addPrincipalOrgUuidQuery(qb, query);
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, ReportSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    super.addOrderByClauses(qb, query);
  }

}
