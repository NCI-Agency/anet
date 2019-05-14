package mil.dds.anet.search.mssql;

import com.google.inject.Injector;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.search.Searcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;

public class MssqlSearcher extends Searcher {

  public MssqlSearcher(Injector injector) {
    super(injector.getInstance(MssqlReportSearcher.class),
        injector.getInstance(MssqlPersonSearcher.class),
        injector.getInstance(MssqlOrganizationSearcher.class),
        injector.getInstance(MssqlPositionSearcher.class),
        injector.getInstance(MssqlTaskSearcher.class),
        injector.getInstance(MssqlLocationSearcher.class),
        injector.getInstance(MssqlTagSearcher.class),
        injector.getInstance(MssqlAuthorizationGroupSearcher.class),
        injector.getInstance(MssqlSubscriptionSearcher.class),
        injector.getInstance(MssqlSubscriptionUpdateSearcher.class));
  }

  protected static Query addPagination(AbstractSearchQuery query, Handle dbHandle,
      StringBuilder sql, Map<String, Object> args) {
    if (query.getPageSize() > 0) {
      sql.append(" OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY");
    }
    final Query q = dbHandle.createQuery(sql.toString());
    if (args != null && !args.isEmpty()) {
      q.bindMap(args);
    }
    if (query.getPageSize() > 0) {
      q.bind("offset", query.getPageSize() * query.getPageNum()).bind("limit", query.getPageSize());
    }
    return q;
  }

  protected static Query addPagination(AbstractSearchQuery query, Handle dbHandle,
      StringBuilder sql, Map<String, Object> args, Map<String, List<?>> listArgs) {
    final Query q = addPagination(query, dbHandle, sql, args);
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(listArg.getKey(), listArg.getValue());
    }
    return q;
  }

}
