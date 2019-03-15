package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.CommentMapper;
import mil.dds.anet.utils.DaoUtils;

public class CommentDao extends AnetBaseDao<Comment> {

	private static String[] fields = {"uuid", "createdAt", "updatedAt", "authorUuid", "reportUuid", "text"};
	private static String tableName = "comments";
	public static String COMMENT_FIELDS = DaoUtils.buildFieldAliases(tableName, fields, true);

	private final IdBatcher<Comment> idBatcher;

	public CommentDao(AnetObjectEngine engine) {
		super(engine, "Comments", tableName, COMMENT_FIELDS, null);
		final String idBatcherSql = "/* batch.getCommentsByUuids */ SELECT " + COMMENT_FIELDS
				+ "FROM comments "
				+ "WHERE comments.uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Comment>(engine, idBatcherSql, "uuids", new CommentMapper());
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
	public Comment insertInternal(Comment c) {
		engine.getDbHandle().createUpdate("/* insertComment */ "
				+ "INSERT INTO comments (uuid, \"reportUuid\", \"authorUuid\", \"createdAt\", \"updatedAt\", text)"
				+ "VALUES (:uuid, :reportUuid, :authorUuid, :createdAt, :updatedAt, :text)")
			.bindBean(c)
			.bind("createdAt", DaoUtils.asLocalDateTime(c.getCreatedAt()))
			.bind("updatedAt", DaoUtils.asLocalDateTime(c.getUpdatedAt()))
			.execute();
		return c;
	}

	@Override
	public int updateInternal(Comment c) {
		return engine.getDbHandle().createUpdate("/* updateComment */ UPDATE comments SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
			.bindBean(c)
			.bind("updatedAt", DaoUtils.asLocalDateTime(c.getUpdatedAt()))
			.execute();
	}

	public List<Comment> getCommentsForReport(String reportUuid) {
		return engine.getDbHandle().createQuery("/* getCommentForReport */ SELECT " + COMMENT_FIELDS
				+ "FROM comments "
				+ "WHERE comments.\"reportUuid\" = :reportUuid ORDER BY comments.\"createdAt\" ASC")
			.bind("reportUuid", reportUuid)
			.map(new CommentMapper())
			.list();
	}

	@Override
	public int deleteInternal(String commentUuid) {
		return engine.getDbHandle().createUpdate("/* deleteComment */ DELETE FROM comments where uuid = :uuid")
			.bind("uuid", commentUuid)
			.execute();
	}

}
