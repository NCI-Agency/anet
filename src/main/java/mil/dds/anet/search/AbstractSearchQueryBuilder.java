package mil.dds.anet.search;

import com.google.common.base.Joiner;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.beans.lists.AnetBeanList;
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

  private final List<String> withClauses;
  private final List<String> selectClauses;
  private final List<String> fromClauses;
  private final List<String> whereClauses;
  private final List<String> groupByClauses;
  private final List<String> orderByClauses;

  public AbstractSearchQueryBuilder(String queryName) {
    sql = new StringBuilder(String.format("/* %s */ ", queryName));
    sqlArgs = new HashMap<>();
    listArgs = new HashMap<>();

    withClauses = new LinkedList<>();
    selectClauses = new LinkedList<>();
    fromClauses = new LinkedList<>();
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

  public void addFromClause(String clause) {
    fromClauses.add(clause);
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
      whereClauses.add(String.format("%s LIKE :%s", fieldName, paramName));
      sqlArgs.put(paramName, Utils.prepForLikeQuery(fieldValue) + "%");
    }
  }

  public String build() {
    addWithClauses();
    addSelectClauses();
    addFromClauses();
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
    if (!selectClauses.isEmpty()) {
      sql.append(" FROM ");
      sql.append(Joiner.on(" ").join(fromClauses));
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

  protected abstract AnetBeanList<B> getResult(Handle handle, T query, RowMapper<B> mapper);

}
