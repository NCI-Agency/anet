package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import mil.dds.anet.views.AbstractAnetBean;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.RowMapper;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

public class IdBatcher<T extends AbstractAnetBean> extends AbstractDao {

  private final String sql;
  private final String paramName;
  private final Map<String, Object> paramsMap;
  private final RowMapper<T> mapper;

  public IdBatcher(DatabaseHandler databaseHandler, String sql, String paramName,
      RowMapper<T> mapper) {
    this(databaseHandler, sql, paramName, null, mapper);
  }

  public IdBatcher(DatabaseHandler databaseHandler, String sql, String paramName,
      Map<String, Object> paramsMap, RowMapper<T> mapper) {
    super(databaseHandler);
    this.sql = sql;
    this.paramName = paramName;
    this.paramsMap = paramsMap;
    this.mapper = mapper;
  }

  @Transactional
  public List<T> getByIds(List<String> uuids) {
    // Validate the whole batch before opening a database handle.
    // Preserve input positions, including optional null IDs and duplicates.
    final List<String> normalizedUuids = uuids.stream().map(IdBatcher::normalizeUuid).toList();
    final List<String> validUuids =
        normalizedUuids.stream().filter(Objects::nonNull).distinct().toList();
    if (validUuids.isEmpty()) {
      return uuids.stream().map(uuid -> (T) null).toList();
    }
    final Handle handle = getDbHandle();
    try {
      return handle.createQuery(sql).bindList(NULL_KEYWORD, paramName, validUuids)
          .bindMap(paramsMap).map(mapper).withStream(result -> {
            final Map<String, T> map = result.collect(Collectors.toMap(AbstractAnetBean::getUuid, // key
                obj -> obj)); // value
            return normalizedUuids.stream().map(map::get).toList();
          });
    } finally {
      closeDbHandle(handle);
    }
  }

  private static String normalizeUuid(String uuid) {
    if (uuid == null) {
      return null;
    }
    try {
      final String normalized = UUID.fromString(uuid).toString();
      // UUID.fromString accepts shortened groups; API identifiers must be complete.
      if (normalized.equalsIgnoreCase(uuid)) {
        return normalized;
      }
    } catch (IllegalArgumentException e) {
      // Report malformed identifiers as client errors, not PostgreSQL failures.
    }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid UUID");
  }
}
