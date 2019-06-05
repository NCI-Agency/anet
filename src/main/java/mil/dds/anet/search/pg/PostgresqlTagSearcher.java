package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.search.AbstractTagSearcher;

public class PostgresqlTagSearcher extends AbstractTagSearcher {

  public PostgresqlTagSearcher() {
    super(new PostgresqlSearchQueryBuilder<Tag, TagSearchQuery>("PostgresqlTagSearch"));
  }

  @Override
  protected void addTextQuery(TagSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClauses("text", new String[] {"tags.name", "tags.description"}, text);
  }

}
