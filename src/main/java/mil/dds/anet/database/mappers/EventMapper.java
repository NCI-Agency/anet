package mil.dds.anet.database.mappers;

import static mil.dds.anet.database.mappers.MapperUtils.getInstantAsLocalDateTime;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.Location;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class EventMapper implements RowMapper<Event> {

  @Override
  public Event map(ResultSet r, StatementContext ctx) throws SQLException {
    Event event = new Event();
    MapperUtils.setCustomizableBeanFields(event, r, "events");
    event.setType(Event.EventType.valueOfCode(r.getString("events_type")));
    event.setName(r.getString("events_name"));
    event.setDescription(r.getString("events_description"));
    event.setStartDate(getInstantAsLocalDateTime(r, "events_startDate"));
    event.setEndDate(getInstantAsLocalDateTime(r, "events_endDate"));
    event.setOutcomes(r.getString("events_outcomes"));
    event.setHostOrgUuid(r.getString("events_hostOrgUuid"));
    event.setAdminOrgUuid(r.getString("events_adminOrgUuid"));
    event.setEventSeriesUuid(r.getString("events_eventSeriesUuid"));
    event.setLocationUuid(r.getString("events_locationUuid"));

    if (MapperUtils.containsColumnNamed(r, "totalCount")) {
      ctx.define("totalCount", r.getInt("totalCount"));
    }

    return event;
  }

}
