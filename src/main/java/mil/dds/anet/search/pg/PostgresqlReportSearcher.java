package mil.dds.anet.search.pg;

import mil.dds.anet.search.sqlite.SqliteReportSearcher;

public class PostgresqlReportSearcher extends SqliteReportSearcher {

  public PostgresqlReportSearcher() {
    super("EXTRACT(ISODOW FROM \"%s\")");
  }

}
