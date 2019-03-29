package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class PositionMapper implements RowMapper<Position> {

  @Override
  public Position map(ResultSet rs, StatementContext ctx) throws SQLException {
    // This hits when we do a join but there's no Billet record.
    if (rs.getObject("positions_uuid") == null) {
      return null;
    }

    Position p = fillInFields(new Position(), rs);

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }
    return p;
  }

  public static Position fillInFields(Position p, ResultSet rs) throws SQLException {
    DaoUtils.setCommonBeanFields(p, rs, "positions");
    p.setName(rs.getString("positions_name"));
    p.setCode(rs.getString("positions_code"));
    p.setType(MapperUtils.getEnumIdx(rs, "positions_type", PositionType.class));
    p.setStatus(MapperUtils.getEnumIdx(rs, "positions_status", PositionStatus.class));

    p.setOrganizationUuid(rs.getString("positions_organizationUuid"));
    p.setPersonUuid(rs.getString("positions_currentPersonUuid"));
    p.setLocationUuid(rs.getString("positions_locationUuid"));

    return p;
  }

}
