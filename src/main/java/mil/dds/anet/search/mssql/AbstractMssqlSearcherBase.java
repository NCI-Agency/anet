package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.Query;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractMssqlSearcherBase<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>>
    extends AbstractSearcherBase<B, T> {

  @Override
  @InTransaction
  protected AnetBeanList<B> getResult(T query, RowMapper<B> mapper) {
    final Query sqlQuery =
        MssqlSearcher.addPagination(query, getDbHandle(), sql, sqlArgs, listArgs);
    return new AnetBeanList<B>(sqlQuery, query.getPageNum(), query.getPageSize(), mapper, null);
  }

}
