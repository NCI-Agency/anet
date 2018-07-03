package mil.dds.anet.search.mssql;

import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.search.Searcher;

public class MssqlSearcher extends Searcher {

	public MssqlSearcher() { 
		super(new MssqlReportSearcher(), new MssqlPersonSearcher(), new MssqlOrganizationSearcher(),
				new MssqlPositionSearcher(), new MssqlTaskSearcher(), new MssqlLocationSearcher(), new MssqlTagSearcher(),
				new MssqlAuthorizationGroupSearcher());
	}

	protected static Query<Map<String, Object>> addPagination(AbstractSearchQuery query,
			Handle dbHandle, StringBuilder sql, Map<String, Object> args) {
		if (query.getPageSize() > 0) {
			sql.append(" OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY");
		}
		final Query<Map<String, Object>> q = dbHandle.createQuery(sql.toString())
				.bindFromMap(args);
		if (query.getPageSize() > 0) {
			q.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize());
		}
		return q;
	}

}
