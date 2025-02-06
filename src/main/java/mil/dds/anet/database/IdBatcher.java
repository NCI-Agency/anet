package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;
import org.springframework.transaction.annotation.Transactional;

public class IdBatcher<T extends AbstractAnetBean> extends AbstractDao {

  private static final List<String> defaultIfEmpty = Arrays.asList("-1");

  private final String sql;
  private final String paramName;
  private final RowMapper<T> mapper;

  public IdBatcher(DatabaseHandler databaseHandler, String sql, String paramName,
      RowMapper<T> mapper) {
    super(databaseHandler);
    this.sql = sql;
    this.paramName = paramName;
    this.mapper = mapper;
  }

  @Transactional
  public List<T> getByIds(List<String> uuids) {
    final Handle handle = getDbHandle();
    try {
      final List<String> args = uuids.isEmpty() ? defaultIfEmpty : uuids;
      return handle.createQuery(sql).bindList(NULL_KEYWORD, paramName, args).map(mapper)
          .withStream(result -> {
            final Map<String, T> map = result.collect(Collectors.toMap(AbstractAnetBean::getUuid, // key
                obj -> obj)); // value
            return uuids.stream().map(map::get).toList();
          });
    } finally {
      closeDbHandle(handle);
    }
  }
}
