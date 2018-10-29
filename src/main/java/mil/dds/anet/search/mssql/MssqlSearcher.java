package mil.dds.anet.search.mssql;

import java.util.List;
import java.util.Map;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;

import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.search.Searcher;

public class MssqlSearcher extends Searcher {

	public MssqlSearcher() { 
		super(new MssqlReportSearcher(), new MssqlPersonSearcher(), new MssqlOrganizationSearcher(),
				new MssqlPositionSearcher(), new MssqlTaskSearcher(), new MssqlLocationSearcher(), new MssqlTagSearcher(),
				new MssqlAuthorizationGroupSearcher());
	}

	protected static Query addPagination(AbstractSearchQuery query,
			Handle dbHandle, StringBuilder sql, Map<String, Object> args) {
		if (query.getPageSize() > 0) {
			sql.append(" OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY");
		}
		final Query q = dbHandle.createQuery(sql.toString())
				.bindMap(args);
		if (query.getPageSize() > 0) {
			q.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize());
		}
		return q;
	}

	protected static Query addPagination(AbstractSearchQuery query,
			Handle dbHandle, StringBuilder sql, Map<String, Object> args, Map<String, List<?>> listArgs) {
		final Query q = addPagination(query, dbHandle, sql, args);
		for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
			q.bindList(listArg.getKey(), listArg.getValue());
		}
		return q;
	}

}
