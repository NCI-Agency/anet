package mil.dds.anet.search.pg;

import mil.dds.anet.search.AbstractAttachmentSearcher;

public class PostgresqlAttachmentSearcher extends AbstractAttachmentSearcher {

  public PostgresqlAttachmentSearcher() {
    super(new PostgresqlSearchQueryBuilder<>("PostgresqlAttachmentSearch"));
  }
}
