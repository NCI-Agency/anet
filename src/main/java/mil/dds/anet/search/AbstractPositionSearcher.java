package mil.dds.anet.search;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.PendingAssessmentsHelper;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractPositionSearcher
    extends AbstractSearcher<Position, PositionSearchQuery> implements IPositionSearcher {

  protected AbstractPositionSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<Position, PositionSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<Position> runSearch(PositionSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new PositionMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public CompletableFuture<AnetBeanList<Position>> runSearch(GraphQLContext context,
      PositionSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      // Asynchronous version of search; should be wrapped in a transaction by the GraphQLResource
      // handling the request
      final PositionMapper mapper = new PositionMapper();
      buildQuery(query);
      if (!query.getHasPendingAssessments()) {
        return CompletableFuture.completedFuture(qb.buildAndRun(handle, query, mapper));
      }

      // Filter to only the positions with pending assessments
      final Instant now = Instant.now().atZone(DaoUtils.getServerNativeZoneId()).toInstant();
      return new PendingAssessmentsHelper(ApplicationContextProvider.getDictionary())
          .loadAll(context, now, null, false)
          .thenApply(otaMap -> otaMap.keySet().stream().map(AbstractAnetBean::getUuid).toList())
          .thenApply(positionUuids -> {
            qb.addInListClause("positionUuids", "positions.uuid", positionUuids);
            return qb.buildAndRun(handle, query, mapper);
          });
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(PositionSearchQuery query) {
    qb.addSelectClause(PositionDao.POSITION_FIELDS);
    qb.addFromClause("positions");

    if (query.getMatchPersonName()) {
      qb.addFromClause("LEFT JOIN people ON positions.\"currentPersonUuid\" = people.uuid");
    }

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      addBatchClause(query);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          engine().getPositionDao().getSubscriptionUpdate(null, false)));
    }

    qb.addInClause("types", "positions.type", query.getType());

    if (!Utils.isEmptyOrNull(query.getOrganizationUuid())) {
      if (RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy())
          || RecurseStrategy.PARENTS.equals(query.getOrgRecurseStrategy())) {
        qb.addRecursiveClause(null, "positions", "\"organizationUuid\"", "parent_orgs",
            "organizations", "\"parentOrgUuid\"", "orgUuid", query.getOrganizationUuid(),
            RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy()), null);
      } else {
        qb.addInListClause("orgUuid", "positions.\"organizationUuid\"",
            query.getOrganizationUuid());
      }
    }

    if (query.getIsFilled() != null) {
      if (query.getIsFilled()) {
        qb.addWhereClause("positions.\"currentPersonUuid\" IS NOT NULL");
      } else {
        qb.addWhereClause("positions.\"currentPersonUuid\" IS NULL");
      }
    }

    if (!Utils.isEmptyOrNull(query.getLocationUuid())) {
      addLocationUuidQuery(query);
    }

    qb.addEnumEqualsClause("status", "positions.status", query.getStatus());

    if (query.getAuthorizationGroupUuid() != null) {
      // Search for positions related to a given community
      qb.addWhereClause("positions.uuid IN"
          + " (SELECT agro.\"relatedObjectUuid\" FROM \"authorizationGroupRelatedObjects\" agro"
          + " WHERE agro.\"relatedObjectType\" = :relatedObjectTypePosition"
          + " AND agro.\"authorizationGroupUuid\" = :authorizationGroupUuid)");
      qb.addSqlArg("relatedObjectTypePosition", PositionDao.TABLE_NAME);
      qb.addSqlArg("authorizationGroupUuid", query.getAuthorizationGroupUuid());
    }

    if (query.getHasCounterparts()) {
      qb.addWhereClause(
          "(positions.uuid IN (SELECT \"positionUuid_a\" FROM \"positionRelationships\""
              + " WHERE \"positionUuid_b\" IS NOT NULL AND deleted = :deleted)"
              + " OR positions.uuid IN (SELECT \"positionUuid_b\" FROM \"positionRelationships\""
              + " WHERE \"positionUuid_a\" IS NOT NULL AND deleted = :deleted))");
      qb.addSqlArg("deleted", false);
    }

    if (query.getEmailNetwork() != null) {
      qb.addFromClause("JOIN \"emailAddresses\" \"posEmail\""
          + " ON \"posEmail\".\"relatedObjectType\" = '" + PositionDao.TABLE_NAME + "'"
          + " AND \"posEmail\".\"relatedObjectUuid\" = positions.uuid");
      qb.addStringEqualsClause("emailNetwork", "\"posEmail\".network", query.getEmailNetwork());
      qb.addIsNotNullOrEmptyClause("\"posEmail\".address");
    }

    addOrderByClauses(qb, query);
  }

  protected void addLocationUuidQuery(PositionSearchQuery query) {
    if (ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy())
        || ISearchQuery.RecurseStrategy.PARENTS.equals(query.getLocationRecurseStrategy())) {
      qb.addRecursiveClause(null, "positions", new String[] {"\"locationUuid\""},
          "parent_locations", "\"locationRelationships\"", "\"childLocationUuid\"",
          "\"parentLocationUuid\"", "locationUuid", query.getLocationUuid(),
          ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy()), true,
          null);
    } else {
      qb.addInListClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());
    }
  }

  @SuppressWarnings("unchecked")
  protected void addBatchClause(PositionSearchQuery query) {
    qb.addBatchClause((AbstractBatchParams<Position, PositionSearchQuery>) query.getBatchParams());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PositionSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "positions_createdAt"));
        break;
      case CODE:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "positions_code"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "positions_name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "positions_uuid"));
  }

}
