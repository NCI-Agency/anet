package mil.dds.anet.search.sqlite;

import mil.dds.anet.search.Searcher;
import mil.dds.anet.search.IAuthorizationGroupSearcher;

public class SqliteSearcher extends Searcher {

	public SqliteSearcher() {
		super(new SqliteReportSearcher(), new SqlitePersonSearcher(), new SqliteOrganizationSearcher(),
				new SqlitePositionSearcher(), new SqliteTaskSearcher(), new SqliteLocationSearcher(), new SqliteTagSearcher());
	}

}
