package mil.dds.anet.search;

import com.google.common.base.Joiner;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;

public abstract class AbstractSearcherBase<B extends AbstractAnetBean, T extends AbstractSearchQuery<?>> {

  protected enum Comparison {
    AFTER(">="), BEFORE("<=");
    private String op;

    private Comparison(String op) {
      this.op = op;
    }

    public String getOperator() {
      return op;
    }
  }

  @Inject
  private Provider<Handle> handle;

  protected StringBuilder sql;
  protected List<String> withClauses;
  protected List<String> whereClauses;
  protected Map<String, Object> sqlArgs;
  protected Map<String, List<?>> listArgs;
  protected List<String> orderByClauses;

  protected Handle getDbHandle() {
    return handle.get();
  }

  protected void start(String queryName) {
    sql = new StringBuilder(String.format("/* %s */ ", queryName));
    withClauses = new LinkedList<String>();
    whereClauses = new LinkedList<String>();
    sqlArgs = new HashMap<String, Object>();
    listArgs = new HashMap<>();
    orderByClauses = new LinkedList<>();
  }

  protected void addDateClause(String paramName, String fieldName, Comparison comp,
      Instant fieldValue) {
    if (fieldValue != null) {
      whereClauses.add(String.format("%s %s :%s", fieldName, comp.getOperator(), paramName));
      DaoUtils.addInstantAsLocalDateTime(sqlArgs, paramName, fieldValue);
    }
  }

  protected void addEqualsClause(String paramName, String fieldName, Object fieldValue) {
    if (fieldValue != null) {
      whereClauses.add(String.format("%s = :%s", fieldName, paramName));
      sqlArgs.put(paramName, fieldValue);
    }
  }

  protected void addEqualsClause(String paramName, String fieldName, Enum<?> fieldValue) {
    if (fieldValue != null) {
      whereClauses.add(String.format("%s = :%s", fieldName, paramName));
      sqlArgs.put(paramName, DaoUtils.getEnumId(fieldValue));
    }
  }

  protected void addEqualsClause(String paramName, String fieldName, String fieldValue) {
    if (fieldValue != null && !fieldValue.trim().isEmpty()) {
      whereClauses.add(String.format("%s = :%s", fieldName, paramName));
      sqlArgs.put(paramName, fieldValue);
    }
  }

  protected void addInClause(String paramName, String fieldName,
      List<? extends Enum<?>> fieldValues) {
    if (!Utils.isEmptyOrNull(fieldValues)) {
      whereClauses.add(String.format("%s IN ( <%s> )", fieldName, paramName));
      listArgs.put(paramName, fieldValues.stream().map(status -> DaoUtils.getEnumId(status))
          .collect(Collectors.toList()));
    }
  }

  protected void addLikeClause(String paramName, String fieldName, String fieldValue) {
    if (fieldValue != null) {
      whereClauses.add(String.format("%s LIKE :%s", fieldName, paramName));
      sqlArgs.put(paramName, Utils.prepForLikeQuery(fieldValue) + "%");
    }
  }

  protected abstract void getOrderByClauses(T query);

  protected void finish(T query) {
    addWithClauses();
    addWhereClauses();
    addOrderByClauses(query);
  }

  protected void addOrderByClauses(T query) {
    getOrderByClauses(query);
    if (!orderByClauses.isEmpty()) {
      sql.append(" ORDER BY ");
      sql.append(Joiner.on(", ").join(orderByClauses));
    }
  }

  protected void addWhereClauses() {
    if (!whereClauses.isEmpty()) {
      sql.append(" WHERE ");
      sql.append(Joiner.on(" AND ").join(whereClauses));
    }
  }

  protected void addWithClauses() {
    if (!withClauses.isEmpty()) {
      sql.insert(0, Joiner.on(", ").join(withClauses));
      sql.insert(0, "WITH ");
    }
  }

  protected abstract AnetBeanList<B> getResult(T query, RowMapper<B> mapper);

}
