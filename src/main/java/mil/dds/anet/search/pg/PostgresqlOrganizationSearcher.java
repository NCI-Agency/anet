package mil.dds.anet.search.pg;

import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractOrganizationSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlOrganizationSearcher extends AbstractOrganizationSearcher {

  public PostgresqlOrganizationSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler, new PostgresqlSearchQueryBuilder<>("PostgresqlOrganizationSearch"));
  }

  @Override
  protected void addTextQuery(OrganizationSearchQuery query) {
    addFullTextSearch("organizations", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      OrganizationSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
