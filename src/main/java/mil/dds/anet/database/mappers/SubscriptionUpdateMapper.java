package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.SubscriptionUpdate;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class SubscriptionUpdateMapper implements RowMapper<SubscriptionUpdate> {

  @Override
  public SubscriptionUpdate map(ResultSet rs, StatementContext ctx) throws SQLException {
    final SubscriptionUpdate s = new SubscriptionUpdate();
    s.setCreatedAt(MapperUtils.getInstantAsLocalDateTime(rs, "subscriptionUpdates_createdAt"));
    s.setSubscriptionUuid(rs.getString("subscriptionUpdates_subscriptionUuid"));
    s.setUpdatedObjectType(rs.getString("subscriptionUpdates_updatedObjectType"));
    s.setUpdatedObjectUuid(rs.getString("subscriptionUpdates_updatedObjectUuid"));
    s.setIsNote(rs.getBoolean("subscriptionUpdates_isNote"));
    s.setAuditTrailUuid(rs.getString("subscriptionUpdates_auditTrailUuid"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return s;
  }

}
