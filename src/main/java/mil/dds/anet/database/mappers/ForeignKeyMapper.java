package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class ForeignKeyMapper<T> implements RowMapper<ForeignKeyTuple<T>> {

  private final String foreignKeyName;
  private final RowMapper<T> objectMapper;
  private final Map<Integer, T> objectCache;

  public ForeignKeyMapper(String foreignKeyName, RowMapper<T> objectMapper) {
    this.foreignKeyName = foreignKeyName;
    this.objectMapper = objectMapper;
    this.objectCache = new HashMap<>();
  }

  @Override
  public ForeignKeyTuple<T> map(ResultSet rs, StatementContext ctx) throws SQLException {
    final String foreignKey = rs.getString(foreignKeyName);
    final T object = objectMapper.map(rs, ctx);
    return new ForeignKeyTuple<T>(foreignKey,
        objectCache.computeIfAbsent(object.hashCode(), k -> object));
  }

}
