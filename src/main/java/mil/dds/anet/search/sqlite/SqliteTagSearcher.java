package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.search.AbstractTagSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteTagSearcher extends AbstractTagSearcher {

  public SqliteTagSearcher() {
    super(new SqliteSearchQueryBuilder<Tag, TagSearchQuery>("SqliteTagSearch"));
  }

  @Override
  protected void addTextQuery(TagSearchQuery query) {
    qb.addWhereClause(
        "(tags.name LIKE '%' || :text || '%' OR tags.description LIKE '%' || :text || '%')");
    final String text = query.getText();
    qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
  }

}
