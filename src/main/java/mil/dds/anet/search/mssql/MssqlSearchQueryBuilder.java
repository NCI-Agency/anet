package mil.dds.anet.search.mssql;

import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.Query;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlSearchQueryBuilder<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>>
    extends AbstractSearchQueryBuilder<B, T> {

  public MssqlSearchQueryBuilder(String queryName) {
    super(queryName);
  }

  @Override
  @InTransaction
  protected AnetBeanList<B> getResult(Handle handle, T query, RowMapper<B> mapper) {
    final Query sqlQuery = addPagination(query, handle, sql, sqlArgs, listArgs);
    return new AnetBeanList<B>(sqlQuery, query.getPageNum(), query.getPageSize(), mapper, null);
  }

  protected Query addPagination(AbstractSearchQuery<?> query, Handle dbHandle, StringBuilder sql,
      Map<String, Object> args, Map<String, List<?>> listArgs) {
    if (query.getPageSize() > 0) {
      sql.append(" OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY");
    }
    final Query q1 = dbHandle.createQuery(sql.toString());
    if (args != null && !args.isEmpty()) {
      q1.bindMap(args);
    }
    if (query.getPageSize() > 0) {
      q1.bind("offset", query.getPageSize() * query.getPageNum()).bind("limit",
          query.getPageSize());
    }
    final Query q = q1;
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(listArg.getKey(), listArg.getValue());
    }
    return q;
  }

}
