package mil.dds.anet.search.pg;

import mil.dds.anet.beans.search.AuditTrailSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractAuditTrailSearcher;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlAuditTrailSearcher extends AbstractAuditTrailSearcher {

  public PostgresqlAuditTrailSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler, new PostgresqlSearchQueryBuilder<>("PostgresqlAuditTrailSearch"));
  }

  @Override
  protected void addTextQuery(AuditTrailSearchQuery query) {
    // ignored
  }
}
