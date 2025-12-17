package mil.dds.anet.search;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.BoundingBox;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractLocationSearcher
    extends AbstractSearcher<Location, LocationSearchQuery> implements ILocationSearcher {

  protected AbstractLocationSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<Location, LocationSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<Location> runSearch(LocationSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new LocationMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(LocationSearchQuery query) {
    qb.addSelectClause(LocationDao.LOCATION_FIELDS);
    qb.addFromClause("locations");
    qb.addEnumEqualsClause("status", "locations.status", query.getStatus());
    qb.addLikeClause("type", "locations.type", DaoUtils.getEnumString(query.getType()));
    qb.addStringEqualsClause("trigram", "locations.trigram", query.getTrigram());
    qb.addStringEqualsClause("name", "locations.name", query.getName());

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      addBatchClause(query);
    }

    if (!Utils.isEmptyOrNull(query.getLocationUuid())) {
      addLocationUuidQuery(query);
    }

    final BoundingBox bbox = query.getBoundingBox();
    if (bbox != null) {
      // take care of antimeridian wrapping!
      final double lngDiff = bbox.getMaxLng() - bbox.getMinLng();
      final double minLng = normalizeLng(bbox.getMinLng(), lngDiff, true);
      final double maxLng = normalizeLng(bbox.getMaxLng(), lngDiff, false);
      if (minLng > maxLng) {
        qb.addWhereClause(
            "((lng >= :minLng OR lng <= :maxLng) AND lat BETWEEN :minLat AND :maxLat)");
      } else {
        qb.addWhereClause("(lng BETWEEN :minLng AND :maxLng AND lat BETWEEN :minLat AND :maxLat)");
      }
      qb.addSqlArg("minLng", minLng);
      qb.addSqlArg("maxLng", maxLng);
      qb.addSqlArg("minLat", bbox.getMinLat());
      qb.addSqlArg("maxLat", bbox.getMaxLat());
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          engine().getLocationDao().getSubscriptionUpdate(null, false)));
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

    if (query.getEmailNetwork() != null) {
      // Should never match
      qb.addWhereClause("FALSE");
    }

    addOrderByClauses(qb, query);
  }

  @SuppressWarnings("unchecked")
  protected void addBatchClause(LocationSearchQuery query) {
    qb.addBatchClause((AbstractBatchParams<Location, LocationSearchQuery>) query.getBatchParams());
  }

  protected void addLocationUuidQuery(LocationSearchQuery query) {
    if (ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy())
        || ISearchQuery.RecurseStrategy.PARENTS.equals(query.getLocationRecurseStrategy())) {
      qb.addRecursiveClause(null, "locations", new String[] {"uuid"}, "parent_locations",
          "\"locationRelationships\"", "\"childLocationUuid\"", "\"parentLocationUuid\"",
          "locationUuid", query.getLocationUuid(),
          ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy()), true,
          null);
    } else {
      qb.addInListClause("locationUuid", "locations.uuid", query.getLocationUuid());
    }
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

  private double normalizeLng(double lng, double lngDiff, boolean forMinLng) {
    if (lngDiff >= 360.0) {
      return forMinLng ? -180.0 : 180.0;
    }
    double normalizedLng = (lng + 180.0) % 360.0;
    if (normalizedLng < 0) {
      normalizedLng += 360.0;
    }
    normalizedLng -= 180.0;
    return normalizedLng;
  }

}
