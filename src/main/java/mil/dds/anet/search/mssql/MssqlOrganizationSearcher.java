package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.search.AbstractOrganizationSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class MssqlOrganizationSearcher extends AbstractOrganizationSearcher {

  public MssqlOrganizationSearcher() {
    super(new MssqlSearchQueryBuilder<Organization, OrganizationSearchQuery>(
        "MssqlOrganizationSearch"));
  }

  @Override
  protected void addTextQuery(OrganizationSearchQuery query) {
    if (!query.isSortByPresent()) {
      // If we're doing a full-text search without an explicit sort order, add a pseudo-rank (giving
      // LIKE matches the highest possible score) so we can sort on it (show the most relevant hits
      // at the top).
      qb.addSelectClause("ISNULL(c_organizations.rank, 0)"
          + " + CASE WHEN organizations.shortName LIKE :likeQuery THEN 1000 ELSE 0 END"
          + " + CASE WHEN organizations.identificationCode LIKE :likeQuery THEN 1000 ELSE 0 END"
          + " AS search_rank");
    }
    qb.addFromClause(
        " LEFT JOIN CONTAINSTABLE (organizations, (longName), :containsQuery) c_organizations"
            + " ON organizations.uuid = c_organizations.[Key]");
    qb.addWhereClause(
        "(c_organizations.rank IS NOT NULL OR organizations.identificationCode LIKE :likeQuery"
            + " OR organizations.shortName LIKE :likeQuery)");
    final String text = query.getText();
    qb.addSqlArg("containsQuery", qb.getFullTextQuery(text));
    qb.addSqlArg("likeQuery", qb.getLikeQuery(text));
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      OrganizationSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
