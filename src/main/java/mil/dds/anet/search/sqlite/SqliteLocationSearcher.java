package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.search.mssql.MssqlSearchQueryBuilder;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqliteLocationSearcher extends AbstractSearcher implements ILocationSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Location> runSearch(LocationSearchQuery query) {
    final MssqlSearchQueryBuilder<Location, LocationSearchQuery> qb =
        new MssqlSearchQueryBuilder<Location, LocationSearchQuery>("SqliteLocationSearch");
    qb.addSelectClause("*");
    qb.addFromClause("locations");

    if (query.isTextPresent()) {
      final String text = query.getText();
      qb.addWhereClause("(name LIKE '%' || :text || '%')");
      qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
    }

    qb.addEqualsClause("status", "status", query.getStatus());

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new LocationMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, LocationSearchQuery query) {
    qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "locations", "name"));
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "locations", "uuid"));
  }

}
