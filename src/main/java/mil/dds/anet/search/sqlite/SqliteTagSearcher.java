package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.search.AbstractTagSearcher;

public class SqliteTagSearcher extends AbstractTagSearcher {

  public SqliteTagSearcher() {
    super(new SqliteSearchQueryBuilder<Tag, TagSearchQuery>("SqliteTagSearch"));
  }

  @Override
  protected void addTextQuery(TagSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClauses("text", new String[] {"tags.name", "tags.description"}, text);
  }

}
