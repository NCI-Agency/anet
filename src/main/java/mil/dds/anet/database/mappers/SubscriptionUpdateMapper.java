package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;

import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.utils.DaoUtils;

public class SubscriptionUpdateMapper implements RowMapper<SubscriptionUpdate> {

	@Override
	public SubscriptionUpdate map(ResultSet rs, StatementContext ctx) throws SQLException {
		final SubscriptionUpdate s = new SubscriptionUpdate();
		s.setCreatedAt(DaoUtils.getInstantAsLocalDateTime(rs, "createdAt"));
		s.setSubscriptionUuid(rs.getString("subscriptionUuid"));
		s.setUpdatedObjectType(rs.getString("updatedObjectType"));
		s.setUpdatedObjectUuid(rs.getString("updatedObjectUuid"));
		s.setIsNote(rs.getBoolean("isNote"));

		if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
			ctx.define("totalCount", rs.getInt("totalCount"));
		}

		return s;
	}

}
