package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Person;

public class CommentMapper implements ResultSetMapper<Comment> {

	PersonMapper personMapper;
	
	public CommentMapper() { 
		this.personMapper = new PersonMapper();
	}
	
	// Comments are ALWAYS loaded with their author, since it doesn't make sense to get them otherwise
	// The author fields get the namespace, and comments fields are c_* in the SQL query. 
	@Override
	public Comment map(int index, ResultSet r, StatementContext ctx) throws SQLException {
		Comment c = new Comment();
		c.setId(r.getInt("C_id"));
		c.setReportId(r.getInt("reportId"));
		
		Person author = personMapper.map(index, r, ctx);
		c.setAuthor(author);
		
		c.setText(r.getString("text"));
		c.setCreatedAt(new DateTime(r.getTimestamp("c_createdAt")));
		c.setUpdatedAt(new DateTime(r.getTimestamp("c_updatedAt")));
		return c;
	}

}
