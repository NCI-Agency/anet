package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.search.ITagSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlTagSearcher extends AbstractMssqlSearcherBase<Tag, TagSearchQuery>
    implements ITagSearcher {

  public AnetBeanList<Tag> runSearch(TagSearchQuery query) {
    start("MssqlTagSearch");
    sql.append("SELECT tags.*");

    final String text = query.getText();
    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
      // so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now.
      // See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      sql.append(", ISNULL(c_tags.rank, 0) + ISNULL(f_tags.rank, 0)");
      sql.append(" AS search_rank");
    }
    sql.append(", count(*) over() as totalCount FROM tags");

    if (query.isTextPresent()) {
      sql.append(" LEFT JOIN CONTAINSTABLE (tags, (name, description), :containsQuery) c_tags"
          + " ON tags.uuid = c_tags.[Key]"
          + " LEFT JOIN FREETEXTTABLE(tags, (name, description), :freetextQuery) f_tags"
          + " ON tags.uuid = f_tags.[Key]");
      whereClauses.add("c_tags.rank IS NOT NULL");
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
      sqlArgs.put("freetextQuery", text);
    }

    finish(query);
    return getResult(query, new TagMapper());
  }

  @Override
  protected void getOrderByClauses(TagSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "tags", "createdAt"));
        break;
      case NAME:
      default:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "tags", "name"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "tags", "uuid"));
  }

}
