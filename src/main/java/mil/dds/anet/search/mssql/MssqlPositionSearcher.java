package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.search.AbstractPositionSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class MssqlPositionSearcher extends AbstractPositionSearcher {

  public MssqlPositionSearcher() {
    super(new MssqlSearchQueryBuilder<Position, PositionSearchQuery>("MssqlPositionSearch"));
  }

  @Override
  protected void addTextQuery(PositionSearchQuery query) {
    if (!query.isSortByPresent()) {
      // If we're doing a full-text search without an explicit sort order, add a pseudo-rank (the
      // sum of all search ranks) so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now. See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      qb.addSelectClause("ISNULL(c_positions.rank, 0)"
          + " + CASE WHEN positions.code LIKE :likeQuery THEN 1000 ELSE 0 END"
          + (query.getMatchPersonName() ? " + ISNULL(c_people.rank, 0)" : "") + " AS search_rank");
    }
    qb.addFromClause("LEFT JOIN CONTAINSTABLE (positions, (name), :containsQuery) c_positions"
        + " ON positions.uuid = c_positions.[Key]");
    final StringBuilder whereRank =
        new StringBuilder("(c_positions.rank IS NOT NULL OR positions.code LIKE :likeQuery");
    if (query.getMatchPersonName()) {
      qb.addFromClause("LEFT JOIN CONTAINSTABLE(people, (name), :containsQuery) c_people"
          + " ON people.uuid = c_people.[Key]");
      whereRank.append(" OR c_people.rank IS NOT NULL");
    }
    whereRank.append(")");
    qb.addWhereClause(whereRank.toString());
    final String text = query.getText();
    qb.addSqlArg("containsQuery", qb.getContainsQuery(text));
    qb.addSqlArg("likeQuery", qb.getLikeQuery(text));
  }

  @Override
  protected void addWithinPolygon(PositionSearchQuery query) {
    addWithinPolygonMssql("locationUuid", query.getWithinPolygon());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PositionSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
