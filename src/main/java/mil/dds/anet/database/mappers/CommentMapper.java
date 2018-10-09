package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.utils.DaoUtils;

public class CommentMapper implements ResultSetMapper<Comment> {

	PersonMapper personMapper;
	
	public CommentMapper() { 
		this.personMapper = new PersonMapper();
	}
	
	// Comments are ALWAYS loaded with their author, since it doesn't make sense to get them otherwise
	// The author fields get the namespace, and comments fields are comments_* in the SQL query.
	@Override
	public Comment map(int index, ResultSet r, StatementContext ctx) throws SQLException {
		Comment c = new Comment();
		DaoUtils.setCommonBeanFields(c, r, "comments");
		c.setReportUuid(r.getString("comments_reportUuid"));
		
		Person author = personMapper.map(index, r, ctx);
		c.setAuthor(author);
		
		c.setText(r.getString("comments_text"));
		return c;
	}

}
