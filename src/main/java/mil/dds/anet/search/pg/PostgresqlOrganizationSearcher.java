package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.search.AbstractOrganizationSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class PostgresqlOrganizationSearcher extends AbstractOrganizationSearcher {

  public PostgresqlOrganizationSearcher() {
    super(new PostgresqlSearchQueryBuilder<Organization, OrganizationSearchQuery>(
        "PostgresqlOrganizationSearch"));
  }

  @Override
  protected void addTextQuery(OrganizationSearchQuery query) {
    addFullTextSearch("organizations", query.getText(), query.isSortByPresent());
  }

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
