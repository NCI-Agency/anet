package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Tenant;
import mil.dds.anet.beans.WithStatus;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class TenantMapper implements RowMapper<Tenant> {
  @Override
  public Tenant map(ResultSet rs, StatementContext ctx) throws SQLException {
    final Tenant t = new Tenant();
    MapperUtils.setCommonBeanFields(t, rs, null);
    t.setName(rs.getString("name"));
    t.setStatus(MapperUtils.getEnumIdx(rs, "status", WithStatus.Status.class));
    return t;
  }
}
