package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.CommentMapper;
import mil.dds.anet.utils.DaoUtils;

public class CommentDao implements IAnetDao<Comment> {

	private final Handle dbHandle;
	private final IdBatcher<Comment> idBatcher;

	public CommentDao(Handle dbHandle) { 
		this.dbHandle = dbHandle;
		final String idBatcherSql = "/* batch.getCommentsByIds */ SELECT comments.id AS c_id, "
				+ "comments.\"createdAt\" AS c_createdAt, comments.\"updatedAt\" AS c_updatedAt, "
				+ "comments.\"authorId\", comments.\"reportId\", comments.text, " + PersonDao.PERSON_FIELDS
				+ "FROM comments LEFT JOIN people ON comments.\"authorId\" = people.id "
				+ "WHERE comments.id IN ( %1$s )";
		this.idBatcher = new IdBatcher<Comment>(dbHandle, idBatcherSql, new CommentMapper());
	}
	
	@Override
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	//Comments are ALWAYS loaded with the author, since they are never displayed without their author
	@Override
	public Comment getById(int id) {
		List<Comment> results = dbHandle.createQuery("/* getCommentById */ SELECT comments.id AS c_id, "
				+ "comments.\"createdAt\" AS c_createdAt, comments.\"updatedAt\" AS c_updatedAt, "
				+ "comments.\"authorId\", comments.\"reportId\", comments.text, " + PersonDao.PERSON_FIELDS
				+ "FROM comments LEFT JOIN people ON comments.\"authorId\" = people.id "
				+ "WHERE comments.id = :id")
			.bind("id", id)
			.map(new CommentMapper())
			.list();
		if (results.size() == 0) { return null; } 
		return results.get(0);
	}

	@Override
	public List<Comment> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	@Override
	public Comment insert(Comment c) {
		c.setCreatedAt(DateTime.now());
		c.setUpdatedAt(DateTime.now());
		GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement("/* insertComment */ "
				+ "INSERT INTO comments (\"reportId\", \"authorId\", \"createdAt\", \"updatedAt\", text)"
				+ "VALUES (:reportId, :authorId, :createdAt, :updatedAt, :text)")
			.bindFromProperties(c)
			.bind("authorId", DaoUtils.getId(c.getAuthor()))
			.executeAndReturnGeneratedKeys();
		c.setId(DaoUtils.getGeneratedId(keys));
		return c;
	}

	@Override
	public int update(Comment c) {
		c.setUpdatedAt(DateTime.now());
		return dbHandle.createStatement("/* updateComment */ UPDATE comments SET text = :text, \"updatedAt\" = :updatedAt WHERE id = :id")
			.bindFromProperties(c)
			.execute();
	}

	public List<Comment> getCommentsForReport(Report report) {
		return dbHandle.createQuery("/* getCommentForReport */ SELECT c.id AS c_id, "
				+ "c.\"createdAt\" AS c_createdAt, c.\"updatedAt\" AS c_updatedAt, "
				+ "c.\"authorId\", c.\"reportId\", c.text, " + PersonDao.PERSON_FIELDS + " "
				+ "FROM comments c LEFT JOIN people ON c.\"authorId\" = people.id "
				+ "WHERE c.\"reportId\" = :reportId ORDER BY c.\"createdAt\" ASC")
			.bind("reportId", report.getId())
			.map(new CommentMapper())
			.list();
	}

	public int delete(int commentId) {
		return dbHandle.createStatement("/* deleteComment */ DELETE FROM comments where id = :id")
			.bind("id", commentId)
			.execute();
		
	}

}
