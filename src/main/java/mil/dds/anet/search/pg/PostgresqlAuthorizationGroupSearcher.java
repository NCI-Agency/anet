package mil.dds.anet.search.pg;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.search.AbstractAuthorizationGroupSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class PostgresqlAuthorizationGroupSearcher extends AbstractAuthorizationGroupSearcher {

  public PostgresqlAuthorizationGroupSearcher() {
    super(new PostgresqlSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery>(
        "PostgresqlAuthorizationGroupSearch"));
  }

  @Override
  protected void addTextQuery(AuthorizationGroupSearchQuery query) {
    addFullTextSearch("authorizationGroups", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AuthorizationGroupSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
