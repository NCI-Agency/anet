package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Task;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class TaskMapper implements RowMapper<Task> {

  @Override
  public Task map(ResultSet r, StatementContext ctx) throws SQLException {
    Task p = new Task();
    MapperUtils.setCustomizableBeanFields(p, r, "tasks");
    p.setLongName(r.getString("tasks_longName"));
    p.setShortName(r.getString("tasks_shortName"));
    p.setCategory(r.getString("tasks_category"));
    p.setPlannedCompletion(MapperUtils.getInstantAsLocalDateTime(r, "tasks_plannedCompletion"));
    p.setProjectedCompletion(MapperUtils.getInstantAsLocalDateTime(r, "tasks_projectedCompletion"));
    p.setStatus(MapperUtils.getEnumIdx(r, "tasks_status", Task.Status.class));
    p.setDescription(MapperUtils.getOptionalString(r, "tasks_description"));
    p.setSelectable(MapperUtils.getOptionalBoolean(r, "tasks_selectable"));
    p.setParentTaskUuid(r.getString("tasks_parentTaskUuid"));

    if (MapperUtils.containsColumnNamed(r, "totalCount")) {
      ctx.define("totalCount", r.getInt("totalCount"));
    }

    return p;
  }


}
