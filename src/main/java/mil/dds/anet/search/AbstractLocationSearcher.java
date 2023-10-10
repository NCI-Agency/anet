package mil.dds.anet.search;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractLocationSearcher
    extends AbstractSearcher<Location, LocationSearchQuery> implements ILocationSearcher {

  public AbstractLocationSearcher(AbstractSearchQueryBuilder<Location, LocationSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Location> runSearch(LocationSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new LocationMapper());
  }

  @Override
  protected void buildQuery(LocationSearchQuery query) {
    qb.addSelectClause(LocationDao.LOCATION_FIELDS);
    qb.addFromClause("locations");
    qb.addEnumEqualsClause("status", "locations.status", query.getStatus());
    qb.addLikeClause("type", "locations.type", DaoUtils.getEnumString(query.getType()));

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          AnetObjectEngine.getInstance().getLocationDao().getSubscriptionUpdate(null)));
    }

    if (Boolean.TRUE.equals(query.isInMyReports())) {
      qb.addSelectClause("\"inMyReports\".max AS \"inMyReports_max\"");
      qb.addFromClause("JOIN ("
          + "  SELECT reports.\"locationUuid\" AS uuid, MAX(reports.\"createdAt\") AS max FROM reports"
          + "  WHERE reports.uuid IN (SELECT \"reportUuid\" FROM \"reportPeople\""
          + "    WHERE \"isAuthor\" = :isAuthor AND \"personUuid\" = :userUuid)"
          + "  GROUP BY reports.\"locationUuid\""
          + ") \"inMyReports\" ON locations.uuid = \"inMyReports\".uuid");
      qb.addSqlArg("isAuthor", true);
      qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
    }

    addOrderByClauses(qb, query);
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, LocationSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "locations_createdAt"));
        break;
      case RECENT:
        if (Boolean.TRUE.equals(query.isInMyReports())) {
          // Otherwise the JOIN won't exist
          qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "inMyReports_max"));
        }
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "locations_name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "locations_uuid"));
  }

}
