package mil.dds.anet.search.sqlite;

import com.google.inject.Injector;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.search.Searcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;

public class SqliteSearcher extends Searcher {

  public SqliteSearcher(Injector injector) {
    super(injector.getInstance(SqliteReportSearcher.class),
        injector.getInstance(SqlitePersonSearcher.class),
        injector.getInstance(SqliteOrganizationSearcher.class),
        injector.getInstance(SqlitePositionSearcher.class),
        injector.getInstance(SqliteTaskSearcher.class),
        injector.getInstance(SqliteLocationSearcher.class),
        injector.getInstance(SqliteTagSearcher.class),
        injector.getInstance(SqliteAuthorizationGroupSearcher.class));
  }

  protected static Query addPagination(AbstractSearchQuery<?> query, Handle dbHandle,
      StringBuilder sql, Map<String, Object> args) {
    if (query.getPageSize() > 0) {
      sql.append(" OFFSET :offset LIMIT :limit");
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

  protected static Query addPagination(AbstractSearchQuery<?> query, Handle dbHandle,
      StringBuilder sql, Map<String, Object> args, Map<String, List<?>> listArgs) {
    final Query q = addPagination(query, dbHandle, sql, args);
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(listArg.getKey(), listArg.getValue());
    }
    return q;
  }

}
