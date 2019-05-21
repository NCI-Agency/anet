package mil.dds.anet.database;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.inject.Inject;
import javax.inject.Provider;
import mil.dds.anet.database.mappers.ForeignKeyMapper;
import mil.dds.anet.database.mappers.ForeignKeyTuple;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.result.ResultIterable;
import org.jdbi.v3.core.statement.Query;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public class ForeignKeyBatcher<T extends AbstractAnetBean> {

  private static final List<String> defaultIfEmpty = Arrays.asList("-1");

  @Inject
  private Provider<Handle> handle;
  private final String sql;
  private final String paramName;
  private final ForeignKeyMapper<T> mapper;
  private final Map<String, Object> additionalParams;

  public ForeignKeyBatcher(String sql, String paramName, RowMapper<T> objectMapper,
      String foreignKeyName, Map<String, Object> additionalParams) {
    this.sql = sql;
    this.paramName = paramName;
    this.mapper = new ForeignKeyMapper<>(foreignKeyName, objectMapper);
    this.additionalParams = additionalParams;
  }

  public ForeignKeyBatcher(String sql, String paramName, RowMapper<T> objectMapper,
      String foreignKeyName) {
    this(sql, paramName, objectMapper, foreignKeyName, null);
  }

  protected Handle getDbHandle() {
    return handle.get();
  }

  public List<List<T>> getByForeignKeys(List<String> foreignKeys) {
    final List<String> args = foreignKeys.isEmpty() ? defaultIfEmpty : foreignKeys;
    final Query query = getDbHandle().createQuery(sql).bindList(paramName, args);
    if (additionalParams != null && !additionalParams.isEmpty()) {
      query.bindMap(additionalParams);
    }
    final ResultIterable<ForeignKeyTuple<T>> result = query.map(mapper);
    final Map<String, List<T>> map = result.collect(Collectors.toMap(obj -> obj.getForeignKey(), // key
        obj -> new ArrayList<>(Collections.singletonList(obj.getObject())), // value
        (obj1, obj2) -> {
          obj1.addAll(obj2);
          return obj1;
        })); // collect results with the same key in one list
    return foreignKeys.stream().map(foreignKey -> map.get(foreignKey))
        .map(l -> (l == null) ? new ArrayList<T>() : l) // when null, use an empty list
        .collect(Collectors.toList());
  }
}
