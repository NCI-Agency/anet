package mil.dds.anet.database.mappers;

import java.lang.invoke.MethodHandles;
import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AnetEmail;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.ObjectMapper;

public class AnetEmailMapper implements RowMapper<AnetEmail> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  ObjectMapper mapper;

  public AnetEmailMapper() {
    this.mapper = MapperUtils.getDefaultMapper();
  }

  @Override
  public AnetEmail map(ResultSet rs, StatementContext ctx) throws SQLException {
    String jobSpec = rs.getString("jobSpec");
    AnetEmail email;
    try {
      email = mapper.readValue(jobSpec, AnetEmail.class);
    } catch (Exception e) {
      logger.error("Error mapping email", e);
      email = new AnetEmail();
    }

    email.setId(rs.getInt("id"));
    email.setCreatedAt(MapperUtils.getInstantAsLocalDateTime(rs, "createdAt"));
    email.setErrorMessage(rs.getString("errorMessage"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return email;
  }
}
