package mil.dds.anet.search.pg;

import com.google.common.base.Joiner;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.Query;

public class PostgresqlSearchQueryBuilder<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>>
    extends AbstractSearchQueryBuilder<B, T> {

  public PostgresqlSearchQueryBuilder(String queryName) {
    super(queryName, "ILIKE");
  }

  @Override
  public String getContainsQuery(String text) {
    return "%" + stripWildcards(text) + "%";
  }

  @Override
  public String getFullTextQuery(String text) {
    String cleanText = stripWildcards(text);
    if (text.endsWith("*")) {
      cleanText = cleanText + ":*";
    }
    return cleanText;
  }

  @Override
  protected void addWithClauses() {
    if (!withClauses.isEmpty()) {
      sql.insert(0, Joiner.on(", ").join(withClauses));
      sql.insert(0, "WITH RECURSIVE ");
    }
  }

  @Override
  protected AnetBeanList<B> getResult(Handle handle, T query, RowMapper<B> mapper) {
    final Query sqlQuery = addPagination(query, handle, sql, sqlArgs, listArgs);
    return new AnetBeanList<B>(sqlQuery, query.getPageNum(), query.getPageSize(), mapper);
  }

  protected Query addPagination(AbstractSearchQuery<?> query, Handle dbHandle, StringBuilder sql,
      Map<String, Object> args, Map<String, List<?>> listArgs) {
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
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(listArg.getKey(), listArg.getValue());
    }
    return q;
  }

}
