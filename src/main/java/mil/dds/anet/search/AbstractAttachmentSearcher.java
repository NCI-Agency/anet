package mil.dds.anet.search;

import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AttachmentSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.mappers.AttachmentMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractAttachmentSearcher
    extends AbstractSearcher<Attachment, AttachmentSearchQuery> implements IAttachmentSearcher {

  public AbstractAttachmentSearcher(
      AbstractSearchQueryBuilder<Attachment, AttachmentSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Attachment> runSearch(AttachmentSearchQuery query, Person user) {
    buildQuery(query, user);
    return qb.buildAndRun(getDbHandle(), query, new AttachmentMapper());
  }

  @Override
  protected void buildQuery(AttachmentSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void buildQuery(AttachmentSearchQuery query, Person user) {
    qb.addSelectClause(AttachmentDao.ATTACHMENT_FIELDS);
    qb.addFromClause("attachments");
    qb.addStringEqualsClause("authorUuid", "attachments.\"authorUuid\"", DaoUtils.getUuid(user));
    addOrderByClauses(qb, query);
  }

  @Override
  protected void addTextQuery(AttachmentSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AttachmentSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "attachments_createdAt"));
        break;
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "attachments_fileName"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(ISearchQuery.SortOrder.ASC, "attachments_uuid"));
  }
}
