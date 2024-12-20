package mil.dds.anet.search.pg;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractAuthorizationGroupSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlAuthorizationGroupSearcher extends AbstractAuthorizationGroupSearcher {

  public PostgresqlAuthorizationGroupSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler,
        new PostgresqlSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery>(
            "PostgresqlAuthorizationGroupSearch"));
  }

  @Override
  protected void addTextQuery(AuthorizationGroupSearchQuery query) {
    addFullTextSearch("authorizationGroups", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AuthorizationGroupSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
