package mil.dds.anet.search;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.mappers.PositionMapper;

public abstract class AbstractPositionSearcher
    extends AbstractSearcher<Position, PositionSearchQuery> implements IPositionSearcher {

  public AbstractPositionSearcher(AbstractSearchQueryBuilder<Position, PositionSearchQuery> qb) {
    super(qb);
  }

  @Override
  public AnetBeanList<Position> runSearch(PositionSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new PositionMapper());
  }

  protected void buildQuery(PositionSearchQuery query) {
    qb.addFromClause("positions");

    if (Boolean.TRUE.equals(query.getMatchPersonName())) {
      qb.addFromClause("LEFT JOIN people ON positions.\"currentPersonUuid\" = people.uuid");
    }

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    qb.addInClause("types", "positions.type", query.getType());

    if (query.getOrganizationUuid() != null) {
      addOrganizationUuidQuery(query);
    }

    if (query.getIsFilled() != null) {
      if (query.getIsFilled()) {
        qb.addWhereClause("positions.\"currentPersonUuid\" IS NOT NULL");
      } else {
        qb.addWhereClause("positions.\"currentPersonUuid\" IS NULL");
      }
    }

    qb.addEqualsClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());
    qb.addEqualsClause("status", "positions.status", query.getStatus());

    if (query.getAuthorizationGroupUuid() != null) {
      // Search for positions related to a given authorization group
      qb.addWhereClause(
          "positions.uuid IN (SELECT ap.\"positionUuid\" FROM \"authorizationGroupPositions\" ap"
              + " WHERE ap.\"authorizationGroupUuid\" = :authorizationGroupUuid)");
      qb.addSqlArg("authorizationGroupUuid", query.getAuthorizationGroupUuid());
    }

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(PositionSearchQuery query);

  protected abstract void addOrganizationUuidQuery(PositionSearchQuery query);

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PositionSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "positions", "\"createdAt\""));
        break;
      case CODE:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "positions", "code"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "positions", "name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "positions", "uuid"));
  }

}
