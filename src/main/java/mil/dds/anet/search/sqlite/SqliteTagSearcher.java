package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.search.ITagSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteTagSearcher extends AbstractSqliteSearcherBase<Tag, TagSearchQuery>
    implements ITagSearcher {

  @Override
  public AnetBeanList<Tag> runSearch(TagSearchQuery query) {
    start("SqliteTagSearch");
    sql.append("SELECT * FROM tags");

    if (query.isTextPresent()) {
      final String text = query.getText();
      whereClauses
          .add("(name LIKE '%' || :text || '%' " + "OR description LIKE '%' || :text || '%')");
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    finish(query);
    return getResult(query, new TagMapper());
  }

  @Override
  protected void getOrderByClauses(TagSearchQuery query) {
    orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "tags", "name"));
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "tags", "uuid"));
  }

}
