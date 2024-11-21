package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.database.mappers.ForeignKeyMapper;
import mil.dds.anet.database.mappers.ForeignKeyTuple;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.Query;
import org.springframework.transaction.annotation.Transactional;

public class ForeignKeyBatcher<T extends AbstractAnetBean> extends AbstractDao {

  private static final List<String> defaultIfEmpty = Arrays.asList("-1");

  private final String sql;
  private final String paramName;
  private final RowMapper<T> objectMapper;
  private final String foreignKeyName;
  private final Map<String, Object> additionalParams;

  public ForeignKeyBatcher(DatabaseHandler databaseHandler, String sql, String paramName,
      RowMapper<T> objectMapper, String foreignKeyName, Map<String, Object> additionalParams) {
    super(databaseHandler);
    this.sql = sql;
    this.paramName = paramName;
    this.objectMapper = objectMapper;
    this.foreignKeyName = foreignKeyName;
    this.additionalParams = additionalParams;
  }

  public ForeignKeyBatcher(DatabaseHandler databaseHandler, String sql, String paramName,
      RowMapper<T> objectMapper, String foreignKeyName) {
    this(databaseHandler, sql, paramName, objectMapper, foreignKeyName, null);
  }

  @Transactional
  public List<List<T>> getByForeignKeys(List<String> foreignKeys) {
    final Handle handle = getDbHandle();
    try {
      final List<String> args = foreignKeys.isEmpty() ? defaultIfEmpty : foreignKeys;
      final Query query = handle.createQuery(sql).bindList(NULL_KEYWORD, paramName, args);
      if (additionalParams != null && !additionalParams.isEmpty()) {
        query.bindMap(additionalParams);
      }
      final ForeignKeyMapper<T> mapper = new ForeignKeyMapper<>(foreignKeyName, objectMapper);
      return query.map(mapper).withStream(result -> {
        final Map<String, List<T>> map =
            result.collect(Collectors.toMap(ForeignKeyTuple::getForeignKey, // key
                obj -> new ArrayList<>(Collections.singletonList(obj.getObject())), // value
                // collect results with the same key in one list
                (obj1, obj2) -> {
                  obj1.addAll(obj2);
                  return obj1;
                }));
        return foreignKeys.stream().map(map::get).map(l ->
        // when null, use an empty list
        (l == null) ? new ArrayList<T>() : l).toList();
      });
    } finally {
      closeDbHandle(handle);
    }
  }
}
