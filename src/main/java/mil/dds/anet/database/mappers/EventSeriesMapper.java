package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.EventSeries;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class EventSeriesMapper implements RowMapper<EventSeries> {

  @Override
  public EventSeries map(ResultSet r, StatementContext ctx) throws SQLException {
    EventSeries eventSeries = new EventSeries();
    MapperUtils.setCustomizableBeanFields(eventSeries, r, "eventSeries");
    eventSeries
        .setStatus(MapperUtils.getEnumIdx(r, "eventSeries_status", EventSeries.Status.class));
    eventSeries.setName(r.getString("eventSeries_name"));
    eventSeries.setDescription(r.getString("eventSeries_description"));
    eventSeries.setHostOrgUuid(r.getString("eventSeries_hostOrgUuid"));
    eventSeries.setAdminOrgUuid(r.getString("eventSeries_adminOrgUuid"));

    if (MapperUtils.containsColumnNamed(r, "totalCount")) {
      ctx.define("totalCount", r.getInt("totalCount"));
    }

    return eventSeries;
  }

}
