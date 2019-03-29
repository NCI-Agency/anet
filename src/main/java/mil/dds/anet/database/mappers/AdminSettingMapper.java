package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AdminSetting;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AdminSettingMapper implements RowMapper<AdminSetting> {

  @Override
  public AdminSetting map(ResultSet rs, StatementContext ctx) throws SQLException {
    AdminSetting as = new AdminSetting();
    as.setKey(rs.getString("key"));
    as.setValue(rs.getString("value"));
    return as;
  }

}
