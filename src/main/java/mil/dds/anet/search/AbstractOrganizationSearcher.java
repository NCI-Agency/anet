package mil.dds.anet.search;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractOrganizationSearcher extends
    AbstractSearcher<Organization, OrganizationSearchQuery> implements IOrganizationSearcher {

  protected AbstractOrganizationSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<Organization, OrganizationSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new OrganizationMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(OrganizationSearchQuery query) {
    qb.addSelectClause(OrganizationDao.ORGANIZATION_FIELDS);
    qb.addFromClause("organizations");

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.isBatchParamsPresent()) {
      addBatchClause(query);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          engine().getOrganizationDao().getSubscriptionUpdate(null, false)));
    }

    qb.addEnumEqualsClause("status", "organizations.status", query.getStatus());

    if (query.getHasParentOrg() != null) {
      if (query.getHasParentOrg()) {
        qb.addWhereClause("organizations.\"parentOrgUuid\" IS NOT NULL");
      } else {
        qb.addWhereClause("organizations.\"parentOrgUuid\" IS NULL");
      }
    }

    if (query.getHasProfile() != null) {
      if (query.getHasProfile()) {
        qb.addWhereClause("organizations.profile IS NOT NULL");
      } else {
        qb.addWhereClause("organizations.profile IS NULL");
      }
    }

    if (!Utils.isEmptyOrNull(query.getParentOrgUuid())) {
      addParentOrgUuidQuery(query);
    }

    if (!Utils.isEmptyOrNull(query.getLocationUuid())) {
      addLocationUuidQuery(query);
    }

    if (query.getAssessment() != null && query.getAssessment().key() != null) {
      addAssessmentQuery(query.getAssessment(), OrganizationDao.TABLE_NAME, "organization");
    }

    if (query.getEmailNetwork() != null) {
      qb.addFromClause("JOIN \"emailAddresses\" \"orgEmail\""
          + " ON \"orgEmail\".\"relatedObjectType\" = '" + OrganizationDao.TABLE_NAME + "'"
          + " AND \"orgEmail\".\"relatedObjectUuid\" = organizations.uuid");
      qb.addStringEqualsClause("emailNetwork", "\"orgEmail\".network", query.getEmailNetwork());
      qb.addIsNotNullOrEmptyClause("\"orgEmail\".address");
    }

    addOrderByClauses(qb, query);
  }

  @SuppressWarnings("unchecked")
  protected void addBatchClause(OrganizationSearchQuery query) {
    qb.addBatchClause(
        (AbstractBatchParams<Organization, OrganizationSearchQuery>) query.getBatchParams());
  }

  protected void addParentOrgUuidQuery(OrganizationSearchQuery query) {
    if (RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy())
        || RecurseStrategy.PARENTS.equals(query.getOrgRecurseStrategy())) {
      qb.addRecursiveClause(null, "organizations", "\"uuid\"", "parent_orgs", "organizations",
          "\"parentOrgUuid\"", "parentOrgUuid", query.getParentOrgUuid(),
          RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy()), null);
    } else {
      qb.addInListClause("parentOrgUuid", "organizations.\"parentOrgUuid\"",
          query.getParentOrgUuid());
    }
  }

  protected void addLocationUuidQuery(OrganizationSearchQuery query) {
    if (ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy())
        || ISearchQuery.RecurseStrategy.PARENTS.equals(query.getLocationRecurseStrategy())) {
      qb.addRecursiveClause(null, "organizations", new String[] {"\"locationUuid\""},
          "parent_locations", "\"locationRelationships\"", "\"childLocationUuid\"",
          "\"parentLocationUuid\"", "locationUuid", query.getLocationUuid(),
          ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy()), true,
          null);
    } else {
      qb.addInListClause("locationUuid", "organizations.\"locationUuid\"", query.getLocationUuid());
    }
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      OrganizationSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "organizations_createdAt"));
        break;
      case TYPE:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "organizations_type"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "organizations_shortName",
            "organizations_longName", "organizations_identificationCode"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "organizations_uuid"));
  }

}
