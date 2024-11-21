package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.CommentMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CommentDao extends AnetBaseDao<Comment, AbstractSearchQuery<?>> {

  private static final String[] fields =
      {"uuid", "createdAt", "updatedAt", "authorUuid", "reportUuid", "text"};
  public static final String TABLE_NAME = "comments";
  public static final String COMMENT_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public CommentDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public Comment getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Comment> {
    private static final String SQL = "/* batch.getCommentsByUuids */ SELECT " + COMMENT_FIELDS
        + "FROM comments WHERE comments.uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(CommentDao.this.databaseHandler, SQL, "uuids", new CommentMapper());
    }
  }

  @Override
  public List<Comment> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Override
  public Comment insertInternal(Comment c) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate("/* insertComment */ "
          + "INSERT INTO comments (uuid, \"reportUuid\", \"authorUuid\", \"createdAt\", \"updatedAt\", text)"
          + "VALUES (:uuid, :reportUuid, :authorUuid, :createdAt, :updatedAt, :text)").bindBean(c)
          .bind("createdAt", DaoUtils.asLocalDateTime(c.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(c.getUpdatedAt())).execute();
      return c;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(Comment c) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* updateComment */ UPDATE comments SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(c).bind("updatedAt", DaoUtils.asLocalDateTime(c.getUpdatedAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public List<Comment> getCommentsForReport(String reportUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery("/* getCommentForReport */ SELECT " + COMMENT_FIELDS + "FROM comments "
              + "WHERE comments.\"reportUuid\" = :reportUuid ORDER BY comments.\"createdAt\" ASC")
          .bind("reportUuid", reportUuid).map(new CommentMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int deleteInternal(String commentUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate("/* deleteComment */ DELETE FROM comments where uuid = :uuid")
          .bind("uuid", commentUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

}
