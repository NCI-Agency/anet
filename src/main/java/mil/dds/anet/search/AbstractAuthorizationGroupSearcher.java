package mil.dds.anet.search;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractAuthorizationGroupSearcher
    extends AbstractSearcher<AuthorizationGroup, AuthorizationGroupSearchQuery>
    implements IAuthorizationGroupSearcher {

  protected AbstractAuthorizationGroupSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<AuthorizationGroup> runSearch(AuthorizationGroupSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new AuthorizationGroupMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(AuthorizationGroupSearchQuery query) {
    qb.addSelectClause(AuthorizationGroupDao.AUTHORIZATION_GROUP_FIELDS);
    qb.addFromClause("\"authorizationGroups\"");

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    qb.addEnumEqualsClause("status", "\"authorizationGroups\".status", query.getStatus());

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          engine().getAuthorizationGroupDao().getSubscriptionUpdate(null)));
    }

    if (Boolean.TRUE.equals(query.isInMyReports())) {
      qb.addSelectClause("\"inMyReports\".max AS \"inMyReports_max\"");
      qb.addFromClause("JOIN ("
          + "  SELECT \"reportAuthorizationGroups\".\"authorizationGroupUuid\" AS uuid, MAX(reports.\"createdAt\") AS max"
          + "  FROM reports"
          + "  JOIN \"reportAuthorizationGroups\" ON reports.uuid = \"reportAuthorizationGroups\".\"reportUuid\""
          + "  WHERE reports.uuid IN (SELECT \"reportUuid\" FROM \"reportPeople\""
          + "    WHERE \"isAuthor\" = :isAuthor AND \"personUuid\" = :userUuid)"
          + "  GROUP BY \"reportAuthorizationGroups\".\"authorizationGroupUuid\""
          + ") \"inMyReports\" ON \"authorizationGroups\".uuid = \"inMyReports\".uuid");
      qb.addSqlArg("isAuthor", true);
      qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
    }

    if (query.getEmailNetwork() != null) {
      qb.addFromClause("JOIN \"authorizationGroupRelatedObjects\" agro"
          + " ON agro.\"authorizationGroupUuid\" = \"authorizationGroups\".uuid"
          + " LEFT JOIN \"emailAddresses\" \"agroEmail\""
          + " ON agro.\"relatedObjectType\" = \"agroEmail\".\"relatedObjectType\""
          + " AND agro.\"relatedObjectUuid\" = \"agroEmail\".\"relatedObjectUuid\"");
      qb.addStringEqualsClause("emailNetwork", "\"agroEmail\".network", query.getEmailNetwork());
      qb.addIsNotNullOrEmptyClause("\"agroEmail\".address");
    }

    addOrderByClauses(qb, query);
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AuthorizationGroupSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "authorizationGroups_createdAt"));
        break;
      case RECENT:
        if (Boolean.TRUE.equals(query.isInMyReports())) {
          // Otherwise the JOIN won't exist
          qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "inMyReports_max"));
        }
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "authorizationGroups_name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "authorizationGroups_uuid"));
  }

}
