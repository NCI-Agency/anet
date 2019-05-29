package mil.dds.anet.search;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.utils.Utils;
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
    qb.addFromClause("organizations");

    if (query.isTextPresent()) {
      addTextQuery(query);
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
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), "organizations", "\"createdAt\""));
        break;
      case TYPE:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "organizations", "type"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "organizations",
            "\"shortName\"", "\"longName\"", "\"identificationCode\""));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "organizations", "uuid"));
  }

}
