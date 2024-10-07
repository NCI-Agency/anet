package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.database.mappers.ForeignKeyMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.AbstractAnetBean;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.Query;
import org.springframework.transaction.annotation.Transactional;

public class ForeignKeyByDateBatcher<T extends AbstractAnetBean> {

  private static final List<String> defaultIfEmpty = Arrays.asList("-1");

  private final DatabaseHandler databaseHandler;
  private final String sql;
  private final String paramName;
  private final RowMapper<T> objectMapper;
  private final String foreignKeyName;
  private final Map<String, Object> additionalParams;

  public ForeignKeyByDateBatcher(DatabaseHandler databaseHandler, String sql, String paramName,
      RowMapper<T> objectMapper, String foreignKeyName, Map<String, Object> additionalParams) {
    this.databaseHandler = databaseHandler;
    this.sql = sql;
    this.paramName = paramName;
    this.objectMapper = objectMapper;
    this.foreignKeyName = foreignKeyName;
    this.additionalParams = additionalParams;
  }

  public ForeignKeyByDateBatcher(DatabaseHandler databaseHandler, String sql, String paramName,
      RowMapper<T> objectMapper, String foreignKeyName) {
    this(databaseHandler, sql, paramName, objectMapper, foreignKeyName, null);
  }

  protected Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  protected void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }

  @Transactional
  public List<List<T>> getByForeignKeys(List<ImmutablePair<String, Instant>> foreignKeys) {
    final Handle handle = getDbHandle();
    try {
      final Map<ImmutablePair<String, Instant>, List<T>> resultsMap = new HashMap<>();

      // group in smaller batches by query
      final Map<Instant, List<String>> dateToForeignKeyListMap =
          foreignKeys.stream().collect(Collectors.groupingBy(ImmutablePair::getRight,
              Collectors.mapping(ImmutablePair::getLeft, Collectors.toList())));
      for (Map.Entry<Instant, List<String>> gqlQuery : dateToForeignKeyListMap.entrySet()) {
        final Instant when = gqlQuery.getKey();
        final List<String> args = foreignKeys.isEmpty() ? defaultIfEmpty : gqlQuery.getValue();
        final Query query = handle.createQuery(sql).bindList(NULL_KEYWORD, paramName, args);
        query.bind("when", DaoUtils.asLocalDateTime(when));
        if (additionalParams != null && !additionalParams.isEmpty()) {
          query.bindMap(additionalParams);
        }
        final ForeignKeyMapper<T> mapper = new ForeignKeyMapper<>(foreignKeyName, objectMapper);
        final Map<ImmutablePair<String, Instant>, List<T>> map = query.map(mapper)
            .withStream(result -> result
                .collect(Collectors.toMap(obj -> new ImmutablePair<>(obj.getForeignKey(), when), // key
                    obj -> new ArrayList<>(List.of(obj.getObject())), // value
                    (obj1, obj2) -> {
                      obj1.addAll(obj2);
                      return obj1;
                    })));
        resultsMap.putAll(map);
      }

      // when null, use an empty list
      return foreignKeys.stream().map(resultsMap::get)
          .map(l -> (l == null) ? new ArrayList<T>() : l).collect(Collectors.toList());
    } finally {
      closeDbHandle(handle);
    }
  }
}
