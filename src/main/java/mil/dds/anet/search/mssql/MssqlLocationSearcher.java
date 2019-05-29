package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.search.AbstractLocationSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.utils.Utils;

public class MssqlLocationSearcher extends AbstractLocationSearcher {

  public MssqlLocationSearcher() {
    super(new MssqlSearchQueryBuilder<Location, LocationSearchQuery>("MssqlLocationSearch"));
  }

  @Override
  protected void buildQuery(LocationSearchQuery query) {
    super.buildQuery(query);
    qb.addSelectClause("COUNT(*) OVER() AS totalCount");
  }

  @Override
  protected void addTextQuery(LocationSearchQuery query) {
    // If we're doing a full-text search, add a pseudo-rank
    // so we can sort on it (show the most relevant hits at the top).
    qb.addSelectClause("ISNULL(c_locations.rank, 0) AS search_rank");
    qb.addFromClause("LEFT JOIN CONTAINSTABLE (locations, (name), :containsQuery) c_locations"
        + " ON locations.uuid = c_locations.[Key]");
    qb.addWhereClause("c_locations.rank IS NOT NULL");
    final String text = query.getText();
    qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, LocationSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
