package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.Query;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractSqliteSearcherBase<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>>
    extends AbstractSearcherBase<B, T> {

  @Override
  protected void finish(T query) {
    super.finish(query);
    sql.append(" LIMIT :limit OFFSET :offset");
  }

  @Override
  @InTransaction
  protected AnetBeanList<B> getResult(T query, RowMapper<B> mapper) {
    final AnetBeanList<B> result =
        new AnetBeanList<B>(query.getPageNum(), query.getPageSize(), new ArrayList<B>());
    final Query q = getDbHandle().createQuery(sql.toString()).bindMap(sqlArgs)
        .bind("offset", query.getPageSize() * query.getPageNum())
        .bind("limit", query.getPageSize());
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(listArg.getKey(), listArg.getValue());
    }
    final List<B> list = q.map(mapper).list();
    result.setList(list);
    // Sqlite cannot do true total counts, so this is a crutch.
    result.setTotalCount(list.size());
    return result;
  }

}
