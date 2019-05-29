package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.search.AbstractAuthorizationGroupSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteAuthorizationGroupSearcher extends AbstractAuthorizationGroupSearcher {

  public SqliteAuthorizationGroupSearcher() {
    super(new SqliteSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery>(
        "SqliteAuthorizationGroupSearch"));
  }

  @Override
  protected void addTextQuery(AuthorizationGroupSearchQuery query) {
    qb.addWhereClause(
        "(\"authorizationGroupUuid\".name LIKE '%' || :text || '%' OR \"authorizationGroupUuid\".description LIKE '%' || :text || '%')");
    final String text = query.getText();
    qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
  }

}
