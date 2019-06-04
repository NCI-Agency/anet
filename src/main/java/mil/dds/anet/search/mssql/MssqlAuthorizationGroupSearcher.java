package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.search.AbstractAuthorizationGroupSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.utils.Utils;

public class MssqlAuthorizationGroupSearcher extends AbstractAuthorizationGroupSearcher {

  public MssqlAuthorizationGroupSearcher() {
    super(new MssqlSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery>(
        "MssqlAuthorizationGroupSearch"));
  }

  @Override
  protected void buildQuery(AuthorizationGroupSearchQuery query) {
    super.buildQuery(query);
    qb.addTotalCount();
  }

  @Override
  protected void addTextQuery(AuthorizationGroupSearchQuery query) {
    // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
    // so we can sort on it (show the most relevant hits at the top).
    // Note that summing up independent ranks is not ideal, but it's the best we can do now.
    // See
    // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
    qb.addSelectClause(
        "ISNULL(c_authorizationGroups.rank, 0) + ISNULL(f_authorizationGroups.rank, 0)"
            + " AS search_rank");
    qb.addFromClause(
        "LEFT JOIN CONTAINSTABLE (authorizationGroups, (name, description), :containsQuery) c_authorizationGroups"
            + " ON authorizationGroups.uuid = c_authorizationGroups.[Key]"
            + " LEFT JOIN FREETEXTTABLE(authorizationGroups, (name, description), :freetextQuery) f_authorizationGroups"
            + " ON authorizationGroups.uuid = f_authorizationGroups.[Key]");
    qb.addWhereClause("c_authorizationGroups.rank IS NOT NULL");
    final String text = query.getText();
    qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
    qb.addSqlArg("freetextQuery", text);
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AuthorizationGroupSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
