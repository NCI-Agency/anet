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

  protected boolean hasTextQuery(T query) {
    if (!query.isTextPresent()) {
      return false;
    }
    final String text = query.getText();
    return qb.getContainsQuery(text) != null && qb.getFullTextQuery(text) != null;
  }

  protected abstract void addTextQuery(T query);

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

    final String materializedView = String.format("\"mv_fts_%1$s\"", tableName);
    final String fullTextColumn = String.format("%1$s.full_text", materializedView);
    final String tsQuery = getTsQuery();
    whereClauses.add(String.format("SELECT uuid FROM %1$s WHERE %2$s @@ %3$s", materializedView,
        fullTextColumn, tsQuery));
    qb.addWhereClause(String.format("\"%1$s\".uuid IN (%2$s)", tableName,
        Joiner.on(" UNION ").join(whereClauses)));
    qb.addSqlArg("fullTextQuery", qb.getFullTextQuery(text));

    if (!isSortByPresent) {
      selectClauses.add(String.format("ts_rank(%1$s, %2$s)", fullTextColumn, tsQuery));
      qb.addFromClause(String.format("LEFT JOIN %1$s ON %1$s.uuid = \"%2$s\".uuid",
          materializedView, tableName));
      qb.addSelectClause(
          String.format("(%1$s) AS search_rank", Joiner.on(" + ").join(selectClauses)));
    }
  }

  private String getTsQuery() {
    final String tsQueryTpl = "to_tsquery('%1$s', :fullTextQuery)";
    final String tsQueryAnet = String.format(tsQueryTpl, "anet");
    final String tsQuerySimple = String.format(tsQueryTpl, "simple");
    return String.format("(%1$s || %2$s)", tsQueryAnet, tsQuerySimple);
  }

  protected void addWithinPolygonMssql(String locationUuidColumn, String queryText) {
    qb.addWhereClause(String.format(
        "\"%1$s\" IN (SELECT \"uuid\" FROM locations WHERE \"geometry\".STWithin(geometry::STGeomFromText('%2$s', 3857)) = 1)",
        locationUuidColumn, queryText));
  }

  protected void addWithinPolygonPsql(String locationUuidColumn, String queryText) {
    qb.addWhereClause(String.format(
        "\"%1$s\" IN (SELECT \"uuid\" FROM locations WHERE ST_Within(\"geometry\", ST_GeomFromText('%2$s', 3857)))",
        locationUuidColumn, queryText));
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
