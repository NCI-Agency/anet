package mil.dds.anet.search;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractOrganizationSearcher extends
    AbstractSearcher<Organization, OrganizationSearchQuery> implements IOrganizationSearcher {

  public AbstractOrganizationSearcher(
      AbstractSearchQueryBuilder<Organization, OrganizationSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new OrganizationMapper());
  }

  protected void buildQuery(OrganizationSearchQuery query) {
    qb.addSelectClause(OrganizationDao.ORGANIZATION_FIELDS);
    qb.addTotalCount();
    qb.addFromClause("organizations");

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      addBatchClause(query);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          AnetObjectEngine.getInstance().getOrganizationDao().getSubscriptionUpdate(null)));
    }

    qb.addEqualsClause("status", "organizations.status", query.getStatus());
    qb.addEqualsClause("type", "organizations.type", query.getType());

    if (query.getParentOrgUuid() != null) {
      addParentOrgUuidQuery(query);
    }

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(OrganizationSearchQuery query);

  @SuppressWarnings("unchecked")
  protected void addBatchClause(OrganizationSearchQuery query) {
    qb.addBatchClause(
        (AbstractBatchParams<Organization, OrganizationSearchQuery>) query.getBatchParams());
  }

  protected void addParentOrgUuidQuery(OrganizationSearchQuery query) {
    if (query.getParentOrgRecursively()) {
      qb.addRecursiveClause(null, "organizations", "\"uuid\"", "parent_orgs", "organizations",
          "\"parentOrgUuid\"", "parentOrgUuid", query.getParentOrgUuid(), true);
    } else {
      qb.addEqualsClause("parentOrgUuid", "organizations.\"parentOrgUuid\"",
          query.getParentOrgUuid());
    }
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      OrganizationSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "organizations", "\"createdAt\""));
        break;
      case TYPE:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "organizations", "type"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "organizations", "\"shortName\"",
            "\"longName\"", "\"identificationCode\""));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "organizations", "uuid"));
  }

}
