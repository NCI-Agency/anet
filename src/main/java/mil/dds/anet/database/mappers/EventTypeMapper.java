package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.EventType;
import mil.dds.anet.beans.WithStatus.Status;
import mil.dds.anet.database.mappers.MapperUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class EventTypeMapper implements RowMapper<EventType> {

  @Override
  public EventType map(ResultSet rs, StatementContext ctx) throws SQLException {
    final EventType t = new EventType();

    t.setUuid(rs.getString("uuid"));
    t.setCode(rs.getString("code"));

    final int statusIdx = rs.getInt("status");
    if (!rs.wasNull()) {
      t.setStatus(Status.values()[statusIdx]);
    }

    t.setCreatedAt(MapperUtils.getInstantAsLocalDateTime(rs, "createdAt"));
    t.setUpdatedAt(MapperUtils.getInstantAsLocalDateTime(rs, "updatedAt"));

    return t;
  }
}
