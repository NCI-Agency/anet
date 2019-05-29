package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.ITagSearcher;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqliteTagSearcher extends AbstractSearcher implements ITagSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Tag> runSearch(TagSearchQuery query) {
    final SqliteSearchQueryBuilder<Tag, TagSearchQuery> qb =
        new SqliteSearchQueryBuilder<Tag, TagSearchQuery>("SqliteTagSearch");
    qb.addSelectClause("tags.*");
    qb.addFromClause("tags");

    if (query.isTextPresent()) {
      qb.addWhereClause(
          "(tags.name LIKE '%' || :text || '%' OR tags.description LIKE '%' || :text || '%')");
      final String text = query.getText();
      qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
    }

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new TagMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TagSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "tags", "createdAt"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "tags", "name"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "tags", "uuid"));
  }

}
