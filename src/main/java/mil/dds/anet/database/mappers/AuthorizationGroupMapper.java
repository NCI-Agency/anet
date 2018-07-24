package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.AuthorizationGroup.AuthorizationGroupStatus;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.AbstractAnetBean.LoadLevel;

public class AuthorizationGroupMapper implements ResultSetMapper<AuthorizationGroup> {

	@Override
	public AuthorizationGroup map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		final AuthorizationGroup a = new AuthorizationGroup();
		DaoUtils.setCommonBeanFields(a, rs, null);
		a.setName(rs.getString("name"));
		a.setDescription(rs.getString("description"));
		a.setStatus(MapperUtils.getEnumIdx(rs, "status", AuthorizationGroupStatus.class));
		a.setLoadLevel(LoadLevel.PROPERTIES);

		if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
			ctx.setAttribute("totalCount", rs.getInt("totalCount"));
		}

		return a;
	}

}
