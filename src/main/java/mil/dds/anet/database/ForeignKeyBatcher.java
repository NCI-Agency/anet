package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.database.mappers.ForeignKeyMapper;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.Query;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class ForeignKeyBatcher<T extends AbstractAnetBean> {

  private static final List<String> defaultIfEmpty = Arrays.asList("-1");

  @Inject
  private Provider<Handle> handle;
  private final String sql;
  private final String paramName;
  private final RowMapper<T> objectMapper;
  private final String foreignKeyName;
  private final Map<String, Object> additionalParams;

  public ForeignKeyBatcher(String sql, String paramName, RowMapper<T> objectMapper,
      String foreignKeyName, Map<String, Object> additionalParams) {
    this.sql = sql;
    this.paramName = paramName;
    this.objectMapper = objectMapper;
    this.foreignKeyName = foreignKeyName;
    this.additionalParams = additionalParams;
  }

  public ForeignKeyBatcher(String sql, String paramName, RowMapper<T> objectMapper,
      String foreignKeyName) {
    this(sql, paramName, objectMapper, foreignKeyName, null);
  }

  protected Handle getDbHandle() {
    return handle.get();
  }

  @InTransaction
  public List<List<T>> getByForeignKeys(List<String> foreignKeys) {
    final List<String> args = foreignKeys.isEmpty() ? defaultIfEmpty : foreignKeys;
    final Query query = getDbHandle().createQuery(sql).bindList(NULL_KEYWORD, paramName, args);
    if (additionalParams != null && !additionalParams.isEmpty()) {
      query.bindMap(additionalParams);
    }
    final ForeignKeyMapper<T> mapper = new ForeignKeyMapper<>(foreignKeyName, objectMapper);
    return query.map(mapper).withStream(result -> {
      final Map<String, List<T>> map = result.collect(Collectors.toMap(obj -> obj.getForeignKey(), // key
          obj -> new ArrayList<>(Collections.singletonList(obj.getObject())), // value
          (obj1, obj2) -> {
            obj1.addAll(obj2);
            return obj1;
          })); // collect results with the same key in one list
      return foreignKeys.stream().map(foreignKey -> map.get(foreignKey))
          .map(l -> (l == null) ? new ArrayList<T>() : l) // when null, use an empty list
          .collect(Collectors.toList());
    });
  }
}
