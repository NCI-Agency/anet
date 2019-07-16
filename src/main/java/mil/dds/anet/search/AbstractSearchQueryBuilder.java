package mil.dds.anet.search;

import com.google.common.base.Joiner;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractBatchParams;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;

public abstract class AbstractSearchQueryBuilder<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>> {

  public enum Comparison {
    AFTER(">="), BEFORE("<=");
    private String op;

    private Comparison(String op) {
      this.op = op;
    }

    public String getOperator() {
      return op;
    }
  }

  protected final StringBuilder sql;
  protected final Map<String, Object> sqlArgs;
  protected final Map<String, List<?>> listArgs;

  private final String likeKeyword;
  protected final List<String> withClauses;
  private final List<String> selectClauses;
  private final List<String> fromClauses;
  private final List<String> additionalFromClauses;
  private final List<String> whereClauses;
  private final List<String> groupByClauses;
  private final List<String> orderByClauses;

  public AbstractSearchQueryBuilder(String queryName, String likeKeyword) {
    sql = new StringBuilder(String.format("/* %s */ ", queryName));
    sqlArgs = new HashMap<>();
    listArgs = new HashMap<>();

    this.likeKeyword = likeKeyword;
    withClauses = new LinkedList<>();
    selectClauses = new LinkedList<>();
    fromClauses = new LinkedList<>();
    additionalFromClauses = new LinkedList<>();
    whereClauses = new LinkedList<>();
    groupByClauses = new LinkedList<>();
    orderByClauses = new LinkedList<>();
  }

  public void addSqlArg(String arg, Object value) {
    sqlArgs.put(arg, value);
  }

  public void addSqlArgs(Map<String, Object> args) {
    sqlArgs.putAll(args);
  }

  public Map<String, Object> getSqlArgs() {
    return sqlArgs;
  }

  public void addListArg(String arg, List<?> value) {
    listArgs.put(arg, value);
  }

  public void addListArgs(Map<String, List<?>> args) {
    listArgs.putAll(args);
  }

  public Map<String, List<?>> getListArgs() {
    return listArgs;
  }

  public void addWithClause(String clause) {
    withClauses.add(clause);
  }

  public void addSelectClause(String clause) {
    selectClauses.add(clause);
  }

  public void addTotalCount() {
    addSelectClause("COUNT(*) OVER() AS \"totalCount\"");
  }

  public void addFromClause(String clause) {
    fromClauses.add(clause);
  }

  public void addAdditionalFromClause(String clause) {
    additionalFromClauses.add(clause);
  }

  public void addWhereClause(String clause) {
    whereClauses.add(clause);
  }

  public void addGroupByClause(String clause) {
    groupByClauses.add(clause);
  }

  public void addAllOrderByClauses(List<String> clauses) {
    orderByClauses.addAll(clauses);
  }

  public String getLikeQuery(String text) {
    return stripWildcards(text) + "%";
  }

  public abstract String getFullTextQuery(String text);

  /**
   * Add a batched query clause. If you want to batch for a many-to-many relation, e.g. getting
   * reports for a task, you'd use
   * <code>new M2mBatchParams("reports", "\"reportTasks\"", "\"reportUuid\"", "\"taskUuid\"")</code>
   * as the batchParams.
   *
   * Note that if you use this, your search query class must implement
   * {@link AbstractSearchQuery#hashCode()}, {@link AbstractSearchQuery#equals(Object)} and
   * {@link AbstractSearchQuery#clone()}.
   *
   * @param batchParams the parameters for the batch join/select/where clauses
   */
  public void addBatchClause(AbstractBatchParams<B, T> batchParams) {
    addBatchClause(batchParams, this);
  }

  public void addBatchClause(AbstractBatchParams<B, T> batchParams,
      AbstractSearchQueryBuilder<B, T> outerQb) {
    batchParams.addQuery(outerQb, this);
  }

  public final void addDateClause(String paramName, String fieldName, Comparison comp,
      Instant fieldValue) {
    if (fieldValue != null) {
      whereClauses.add(String.format("%s %s :%s", fieldName, comp.getOperator(), paramName));
      DaoUtils.addInstantAsLocalDateTime(sqlArgs, paramName, fieldValue);
    }
  }

  public final void addEqualsClause(String paramName, String fieldName, Object fieldValue) {
    if (fieldValue != null) {
      whereClauses.add(String.format("%s = :%s", fieldName, paramName));
      sqlArgs.put(paramName, fieldValue);
    }
  }

  public final void addEqualsClause(String paramName, String fieldName, Enum<?> fieldValue) {
    if (fieldValue != null) {
      whereClauses.add(String.format("%s = :%s", fieldName, paramName));
      sqlArgs.put(paramName, DaoUtils.getEnumId(fieldValue));
    }
  }

  public final void addEqualsClause(String paramName, String fieldName, String fieldValue) {
    if (fieldValue != null && !fieldValue.trim().isEmpty()) {
      whereClauses.add(String.format("%s = :%s", fieldName, paramName));
      sqlArgs.put(paramName, fieldValue);
    }
  }

  public final void addInClause(String paramName, String fieldName,
      List<? extends Enum<?>> fieldValues) {
    if (!Utils.isEmptyOrNull(fieldValues)) {
      whereClauses.add(String.format("%s IN ( <%s> )", fieldName, paramName));
      listArgs.put(paramName, fieldValues.stream().map(status -> DaoUtils.getEnumId(status))
          .collect(Collectors.toList()));
    }
  }

  public final void addLikeClause(String paramName, String fieldName, String fieldValue) {
    if (fieldValue != null) {
      whereClauses.add(getLikeClause(fieldName, paramName));
      sqlArgs.put(paramName, fieldValue);
    }
  }

