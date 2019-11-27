package mil.dds.anet.search;

import com.google.common.base.Joiner;
import com.google.common.collect.Iterables;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;

public abstract class AbstractSearcher<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>> {

  private static final int MIN_UUID_PREFIX = 4;

  @Inject
  private Provider<Handle> handle;

  protected final AbstractSearchQueryBuilder<B, T> qb;

  public AbstractSearcher(AbstractSearchQueryBuilder<B, T> qb) {
    this.qb = qb;
  }

  protected Handle getDbHandle() {
    return handle.get();
  }

  protected abstract void buildQuery(T query);

  protected String getTableFields(String tableName, Set<String> allFields,
      Set<String> minimalFields, Map<String, String> fieldMapping, Set<String> subFields) {
    final String[] fieldsArray;
    if (subFields == null) {
      fieldsArray = Iterables.toArray(allFields, String.class);
    } else {
      final Set<String> fields = subFields.stream().map(f -> f.replaceFirst("^list/", ""))
          .map(f -> fieldMapping.getOrDefault(f, f)).filter(f -> !f.contains("/"))
          .collect(Collectors.toSet());
      fields.retainAll(allFields);
      fields.addAll(minimalFields);
      fieldsArray = Iterables.toArray(fields, String.class);
    }
    return DaoUtils.buildFieldAliases(tableName, fieldsArray, true);
  }

  protected void addFullTextSearch(String tableName, String text, boolean isSortByPresent) {
    final List<String> whereClauses = new ArrayList<>();
    final List<String> selectClauses = new ArrayList<>();

    if (text.trim().length() >= MIN_UUID_PREFIX) {
      whereClauses
          .add(String.format("SELECT uuid FROM \"%1$s\" WHERE uuid ILIKE :likeQuery", tableName));
      selectClauses.add(
          String.format("CASE WHEN \"%1$s\".uuid ILIKE :likeQuery THEN 1 ELSE 0 END", tableName));
      qb.addSqlArg("likeQuery", qb.getLikeQuery(text));
    }

    final String tsQuery = "websearch_to_tsquery('anet', :fullTextQuery)";
    whereClauses.add(String.format("SELECT uuid FROM \"mv_fts_%1$s\" WHERE full_text @@ %2$s",
        tableName, tsQuery));
    qb.addWhereClause(String.format("\"%1$s\".uuid IN (%2$s)", tableName,
        Joiner.on(" UNION ").join(whereClauses)));
    qb.addSqlArg("fullTextQuery", qb.getFullTextQuery(text));

    if (!isSortByPresent) {
      selectClauses.add(String.format("ts_rank(full_text, %1$s)", tsQuery));
      qb.addFromClause(String
          .format("LEFT JOIN \"mv_fts_%1$s\" ON \"mv_fts_%1$s\".uuid = \"%1$s\".uuid", tableName));
      qb.addSelectClause(
          String.format("(%1$s) AS search_rank", Joiner.on(" + ").join(selectClauses)));
    }
  }

  protected List<String> getOrderBy(SortOrder sortOrder, String table, String... columns) {
    final List<String> clauses = new ArrayList<>();
    for (final String column : columns) {
      if (table == null) {
        clauses.add(String.format("%1$s %2$s", column, sortOrder));
      } else {
        clauses.add(String.format("%1$s.%2$s %3$s", table, column, sortOrder));
      }
    }
    return clauses;
  }

}
