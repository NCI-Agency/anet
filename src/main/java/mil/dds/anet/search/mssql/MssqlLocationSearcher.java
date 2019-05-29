package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlLocationSearcher extends AbstractSearcher implements ILocationSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Location> runSearch(LocationSearchQuery query) {
    final MssqlSearchQueryBuilder<Location, LocationSearchQuery> qb =
        new MssqlSearchQueryBuilder<Location, LocationSearchQuery>("MssqlLocationSearch");
    qb.addSelectClause("locations.*");
    qb.addSelectClause("count(*) over() as totalCount");
    qb.addFromClause("locations");

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank
      // so we can sort on it (show the most relevant hits at the top).
      qb.addSelectClause("ISNULL(c_locations.rank, 0) AS search_rank");
      qb.addFromClause("LEFT JOIN CONTAINSTABLE (locations, (name), :containsQuery) c_locations"
          + " ON locations.uuid = c_locations.[Key]");
      qb.addWhereClause("c_locations.rank IS NOT NULL");
      final String text = query.getText();
      qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
    }

    qb.addEqualsClause("status", "status", query.getStatus());

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new LocationMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, LocationSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "locations", "createdAt"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "locations", "name"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "locations", "uuid"));
  }

}
