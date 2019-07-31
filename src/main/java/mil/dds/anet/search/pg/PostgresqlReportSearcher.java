package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.search.AbstractReportSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class PostgresqlReportSearcher extends AbstractReportSearcher {

  private final String isoDowFormat;
  private final PostgresqlSearchQueryBuilder<Report, ReportSearchQuery> outerQb;

  public PostgresqlReportSearcher() {
    super(new PostgresqlSearchQueryBuilder<Report, ReportSearchQuery>(""));
    this.isoDowFormat = "EXTRACT(ISODOW FROM %s)";
    outerQb = new PostgresqlSearchQueryBuilder<Report, ReportSearchQuery>("PostgresqlReportSearch");
  }

  @Override
  public AnetBeanList<Report> runSearch(ReportSearchQuery query) {
    return runSearch(outerQb, query);
  }

  @Override
  protected void addTextQuery(ReportSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClauses("text", new String[] {"reports.text", "reports.intent",
        "reports.\"keyOutcomes\"", "reports.\"nextSteps\"", "tags.name", "tags.description"}, text);
  }

  @Override
  protected void addBatchClause(ReportSearchQuery query) {
    addBatchClause(outerQb, query);
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
    addOrgUuidQuery(outerQb, query);
  }

  @Override
  protected void addAdvisorOrgUuidQuery(ReportSearchQuery query) {
    addAdvisorOrgUuidQuery(outerQb, query);
  }

  @Override
  protected void addPrincipalOrgUuidQuery(ReportSearchQuery query) {
    addPrincipalOrgUuidQuery(outerQb, query);
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, ReportSearchQuery query) {
    if (qb == outerQb) {
      // ordering must be on the outer query
      super.addOrderByClauses(qb, query);
    }
  }

}
