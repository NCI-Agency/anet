package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Subscription;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class SubscriptionMapper implements RowMapper<Subscription> {

  @Override
  public Subscription map(ResultSet rs, StatementContext ctx) throws SQLException {
    final Subscription s = new Subscription();
    MapperUtils.setCommonBeanFields(s, rs, "subscriptions");
    s.setSubscriberUuid(rs.getString("subscriptions_subscriberUuid"));
    s.setSubscribedObjectType(rs.getString("subscriptions_subscribedObjectType"));
    s.setSubscribedObjectUuid(rs.getString("subscriptions_subscribedObjectUuid"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return s;
  }

}
