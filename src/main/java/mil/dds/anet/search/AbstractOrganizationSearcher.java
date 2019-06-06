package mil.dds.anet.search;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
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
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query, Person user) {
    buildQuery(query, user);
    return qb.buildAndRun(getDbHandle(), query, new OrganizationMapper());
  }

  @Override
  protected final void buildQuery(OrganizationSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void buildQuery(OrganizationSearchQuery query, Person user) {
    qb.addFromClause("organizations");

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    if (user != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(user, qb.getSqlArgs(),
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

  protected abstract void addParentOrgUuidQuery(OrganizationSearchQuery query);

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
