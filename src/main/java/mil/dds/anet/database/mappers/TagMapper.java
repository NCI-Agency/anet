package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.utils.DaoUtils;

public class TagMapper implements ResultSetMapper<Tag> {

	@Override
	public Tag map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		final Tag t = new Tag();
		DaoUtils.setCommonBeanFields(t, rs, null);
		t.setName(rs.getString("name"));
		t.setDescription(rs.getString("description"));
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.setAttribute("totalCount", rs.getInt("totalCount"));
		}
		
		return t;
	}
	
}
