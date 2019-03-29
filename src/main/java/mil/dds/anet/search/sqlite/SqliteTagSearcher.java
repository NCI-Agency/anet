package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.ITagSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteTagSearcher extends AbstractSearcherBase implements ITagSearcher {

  @Override
  public AnetBeanList<Tag> runSearch(TagSearchQuery query) {
    final AnetBeanList<Tag> result =
        new AnetBeanList<Tag>(query.getPageNum(), query.getPageSize(), new ArrayList<Tag>());
    final String text = query.getText();
    final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
    if (!doFullTextSearch) {
      return result;
    }

    result.setList(getDbHandle()
        .createQuery("/* SqliteTagSearch */ SELECT * FROM tags "
            + "WHERE name LIKE '%' || :text || '%' " + "OR description LIKE '%' || :text || '%' "
            + "ORDER BY name ASC LIMIT :limit OFFSET :offset")
        .bind("text", Utils.getSqliteFullTextQuery(text))
        .bind("offset", query.getPageSize() * query.getPageNum()).bind("limit", query.getPageSize())
        .map(new TagMapper()).list());
    // Sqlite cannot do true total counts, so this is a crutch.
    result.setTotalCount(result.getList().size());
    return result;
  }

}
