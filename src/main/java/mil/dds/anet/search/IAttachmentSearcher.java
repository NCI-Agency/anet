package mil.dds.anet.search;

import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AttachmentSearchQuery;

public interface IAttachmentSearcher {
  AnetBeanList<Attachment> runSearch(AttachmentSearchQuery query);
}
