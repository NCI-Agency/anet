package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.search.AbstractAuthorizationGroupSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class MssqlAuthorizationGroupSearcher extends AbstractAuthorizationGroupSearcher {

  public MssqlAuthorizationGroupSearcher() {
    super(new MssqlSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery>(
        "MssqlAuthorizationGroupSearch"));
  }

  @Override
  protected void addTextQuery(AuthorizationGroupSearchQuery query) {
    if (!query.isSortByPresent()) {
      // If we're doing a full-text search without an explicit sort order, add a pseudo-rank (the
      // sum of all search ranks) so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now. See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      qb.addSelectClause(
          "ISNULL(c_authorizationGroups.rank, 0) + ISNULL(f_authorizationGroups.rank, 0)"
              + " AS search_rank");
    }
    qb.addFromClause(
        "LEFT JOIN CONTAINSTABLE (authorizationGroups, (name, description), :containsQuery) c_authorizationGroups"
            + " ON authorizationGroups.uuid = c_authorizationGroups.[Key]"
            + " LEFT JOIN FREETEXTTABLE(authorizationGroups, (name, description), :fullTextQuery) f_authorizationGroups"
            + " ON authorizationGroups.uuid = f_authorizationGroups.[Key]");
    qb.addWhereClause("c_authorizationGroups.rank IS NOT NULL");
    final String text = query.getText();
    qb.addSqlArg("containsQuery", qb.getContainsQuery(text));
    qb.addSqlArg("fullTextQuery", qb.getFullTextQuery(text));
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AuthorizationGroupSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
