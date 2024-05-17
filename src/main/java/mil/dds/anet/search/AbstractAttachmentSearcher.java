package mil.dds.anet.search;

import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AttachmentSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.mappers.AttachmentMapper;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractAttachmentSearcher
    extends AbstractSearcher<Attachment, AttachmentSearchQuery> implements IAttachmentSearcher {

  public AbstractAttachmentSearcher(
      AbstractSearchQueryBuilder<Attachment, AttachmentSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Attachment> runSearch(AttachmentSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new AttachmentMapper());
  }

  @Override
  protected void buildQuery(AttachmentSearchQuery query) {
    qb.addSelectClause(AttachmentDao.ATTACHMENT_FIELDS);
    qb.addFromClause("attachments");

    // Filter out avatars
    qb.addWhereClause("attachments.uuid NOT IN "
        + "(SELECT \"avatarUuid\" FROM people WHERE \"avatarUuid\" IS NOT NULL)");

    if (query.getUser() != null && query.getSubscribed()) {
      // Should never match
      qb.addWhereClause("FALSE");
    }

    if (query.getEmailNetwork() != null) {
      // Should never match
      qb.addWhereClause("FALSE");
    }

    qb.addStringEqualsClause("mimeType", "attachments.\"mimeType\"", query.getMimeType());

    if (query.getClassification() != null) {
      if ("".equals(query.getClassification())) {
        qb.addIsNullOrEmptyClause("attachments.classification");
      } else {
        qb.addStringEqualsClause("classification", "attachments.classification",
            query.getClassification());
      }
    }

    qb.addStringEqualsClause("authorUuid", "attachments.\"authorUuid\"", query.getAuthorUuid());

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    addOrderByClauses(qb, query);
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