  public final void addLikeClauses(String paramName, String[] fieldNames, String fieldValue) {
    if (fieldValue != null) {
      final List<String> likeClauses = new ArrayList<>();
      for (int i = 0; i < fieldNames.length; i++) {
        likeClauses.add(getLikeClause(fieldNames[i], paramName));
      }
      whereClauses.add("(" + Joiner.on(" OR ").join(likeClauses) + ")");
      sqlArgs.put(paramName, fieldValue);
    }
  }

  public final void addRecursiveClause(AbstractSearchQueryBuilder<B, T> outerQb, String tableName,
      String foreignKey, String withTableName, String recursiveTableName,
      String recursiveForeignKey, String paramName, String fieldValue) {
    addRecursiveClause(outerQb, tableName, new String[] {foreignKey}, withTableName,
        recursiveTableName, recursiveForeignKey, paramName, fieldValue);
  }

  public final void addRecursiveClause(AbstractSearchQueryBuilder<B, T> outerQb, String tableName,
      String[] foreignKeys, String withTableName, String recursiveTableName,
      String recursiveForeignKey, String paramName, String fieldValue) {
    if (outerQb == null) {
      outerQb = this;
    }
    outerQb.addWithClause(String.format(
        "%1$s(uuid, parent_uuid) AS (SELECT uuid, uuid as parent_uuid FROM %2$s UNION ALL"
            + " SELECT pt.uuid, bt.%3$s FROM %2$s bt INNER JOIN"
            + " %1$s pt ON bt.uuid = pt.parent_uuid)",
        withTableName, recursiveTableName, recursiveForeignKey));
    addAdditionalFromClause(withTableName);
    final List<String> orClauses = new ArrayList<>();
    for (final String foreignKey : foreignKeys) {
      orClauses.add(String.format("%1$s.%2$s = %3$s.uuid", tableName, foreignKey, withTableName));
    }
    addWhereClause(String.format("( (%1$s) AND %2$s.parent_uuid = :%3$s )",
        Joiner.on(" OR ").join(orClauses), withTableName, paramName));
    addSqlArg(paramName, fieldValue);
  }

  public final void addRecursiveBatchClause(AbstractSearchQueryBuilder<B, T> outerQb,
      String tableName, String[] foreignKeys, String withTableName, String recursiveTableName,
      String recursiveForeignKey, String paramName, List<String> fieldValues) {
    if (outerQb == null) {
      outerQb = this;
    }
    outerQb.addWithClause(String.format(
        "%1$s(uuid, parent_uuid) AS (SELECT uuid, uuid as parent_uuid FROM %2$s UNION ALL"
            + " SELECT pt.uuid, bt.%3$s FROM %2$s bt INNER JOIN"
            + " %1$s pt ON bt.uuid = pt.parent_uuid)",
        withTableName, recursiveTableName, recursiveForeignKey));
    addAdditionalFromClause(withTableName);
    addSelectClause(String.format("%1$s.parent_uuid AS \"batchUuid\"", withTableName));
    final List<String> orClauses = new ArrayList<>();
    for (final String foreignKey : foreignKeys) {
      orClauses.add(String.format("%1$s.%2$s = %3$s.uuid", tableName, foreignKey, withTableName));
    }
    addWhereClause(String.format("( (%1$s) AND %2$s.parent_uuid IN ( <%3$s> ) )",
        Joiner.on(" OR ").join(orClauses), withTableName, paramName));
    addListArg(paramName, fieldValues);
  }

  private final String getLikeClause(String fieldName, String paramName) {
    return String.format("%s %s :%s", fieldName, likeKeyword, paramName);
  }

  public final String build() {
    addWithClauses();
    addSelectClauses();
    addFromClauses();
    addAdditionalFromClauses();
    addWhereClauses();
    addGroupByClauses();
    addOrderByClauses();
    return sql.toString();
  }

  public AnetBeanList<B> buildAndRun(Handle handle, T query, RowMapper<B> mapper) {
    build();
    return getResult(handle, query, mapper);
  }

  protected void addWithClauses() {
    if (!withClauses.isEmpty()) {
      sql.insert(0, Joiner.on(", ").join(withClauses));
      sql.insert(0, "WITH ");
    }
  }

  protected void addSelectClauses() {
    if (!selectClauses.isEmpty()) {
      sql.append(" SELECT ");
      sql.append(Joiner.on(", ").join(selectClauses));
    }
  }

  protected void addFromClauses() {
    if (!fromClauses.isEmpty()) {
      sql.append(" FROM ");
      sql.append(Joiner.on(" ").join(fromClauses));
    }
  }

  protected void addAdditionalFromClauses() {
    if (!additionalFromClauses.isEmpty()) {
      sql.append(", ");
      sql.append(Joiner.on(", ").join(additionalFromClauses));
    }
  }

  protected void addWhereClauses() {
    if (!whereClauses.isEmpty()) {
      sql.append(" WHERE ");
      sql.append(Joiner.on(" AND ").join(whereClauses));
    }
  }

  protected void addGroupByClauses() {
    if (!groupByClauses.isEmpty()) {
      sql.append(" GROUP BY ");
      sql.append(Joiner.on(", ").join(groupByClauses));
    }
  }

  protected void addOrderByClauses() {
    if (!orderByClauses.isEmpty()) {
      sql.append(" ORDER BY ");
      sql.append(Joiner.on(", ").join(orderByClauses));
    }
  }

  /**
   * Prepares text to be used in a LIKE or CONTAINS query in SQL. Removes quotes and wildcards.
   */
  protected String stripWildcards(String text) {
    return text.trim().replaceAll("[\"*]", "");
  }

  protected abstract AnetBeanList<B> getResult(Handle handle, T query, RowMapper<B> mapper);

}
