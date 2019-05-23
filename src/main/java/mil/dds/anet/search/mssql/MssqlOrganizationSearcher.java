package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlOrganizationSearcher
    extends AbstractMssqlSearcherBase<Organization, OrganizationSearchQuery>
    implements IOrganizationSearcher {

  @Override
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query) {
    start("MssqlOrganizationSearch");
    selectClauses.add(OrganizationDao.ORGANIZATION_FIELDS);
    selectClauses.add("count(*) OVER() AS totalCount");
    fromClauses.add("organizations");

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (giving LIKE matches the highest
      // possible score)
      // so we can sort on it (show the most relevant hits at the top).
      selectClauses.add("ISNULL(c_organizations.rank, 0)"
          + " + CASE WHEN organizations.shortName LIKE :likeQuery THEN 1000 ELSE 0 END"
          + " + CASE WHEN organizations.identificationCode LIKE :likeQuery THEN 1000 ELSE 0 END"
          + " AS search_rank");
      fromClauses.add(
          " LEFT JOIN CONTAINSTABLE (organizations, (longName), :containsQuery) c_organizations"
              + " ON organizations.uuid = c_organizations.[Key]");
      whereClauses.add("(c_organizations.rank IS NOT NULL"
          + " OR organizations.identificationCode LIKE :likeQuery"
          + " OR organizations.shortName LIKE :likeQuery)");
      final String text = query.getText();
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
      sqlArgs.put("likeQuery", Utils.prepForLikeQuery(text) + "%");
    }

    addEqualsClause("status", "organizations.status", query.getStatus());
    addEqualsClause("type", "organizations.type", query.getType());

    if (query.getParentOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getParentOrgRecursively())) {
        withClauses.add("parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :parentOrgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid AND o.uuid != :parentOrgUuid"
            + ")");
        whereClauses.add("(organizations.parentOrgUuid IN (SELECT uuid from parent_orgs)"
            + " OR organizations.uuid = :parentOrgUuid)");
      } else {
        whereClauses.add("organizations.parentOrgUuid = :parentOrgUuid");
      }
      sqlArgs.put("parentOrgUuid", query.getParentOrgUuid());
    }

    finish(query);
    return getResult(query, new OrganizationMapper());
  }

  @Override
  protected void getOrderByClauses(OrganizationSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "organizations", "createdAt"));
        break;
      case TYPE:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "organizations", "type"));
        break;
      case NAME:
      default:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "organizations", "shortName",
            "longName", "identificationCode"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "organizations", "uuid"));
  }

}
