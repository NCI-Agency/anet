package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.CommentMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public class CommentDao extends AnetBaseDao<Comment> {

	private static String[] fields = {"uuid", "createdAt", "updatedAt", "authorUuid", "reportUuid", "text"};
	private static String tableName = "comments";
	public static String COMMENT_FIELDS = DaoUtils.buildFieldAliases(tableName, fields, true);

	public CommentDao() {
		super("Comments", tableName, COMMENT_FIELDS, null);
	}
	
	@Override
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	public Comment getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	static class SelfIdBatcher extends IdBatcher<Comment> {
		private static final String sql =
			"/* batch.getCommentsByUuids */ SELECT " + COMMENT_FIELDS
				+ "FROM comments "
				+ "WHERE comments.uuid IN ( <uuids> )";

		public SelfIdBatcher() {
			super(sql, "uuids", new CommentMapper());
		}
	}

	@Override
	public List<Comment> getByIds(List<String> uuids) {
		final IdBatcher<Comment> idBatcher = AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Comment insertInternal(Comment c) {
		getDbHandle().createUpdate("/* insertComment */ "
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
		return getDbHandle().createUpdate("/* updateComment */ UPDATE comments SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
			.bindBean(c)
			.bind("updatedAt", DaoUtils.asLocalDateTime(c.getUpdatedAt()))
			.execute();
	}

	public List<Comment> getCommentsForReport(String reportUuid) {
		return getDbHandle().createQuery("/* getCommentForReport */ SELECT " + COMMENT_FIELDS
				+ "FROM comments "
				+ "WHERE comments.\"reportUuid\" = :reportUuid ORDER BY comments.\"createdAt\" ASC")
			.bind("reportUuid", reportUuid)
			.map(new CommentMapper())
			.list();
	}

	@Override
	public int deleteInternal(String commentUuid) {
		return getDbHandle().createUpdate("/* deleteComment */ DELETE FROM comments where uuid = :uuid")
			.bind("uuid", commentUuid)
			.execute();
	}

}
