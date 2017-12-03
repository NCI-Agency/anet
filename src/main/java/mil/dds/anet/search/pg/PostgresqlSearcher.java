package mil.dds.anet.search.pg;

import mil.dds.anet.search.Searcher;
import mil.dds.anet.search.sqlite.SqliteLocationSearcher;
import mil.dds.anet.search.sqlite.SqliteOrganizationSearcher;
import mil.dds.anet.search.sqlite.SqlitePersonSearcher;
import mil.dds.anet.search.sqlite.SqlitePoamSearcher;
import mil.dds.anet.search.sqlite.SqlitePositionSearcher;
import mil.dds.anet.search.sqlite.SqliteReportSearcher;
import mil.dds.anet.search.sqlite.SqliteTagSearcher;

public class PostgresqlSearcher extends Searcher {

	public PostgresqlSearcher() {
		super(new SqliteReportSearcher("reports.\"%s\" %s :%s", null), new SqlitePersonSearcher(), new SqliteOrganizationSearcher(),
				new SqlitePositionSearcher(), new SqlitePoamSearcher(), new SqliteLocationSearcher(), new SqliteTagSearcher());
	}
}
