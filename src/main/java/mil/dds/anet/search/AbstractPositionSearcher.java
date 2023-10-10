package mil.dds.anet.search;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.PendingAssessmentsHelper;
import org.jdbi.v3.core.Handle;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractPositionSearcher
    extends AbstractSearcher<Position, PositionSearchQuery> implements IPositionSearcher {

  public AbstractPositionSearcher(AbstractSearchQueryBuilder<Position, PositionSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Position> runSearch(PositionSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new PositionMapper());
  }

  @Override
  public CompletableFuture<AnetBeanList<Position>> runSearch(Map<String, Object> context,
      PositionSearchQuery query) {
    // Asynchronous version of search; should be wrapped in a transaction by the GraphQlResource
    // handling the request
    final Handle dbHandle = getDbHandle();
    final PositionMapper mapper = new PositionMapper();
    buildQuery(query);
    if (!query.getHasPendingAssessments()) {
      return CompletableFuture.completedFuture(qb.buildAndRun(dbHandle, query, mapper));
    }

    // Filter to only the positions with pending assessments
    final Instant now = Instant.now().atZone(DaoUtils.getServerNativeZoneId()).toInstant();
    return new PendingAssessmentsHelper(AnetObjectEngine.getConfiguration())
        .loadAll(context, now, null, false).thenApply(otaMap -> {
          return otaMap.keySet().stream().map(p -> p.getUuid()).collect(Collectors.toList());
        }).thenCompose(positionUuids -> {
          qb.addInListClause("positionUuids", "positions.uuid", positionUuids);
          return CompletableFuture.completedFuture(qb.buildAndRun(dbHandle, query, mapper));
        });
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
          AnetObjectEngine.getInstance().getPositionDao().getSubscriptionUpdate(null)));
    }

    qb.addInClause("types", "positions.type", query.getType());

    if (query.getOrganizationUuid() != null) {
      if (RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy())
          || RecurseStrategy.PARENTS.equals(query.getOrgRecurseStrategy())) {
        qb.addRecursiveClause(null, "positions", "\"organizationUuid\"", "parent_orgs",
            "organizations", "\"parentOrgUuid\"", "orgUuid", query.getOrganizationUuid(),
            RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy()));
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

    qb.addStringEqualsClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());
    qb.addEnumEqualsClause("status", "positions.status", query.getStatus());

    if (query.getAuthorizationGroupUuid() != null) {
      // Search for positions related to a given authorization group
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

    addOrderByClauses(qb, query);
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
