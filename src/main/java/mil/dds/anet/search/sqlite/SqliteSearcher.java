package mil.dds.anet.search.sqlite;

import mil.dds.anet.search.Searcher;

public class SqliteSearcher extends Searcher {

	public SqliteSearcher() {
		super(new SqliteReportSearcher(), new SqlitePersonSearcher(), new SqliteOrganizationSearcher(),
				new SqlitePositionSearcher(), new SqliteTaskSearcher(), new SqliteLocationSearcher(), new SqliteTagSearcher(),
				new SqliteAuthorizationGroupSearcher(), new SqliteSubscriptionSearcher());
	}

}
