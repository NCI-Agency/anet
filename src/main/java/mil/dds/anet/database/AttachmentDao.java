package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.AttachmentRelatedObject;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.AttachmentMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class AttachmentDao extends AnetBaseDao<Attachment, AbstractSearchQuery<?>> {
  @Override
  public Attachment getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Attachment> {
    private static final String sql = "/* batch.getAttachmentByUuids */ "
        + "SELECT * FROM \"attachments\" WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new AttachmentMapper());
    }
  }

  @Override
  public List<Attachment> getByIds(List<String> uuids) {
    final IdBatcher<Attachment> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public Attachment insertInternal(Attachment obj) {
    getDbHandle()
        .createUpdate("/* insertAttachment */ "
            + "INSERT INTO \"attachments\" (uuid, \"mimeType\", \"content\","
            + "\"fileName\", \"description\", \"classification\", \"relatedObjectType\", "
            + " \"relatedObjectUuid\", \"createdAt\", \"updatedAt\") VALUES (:uuid, :mimeType, "
            + " :content, :fileName, :description, :classification, :relatedObjectType, "
            + " :relatedObjectUuid, :createdAt, :updatedAt)")
        .bindBean(obj).bind("createdAt", DaoUtils.asLocalDateTime(obj.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt())).execute();
    return obj;
  }

  @Override
  public int updateInternal(Attachment obj) {
    return getDbHandle()
        .createUpdate(
            "/* updateAttachment */ " + "UPDATE \"attachments\" SET \"mimeType\" = :mimeType, "
                + "\"content\" = :content, " + "\"fileName\" = :fileName, "
                + "\"description\" = :description, " + "\"classification\" = :classification, "
                + "\"relatedObjectType\" = :relatedObjectType, "
                + "\"relatedObjectUuid\" = :relatedObjectUuid, \"updatedAt\" = :updatedAt "
                + "WHERE uuid = :uuid")
        .bindBean(obj).bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt())).execute();
  }

  @InTransaction
  public int deleteFor(String relatedObjectUuid) {
    return getDbHandle().execute(
        "/* deleteAttachment */ " + "DELETE FROM \"attachments\" WHERE \"relatedObjectUuid\" = ?",
        relatedObjectUuid);
  }

  public CompletableFuture<List<AttachmentRelatedObject>> getAttachmentsForRelatedObject(
      @GraphQLRootContext Map<String, Object> context, String relatedObjectUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    return new ForeignKeyFetcher<Attachment>()
        .load(context, FkDataLoaderKey.RELATED_OBJECT_ATTACHMENTS, relatedObjectUuid)
        .thenApply(attList -> attList.stream()
            // TODO .filter(att -> hasAttachmentAuthorization(user, att))
            .collect(Collectors.toList()));
  }

  static class AttachmentBatcher extends ForeignKeyBatcher<Attachment> {
    private static final String sql =
        "/* batch.getAttachmentsForRelatedObject */ " + "SELECT * FROM \"attachment\" "
            + "WHERE \"attachment\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
            + "ORDER BY \"attachment\".\"fileName\"";

    public AttachmentBatcher() {
      super(sql, "foreignKeys", new AttachmentMapper(), "relatedObjectUuid");
    }
  }

  public List<List<Attachment>> getAttachments(List<String> foreignKeys) {
    final ForeignKeyBatcher<Attachment> attachmentBatcher = AnetObjectEngine.getInstance()
        .getInjector().getInstance(AttachmentDao.AttachmentBatcher.class);
    return attachmentBatcher.getByForeignKeys(foreignKeys);
  }
}
