package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.search.AbstractOrganizationSearcher;

public class PostgresqlOrganizationSearcher extends AbstractOrganizationSearcher {

  public PostgresqlOrganizationSearcher() {
    super(new PostgresqlSearchQueryBuilder<Organization, OrganizationSearchQuery>(""));
  }

  @Override
  protected void addTextQuery(OrganizationSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClauses("text",
        new String[] {"organizations.\"shortName\"", "organizations.\"longName\""}, text);
  }

}
