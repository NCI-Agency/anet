package mil.dds.anet.search.mssql;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
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

  @InTransaction
  @Override
  public CompletableFuture<AnetBeanList<Report>> runSearch(Map<String, Object> context,
      Set<String> subFields, ReportSearchQuery query) {
    buildQuery(subFields, query);
    outerQb.addSelectClause("*");
    outerQb.addTotalCount();
    outerQb.addFromClause("( " + qb.build() + " ) l");
    outerQb.addSqlArgs(qb.getSqlArgs());
    outerQb.addListArgs(qb.getListArgs());
    addOrderByClauses((AbstractSearchQueryBuilder<Report, ReportSearchQuery>) outerQb, query);
    return postProcessResults(context, query,
        (outerQb).buildAndRun(getDbHandle(), query, new ReportMapper()));
  }

  @Override
  protected void buildQuery(Set<String> subFields, ReportSearchQuery query) {
    qb.addSelectClause("DISTINCT " + getTableFields(subFields));
    qb.addFromClause("reports");
    qb.addFromClause("LEFT JOIN \"reportTags\" ON \"reportTags\".\"reportUuid\" = reports.uuid");
    qb.addFromClause("LEFT JOIN tags ON \"reportTags\".\"tagUuid\" = tags.uuid");
    super.buildQuery(subFields, query);
  }

  @Override
  protected void addTextQuery(ReportSearchQuery query) {
    if (!query.isSortByPresent()) {
      // If we're doing a full-text search without an explicit sort order, add a pseudo-rank (the
      // sum of all search ranks) so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now. See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      qb.addSelectClause("ISNULL(c_reports.rank, 0) + ISNULL(f_reports.rank, 0)"
          + " + ISNULL(c_tags.rank, 0) + ISNULL(f_tags.rank, 0) AS search_rank");
    }
    qb.addFromClause(
        "LEFT JOIN CONTAINSTABLE (reports, (text, intent, keyOutcomes, nextSteps), :containsQuery) c_reports"
            + " ON reports.uuid = c_reports.[Key]"
            + " LEFT JOIN FREETEXTTABLE(reports, (text, intent, keyOutcomes, nextSteps), :fullTextQuery) f_reports"
            + " ON reports.uuid = f_reports.[Key]");
    qb.addFromClause("LEFT JOIN CONTAINSTABLE (tags, (name, description), :containsQuery) c_tags"
        + " ON tags.uuid = c_tags.[Key]"
        + " LEFT JOIN FREETEXTTABLE(tags, (name, description), :fullTextQuery) f_tags"
        + " ON tags.uuid = f_tags.[Key]");
    qb.addWhereClause("(c_reports.rank IS NOT NULL OR f_reports.rank IS NOT NULL"
        + " OR c_tags.rank IS NOT NULL OR f_tags.rank IS NOT NULL)");
    final String text = query.getText();
    qb.addSqlArg("containsQuery", qb.getContainsQuery(text));
    qb.addSqlArg("fullTextQuery", qb.getFullTextQuery(text));
  }

  @Override
  protected void addBatchClause(ReportSearchQuery query) {
    addBatchClause(outerQb, query);
  }

  @Override
  protected void addIncludeEngagementDayOfWeekSelect() {
    qb.addSelectClause("DATEPART(dw, reports.engagementDate) AS engagementDayOfWeek");
  }

  @Override
  protected void addEngagementDayOfWeekQuery(ReportSearchQuery query) {
    qb.addEqualsClause("engagementDayOfWeek", "DATEPART(dw, reports.engagementDate)",
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
      if (query.isTextPresent() && !query.isSortByPresent()) {
        // We're doing a full-text search without an explicit sort order,
        // so sort first on the search pseudo-rank.
        qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
      }

      super.addOrderByClauses(qb, query);
    }
  }

}
