package mil.dds.anet.search.pg;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.search.AbstractAuthorizationGroupSearcher;

public class PostgresqlAuthorizationGroupSearcher extends AbstractAuthorizationGroupSearcher {

  public PostgresqlAuthorizationGroupSearcher() {
    super(new PostgresqlSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery>(
        "PostgresqlAuthorizationGroupSearch"));
  }

  @Override
  protected void addTextQuery(AuthorizationGroupSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClauses("text",
        new String[] {"\"authorizationGroup\".name", "\"authorizationGroup\".description"}, text);
  }

}
