package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.AuthorizationGroup.AuthorizationGroupStatus;

public class AuthorizationGroupMapper implements ResultSetMapper<AuthorizationGroup> {

	@Override
	public AuthorizationGroup map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		final AuthorizationGroup a = new AuthorizationGroup();
		a.setId(rs.getInt("id"));
		a.setName(rs.getString("name"));
		a.setDescription(rs.getString("description"));
		a.setStatus(MapperUtils.getEnumIdx(rs, "status", AuthorizationGroupStatus.class));
		a.setCreatedAt(new DateTime(rs.getTimestamp("createdAt")));
		a.setUpdatedAt(new DateTime(rs.getTimestamp("updatedAt")));

		if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
			ctx.setAttribute("totalCount", rs.getInt("totalCount"));
		}

		return a;
	}

}
