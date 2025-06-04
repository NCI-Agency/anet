package mil.dds.anet.search.pg;

import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractMartImportedReportSearcher;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlMartImportedReportSearcher extends AbstractMartImportedReportSearcher {

  public PostgresqlMartImportedReportSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler,
        new PostgresqlSearchQueryBuilder<>("PostgresqlMartImportedReportSearch"));
  }
}
