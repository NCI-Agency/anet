package mil.dds.anet.search;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
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

    if (Boolean.TRUE.equals(query.getDistributionList())) {
      qb.addObjectEqualsClause("distributionList", "\"authorizationGroups\".\"distributionList\"",
          true);
    }

    if (Boolean.TRUE.equals(query.getForSensitiveInformation())) {
      qb.addObjectEqualsClause("forSensitiveInformation",
          "\"authorizationGroups\".\"forSensitiveInformation\"", true);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          engine().getAuthorizationGroupDao().getSubscriptionUpdate(null)));
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
