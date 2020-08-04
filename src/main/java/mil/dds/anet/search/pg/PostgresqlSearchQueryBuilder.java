package mil.dds.anet.search.pg;

import com.google.common.base.Joiner;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.utils.Utils;
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
    if (Utils.isEmptyOrNull(text)) {
      return null;
    }
    final String cleanText = stripWildcards(text);
    if (Utils.isEmptyOrNull(cleanText)) {
      return null;
    }
    return "%" + cleanText + "%";
  }

  @Override
  public String getFullTextQuery(String text) {
    if (Utils.isEmptyOrNull(text)) {
      return null;
    }
    // Replace all special characters for tsquery with spaces
    final String cleanText = text.trim().replaceAll("[<>:*|&!()\"']", " ").trim();
    if (Utils.isEmptyOrNull(cleanText)) {
      return null;
    }
    // Split into words
    final String[] lexemes = cleanText.split("\\s+");
    if (lexemes.length == 0) {
      return null;
    }
    // Turn each word into a prefix match, and AND them
    return Joiner.on(":* & ").join(lexemes).concat(":*");
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
