package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Preference;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class PreferenceMapper implements RowMapper<Preference> {

  public Preference map(ResultSet rs, StatementContext ctx) throws SQLException {
    Preference p = new Preference();
    p.setUuid(rs.getString("preferences_uuid"));
    p.setName(rs.getString("preferences_name"));
    p.setType(rs.getString("preferences_type"));
    p.setDescription(rs.getString("preferences_description"));
    p.setDefaultValue(rs.getString("preferences_defaultValue"));
    return p;
  }
}
