package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlOrganizationSearcher extends AbstractSearcher implements IOrganizationSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query) {
    final MssqlSearchQueryBuilder<Organization, OrganizationSearchQuery> qb =
        new MssqlSearchQueryBuilder<Organization, OrganizationSearchQuery>(
            "MssqlOrganizationSearch");
    qb.addSelectClause(OrganizationDao.ORGANIZATION_FIELDS);
    qb.addSelectClause("count(*) OVER() AS totalCount");
    qb.addFromClause("organizations");

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (giving LIKE matches the highest
      // possible score)
      // so we can sort on it (show the most relevant hits at the top).
      qb.addSelectClause("ISNULL(c_organizations.rank, 0)"
          + " + CASE WHEN organizations.shortName LIKE :likeQuery THEN 1000 ELSE 0 END"
          + " + CASE WHEN organizations.identificationCode LIKE :likeQuery THEN 1000 ELSE 0 END"
          + " AS search_rank");
      qb.addFromClause(
          " LEFT JOIN CONTAINSTABLE (organizations, (longName), :containsQuery) c_organizations"
              + " ON organizations.uuid = c_organizations.[Key]");
      qb.addWhereClause("(c_organizations.rank IS NOT NULL"
          + " OR organizations.identificationCode LIKE :likeQuery"
          + " OR organizations.shortName LIKE :likeQuery)");
      final String text = query.getText();
      qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
      qb.addSqlArg("likeQuery", Utils.prepForLikeQuery(text) + "%");
    }

    qb.addEqualsClause("status", "organizations.status", query.getStatus());
    qb.addEqualsClause("type", "organizations.type", query.getType());

    if (query.getParentOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getParentOrgRecursively())) {
        qb.addWithClause("parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :parentOrgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid AND o.uuid != :parentOrgUuid"
            + ")");
        qb.addWhereClause("(organizations.parentOrgUuid IN (SELECT uuid from parent_orgs)"
            + " OR organizations.uuid = :parentOrgUuid)");
      } else {
        qb.addWhereClause("organizations.parentOrgUuid = :parentOrgUuid");
      }
      qb.addSqlArg("parentOrgUuid", query.getParentOrgUuid());
    }

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new OrganizationMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      OrganizationSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), "organizations", "createdAt"));
        break;
      case TYPE:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "organizations", "type"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "organizations", "shortName",
            "longName", "identificationCode"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "organizations", "uuid"));
  }

}
