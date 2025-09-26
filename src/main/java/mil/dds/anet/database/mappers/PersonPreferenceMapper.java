package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.PersonPreference;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class PersonPreferenceMapper implements RowMapper<PersonPreference> {

  @Override
  public PersonPreference map(ResultSet rs, StatementContext ctx) throws SQLException {
    PersonPreference p = new PersonPreference();
    p.setValue(rs.getString("value"));
    p.setPreferenceUuid(rs.getString("preferenceUuid"));
    p.setPersonUuid(rs.getString("personUuid"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }
    return p;
  }
}
