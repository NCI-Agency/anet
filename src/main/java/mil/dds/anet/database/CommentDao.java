package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.CommentMapper;
import mil.dds.anet.utils.DaoUtils;

public class CommentDao implements IAnetDao<Comment> {

	private static String[] fields = {"uuid", "createdAt", "updatedAt", "authorUuid", "reportUuid", "text"};
	private static String tableName = "comments";
	public static String COMMENT_FIELDS = DaoUtils.buildFieldAliases(tableName, fields, true);

	private final Handle dbHandle;
	private final IdBatcher<Comment> idBatcher;

	public CommentDao(Handle dbHandle) { 
		this.dbHandle = dbHandle;
		final String idBatcherSql = "/* batch.getCommentsByUuids */ SELECT " + COMMENT_FIELDS
				+ "FROM comments "
				+ "WHERE comments.uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Comment>(dbHandle, idBatcherSql, "uuids", new CommentMapper());
	}
	
	@Override
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	public Comment getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<Comment> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Comment insert(Comment c) {
		DaoUtils.setInsertFields(c);
		dbHandle.createUpdate("/* insertComment */ "
				+ "INSERT INTO comments (uuid, \"reportUuid\", \"authorUuid\", \"createdAt\", \"updatedAt\", text)"
				+ "VALUES (:uuid, :reportUuid, :authorUuid, :createdAt, :updatedAt, :text)")
			.bindBean(c)
			.execute();
		return c;
	}

	public int update(Comment c) {
		DaoUtils.setUpdateFields(c);
		return dbHandle.createUpdate("/* updateComment */ UPDATE comments SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
			.bindBean(c)
			.execute();
	}

	public List<Comment> getCommentsForReport(String reportUuid) {
		return dbHandle.createQuery("/* getCommentForReport */ SELECT " + COMMENT_FIELDS
				+ "FROM comments "
				+ "WHERE comments.\"reportUuid\" = :reportUuid ORDER BY comments.\"createdAt\" ASC")
			.bind("reportUuid", reportUuid)
			.map(new CommentMapper())
			.list();
	}

	public int delete(String commentUuid) {
		return dbHandle.createUpdate("/* deleteComment */ DELETE FROM comments where uuid = :uuid")
			.bind("uuid", commentUuid)
			.execute();
		
	}

}
