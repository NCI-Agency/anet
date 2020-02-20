package mil.dds.anet.search;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractTagSearcher extends AbstractSearcher<Tag, TagSearchQuery>
    implements ITagSearcher {

  public AbstractTagSearcher(AbstractSearchQueryBuilder<Tag, TagSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Tag> runSearch(TagSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new TagMapper());
  }

  @Override
  protected void buildQuery(TagSearchQuery query) {
    qb.addSelectClause("tags.*");
    qb.addTotalCount();
    qb.addFromClause("tags");

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(TagSearchQuery query);

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TagSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tags", "\"createdAt\""));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "tags", "name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "tags", "uuid"));
  }

}
