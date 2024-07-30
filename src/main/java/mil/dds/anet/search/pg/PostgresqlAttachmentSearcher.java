package mil.dds.anet.search.pg;

import mil.dds.anet.beans.search.AttachmentSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractAttachmentSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlAttachmentSearcher extends AbstractAttachmentSearcher {

  public PostgresqlAttachmentSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler, new PostgresqlSearchQueryBuilder<>("PostgresqlAttachmentSearch"));
  }

  @Override
  protected void addTextQuery(AttachmentSearchQuery query) {
    addFullTextSearch("attachments", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AttachmentSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(ISearchQuery.SortOrder.DESC, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }
}
