package mil.dds.anet.search.pg;

import com.google.inject.Injector;

import mil.dds.anet.search.Searcher;
import mil.dds.anet.search.sqlite.SqliteAuthorizationGroupSearcher;
import mil.dds.anet.search.sqlite.SqliteLocationSearcher;
import mil.dds.anet.search.sqlite.SqliteOrganizationSearcher;
import mil.dds.anet.search.sqlite.SqlitePersonSearcher;
import mil.dds.anet.search.sqlite.SqlitePositionSearcher;
import mil.dds.anet.search.sqlite.SqliteSubscriptionSearcher;
import mil.dds.anet.search.sqlite.SqliteTagSearcher;
import mil.dds.anet.search.sqlite.SqliteTaskSearcher;

public class PostgresqlSearcher extends Searcher {

	public PostgresqlSearcher(Injector injector) {
		super(
			injector.getInstance(PostgresqlReportSearcher.class),
			injector.getInstance(SqlitePersonSearcher.class),
			injector.getInstance(SqliteOrganizationSearcher.class),
			injector.getInstance(SqlitePositionSearcher.class),
			injector.getInstance(SqliteTaskSearcher.class),
			injector.getInstance(SqliteLocationSearcher.class),
			injector.getInstance(SqliteTagSearcher.class),
			injector.getInstance(SqliteAuthorizationGroupSearcher.class),
			new SqliteSubscriptionSearcher()
		);
	}
}
