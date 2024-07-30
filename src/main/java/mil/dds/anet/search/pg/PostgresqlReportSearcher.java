package mil.dds.anet.search.pg;

import graphql.GraphQLContext;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.mappers.ReportMapper;
import mil.dds.anet.search.AbstractReportSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PostgresqlReportSearcher extends AbstractReportSearcher {

  private final String isoDowFormat;

  public PostgresqlReportSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler,
        new PostgresqlSearchQueryBuilder<Report, ReportSearchQuery>("PostgresqlReportSearch"));
    this.isoDowFormat = "EXTRACT(DOW FROM %s)+1"; // We need Sunday=1, Monday=2, etc.
  }

  @Transactional
  @Override
  public CompletableFuture<AnetBeanList<Report>> runSearch(GraphQLContext context,
      Set<String> subFields, ReportSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      final ReportSearchQuery modifiedQuery = getQueryForPostProcessing(query);
      buildQuery(subFields, modifiedQuery);
      return postProcessResults(context, query,
          qb.buildAndRun(handle, modifiedQuery, new ReportMapper()));
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(Set<String> subFields, ReportSearchQuery query) {
    qb.addSelectClause(getTableFields(subFields));
    qb.addFromClause("reports");
    super.buildQuery(subFields, query);
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
  protected void addIncludeEngagementDayOfWeekSelect() {
    qb.addSelectClause(String.format(this.isoDowFormat, "reports.\"engagementDate\"")
        + " AS \"engagementDayOfWeek\"");
  }

  @Override
  protected void addEngagementDayOfWeekQuery(ReportSearchQuery query) {
    qb.addObjectEqualsClause("engagementDayOfWeek",
        String.format(this.isoDowFormat, "reports.\"engagementDate\""),
        query.getEngagementDayOfWeek());
  }

  @Override
  protected void addOrgUuidQuery(ReportSearchQuery query) {
    addOrgUuidQuery(qb, query);
  }

  @Override
  protected void addLocationUuidQuery(ReportSearchQuery query) {
    addLocationUuidQuery(qb, query);
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, ReportSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, "search_rank"));
    }

    super.addOrderByClauses(qb, query);
  }

}
