package mil.dds.anet.search.pg;

import mil.dds.anet.search.Searcher;
import mil.dds.anet.search.sqlite.SqliteAuthorizationGroupSearcher;
import mil.dds.anet.search.sqlite.SqliteLocationSearcher;
import mil.dds.anet.search.sqlite.SqliteOrganizationSearcher;
import mil.dds.anet.search.sqlite.SqlitePersonSearcher;
import mil.dds.anet.search.sqlite.SqlitePositionSearcher;
import mil.dds.anet.search.sqlite.SqliteReportSearcher;
import mil.dds.anet.search.sqlite.SqliteTagSearcher;
import mil.dds.anet.search.sqlite.SqliteTaskSearcher;

public class PostgresqlSearcher extends Searcher {

	public PostgresqlSearcher() {
		 super(
			new SqliteReportSearcher("EXTRACT(ISODOW FROM reports.\"%s\")"),
			new SqlitePersonSearcher(), new SqliteOrganizationSearcher(), new SqlitePositionSearcher(),
			new SqliteTaskSearcher(), new SqliteLocationSearcher(), new SqliteTagSearcher(),
			new SqliteAuthorizationGroupSearcher()
		);
	}
}
