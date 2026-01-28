package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.EventType;
import mil.dds.anet.beans.WithStatus;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class EventTypeMapper implements RowMapper<EventType> {
  @Override
  public EventType map(ResultSet rs, StatementContext ctx) throws SQLException {
    final EventType eventType = new EventType();
    MapperUtils.setCommonBeanFields(eventType, rs, "eventTypes");
    eventType.setStatus(MapperUtils.getEnumIdx(rs, "eventTypes_status", WithStatus.Status.class));
    eventType.setName(rs.getString("eventTypes_name"));
    return eventType;
  }
}
