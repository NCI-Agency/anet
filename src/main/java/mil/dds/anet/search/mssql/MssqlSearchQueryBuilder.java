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
    super(queryName, "LIKE");
  }

  /**
   * Converts a text search query into a SQL Server Full Text query. If the text ends with a * then
   * we do a prefix match on the string else we do an inflectional match.
   */
  @Override
  public String getFullTextQuery(String text) {
    String cleanText = stripWildcards(text);
    if (text.endsWith("*")) {
      cleanText = "\"" + cleanText + "*\"";
    } else {
      cleanText = "FORMSOF(INFLECTIONAL, \"" + cleanText + "\")";
    }
    return cleanText;
  }

  @InTransaction
  @Override
  protected AnetBeanList<B> getResult(Handle handle, T query, RowMapper<B> mapper) {
    final Query sqlQuery = addPagination(query, handle, sql, sqlArgs, listArgs);
    return new AnetBeanList<B>(sqlQuery, query.getPageNum(), query.getPageSize(), mapper, null);
  }

  protected Query addPagination(AbstractSearchQuery<?> query, Handle dbHandle, StringBuilder sql,
      Map<String, Object> args, Map<String, List<?>> listArgs) {
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
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(listArg.getKey(), listArg.getValue());
    }
    return q;
  }

}
