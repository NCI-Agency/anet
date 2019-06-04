package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.search.AbstractAuthorizationGroupSearcher;

public class SqliteAuthorizationGroupSearcher extends AbstractAuthorizationGroupSearcher {

  public SqliteAuthorizationGroupSearcher() {
    super(new SqliteSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery>(
        "SqliteAuthorizationGroupSearch"));
  }

  @Override
  protected void addTextQuery(AuthorizationGroupSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClauses("text",
        new String[] {"\"authorizationGroup\".name", "\"authorizationGroup\".description"}, text);
  }

}
