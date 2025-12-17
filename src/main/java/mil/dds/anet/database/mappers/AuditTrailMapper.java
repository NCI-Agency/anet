package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AuditTrail;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AuditTrailMapper implements RowMapper<AuditTrail> {

  @Override
  public AuditTrail map(ResultSet rs, StatementContext ctx) throws SQLException {
    final AuditTrail auditTrail = new AuditTrail();
    MapperUtils.setCommonBeanFields(auditTrail, rs, "auditTrail");
    auditTrail.setUpdateType(
        MapperUtils.getEnumIdx(rs, "auditTrail_updateType", AuditTrail.AuditTrailUpdateType.class));
    auditTrail.setObjectUuid(rs.getString("auditTrail_personUuid"));
    auditTrail.setRelatedObjectType(rs.getString("auditTrail_relatedObjectType"));
    auditTrail.setRelatedObjectUuid(rs.getString("auditTrail_relatedObjectUuid"));
    auditTrail.setUpdateDescription(rs.getString("auditTrail_updateDescription"));
    auditTrail.setUpdateDetails(rs.getString("auditTrail_updateDetails"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return auditTrail;
  }

}
