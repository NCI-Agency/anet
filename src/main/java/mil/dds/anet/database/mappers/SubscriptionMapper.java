package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class SubscriptionMapper implements RowMapper<Subscription> {

  @Override
  public Subscription map(ResultSet rs, StatementContext ctx) throws SQLException {
    final Subscription s = new Subscription();
    DaoUtils.setCommonBeanFields(s, rs, null);
    s.setSubscriberUuid(rs.getString("subscriberUuid"));
    s.setSubscribedObjectType(rs.getString("subscribedObjectType"));
    s.setSubscribedObjectUuid(rs.getString("subscribedObjectUuid"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return s;
  }

}
