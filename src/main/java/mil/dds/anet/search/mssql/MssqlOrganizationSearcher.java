package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.search.AbstractOrganizationSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.utils.Utils;

public class MssqlOrganizationSearcher extends AbstractOrganizationSearcher {

  public MssqlOrganizationSearcher() {
    super(new MssqlSearchQueryBuilder<Organization, OrganizationSearchQuery>(
        "MssqlOrganizationSearch"));
  }

  @Override
  protected void buildQuery(OrganizationSearchQuery query) {
    super.buildQuery(query);
    qb.addTotalCount();
  }

  @Override
  protected void addTextQuery(OrganizationSearchQuery query) {
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
    qb.addWhereClause(
        "(c_organizations.rank IS NOT NULL" + " OR organizations.identificationCode LIKE :likeQuery"
            + " OR organizations.shortName LIKE :likeQuery)");
    final String text = query.getText();
    qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
    qb.addSqlArg("likeQuery", Utils.prepForLikeQuery(text) + "%");
  }

  @Override
  protected void addParentOrgUuidQuery(OrganizationSearchQuery query) {
    if (Boolean.TRUE.equals(query.getParentOrgRecursively())) {
      qb.addWithClause("parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :parentOrgUuid UNION ALL"
          + " SELECT o.uuid FROM parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid AND o.uuid != :parentOrgUuid"
          + ")");
      qb.addWhereClause("(organizations.parentOrgUuid IN (SELECT uuid FROM parent_orgs)"
          + " OR organizations.uuid = :parentOrgUuid)");
    } else {
      qb.addWhereClause("organizations.parentOrgUuid = :parentOrgUuid");
    }
    qb.addSqlArg("parentOrgUuid", query.getParentOrgUuid());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      OrganizationSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
