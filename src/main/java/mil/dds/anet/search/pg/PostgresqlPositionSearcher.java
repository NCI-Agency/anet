package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.search.AbstractPositionSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class PostgresqlPositionSearcher extends AbstractPositionSearcher {

  public PostgresqlPositionSearcher() {
    super(new PostgresqlSearchQueryBuilder<Position, PositionSearchQuery>(
        "PostgresqlPositionSearch"));
  }

  @Override
  protected void addTextQuery(PositionSearchQuery query) {
    addFullTextSearch("positions", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addWithinPolygon(PositionSearchQuery query) {
    qb.addWhereClause(String
        .format("\"locationUuid\" IN (SELECT \"uuid\" FROM locations WHERE ST_Within(\"gisPoint\", "
            + "ST_GeomFromText('%1$s', 3857)))", query.getWithinPolygon()));
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PositionSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
