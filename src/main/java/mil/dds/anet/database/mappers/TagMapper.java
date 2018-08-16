package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Tag;

public class TagMapper implements ResultSetMapper<Tag> {

	@Override
	public Tag map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		final Tag t = new Tag();
		t.setId(rs.getInt("id"));
		t.setName(rs.getString("name"));
		t.setDescription(rs.getString("description"));
		t.setCreatedAt(new DateTime(rs.getTimestamp("createdAt")));
		t.setUpdatedAt(new DateTime(rs.getTimestamp("updatedAt")));
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.setAttribute("totalCount", rs.getInt("totalCount"));
		}
		
		return t;
	}
	
}
