package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import io.leangen.graphql.annotations.GraphQLRootContext;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.invoke.MethodHandles;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.AttachmentRelatedObject;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.AttachmentMapper;
import mil.dds.anet.database.mappers.AttachmentRelatedObjectMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.apache.commons.io.IOUtils;
import org.eclipse.jetty.io.EofException;
import org.jdbi.v3.core.result.ResultIterable;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class AttachmentDao extends AnetBaseDao<Attachment, AbstractSearchQuery<?>> {

  public static final String[] fields = {"uuid", "authorUuid", "fileName", "mimeType",
      "description", "classification", "caption", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "attachments";
  public static final String ATTACHMENT_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true) + String.format(
          ", CASE WHEN \"%1$s\".\"%2$s\" IS NULL THEN -1 ELSE \"%1$s\".\"%3$s\" END AS \"%1$s_%3$s\"",
          TABLE_NAME, "content", "contentLength");

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
  public Attachment getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Attachment> {
    private static final String sql = "/* batch.getAttachmentByUuids */ SELECT " + ATTACHMENT_FIELDS
        + " FROM \"attachments\" WHERE uuid IN ( <uuids> )";

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
    getDbHandle().createUpdate("/* insertAttachment */ "
        + "INSERT INTO \"attachments\" (uuid, \"authorUuid\", \"mimeType\","
        + "\"contentLength\", \"fileName\", \"description\", \"classification\",\"caption\", "
        + "\"createdAt\", \"updatedAt\") " + "VALUES (:uuid, :authorUuid, :mimeType, "
        + ":contentLength, :fileName, :description, :classification,:caption,:createdAt, :updatedAt)")
        .bindBean(obj).bind("createdAt", DaoUtils.asLocalDateTime(obj.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt()))
        .bind("authorUuid", obj.getAuthorUuid()).execute();
    if (obj.getAttachmentRelatedObjects().get(0).getRelatedObjectUuid() != null)
      insertAttachmentRelatedObjects(DaoUtils.getUuid(obj), obj.getAttachmentRelatedObjects());
    return obj;
  }

  @Override
  public int updateInternal(Attachment obj) {
    deleteAttachmentRelatedObjects(DaoUtils.getUuid(obj));
    insertAttachmentRelatedObjects(DaoUtils.getUuid(obj), obj.getAttachmentRelatedObjects());

    return getDbHandle()
        .createUpdate("/* updateAttachment */ "
            + "UPDATE \"attachments\" SET \"mimeType\" = :mimeType, " + "\"fileName\" = :fileName, "
            + "\"description\" = :description, " + "\"classification\" = :classification, "
            + "\"caption\" = :caption, " + "\"updatedAt\" = :updatedAt " + "WHERE uuid = :uuid")
        .bindBean(obj).bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt())).execute();
  }

  @Override
  public int deleteInternal(String uuid) {
    deleteAttachmentRelatedObjects(uuid);
    return getDbHandle()
        .createUpdate("/* deleteAttachment */ DELETE FROM attachments where uuid = :uuid")
        .bind("uuid", uuid).execute();
  }

  public interface AttachmentContent {
    @SqlUpdate("UPDATE attachments SET content = :content WHERE uuid = :uuid")
    void updateContent(@Bind("uuid") String uuid, @Bind("content") InputStream content);

    @SqlQuery("SELECT content FROM attachments WHERE uuid = :uuid")
    InputStream readContent(@Bind("uuid") String uuid);
  }

  @InTransaction
  public void streamContentBlob(final String uuid, final OutputStream outputStream) {
    try (final InputStream inputStream =
        getDbHandle().attach(AttachmentContent.class).readContent(uuid)) {
      IOUtils.copyLarge(inputStream, outputStream);
      outputStream.flush();
    } catch (EofException e) {
      logger.warn("Streaming content of attachment {} was terminated by the client", uuid);
    } catch (IOException e) {
      throw new RuntimeException("Could not transfer content of attachment " + uuid, e);
    }
  }

  @InTransaction
  public void saveContentBlob(final String uuid, final InputStream inputStream) {
    getDbHandle().attach(AttachmentContent.class).updateContent(uuid, inputStream);
  }

  public CompletableFuture<List<Attachment>> getAttachmentsForRelatedObject(
      @GraphQLRootContext Map<String, Object> context, String relatedObjectUuid) {
    return new ForeignKeyFetcher<Attachment>()
        .load(context, FkDataLoaderKey.ATTACHMENT_RELATED_OBJECT_ATTACHMENTS, relatedObjectUuid)
        .thenApply(attachments -> attachments.stream().collect(Collectors.toList()));
  }

  public List<List<Attachment>> getRelatedObjectAttachments(List<String> foreignKeys) {
    final ForeignKeyBatcher<Attachment> attachmentsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(AttachmentBatcher.class);
    return attachmentsBatcher.getByForeignKeys(foreignKeys);
  }

  public List<List<AttachmentRelatedObject>> getAttachmentRelatedObjects(List<String> foreignKeys) {
    final ForeignKeyBatcher<AttachmentRelatedObject> attachmentRelatedObjectsBatcher =
        AnetObjectEngine.getInstance().getInjector()
            .getInstance(AttachmentRelatedObjectsBatcher.class);
    return attachmentRelatedObjectsBatcher.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<AttachmentRelatedObject>> getRelatedObjects(
      @GraphQLRootContext Map<String, Object> context, Attachment attachment) {
    return new ForeignKeyFetcher<AttachmentRelatedObject>().load(context,
        FkDataLoaderKey.ATTACHMENT_ATTACHMENT_RELATED_OBJECTS, attachment.getUuid());
  }

  static class AttachmentBatcher extends ForeignKeyBatcher<Attachment> {
    private static final String sql = "/* batch.getAttachmentsForRelatedObject */ "
        + "SELECT \"relatedObjectUuid\", " + ATTACHMENT_FIELDS
        + " FROM \"attachmentRelatedObjects\" "
        + "INNER JOIN attachments ON \"attachmentRelatedObjects\".\"attachmentUuid\" = attachments.uuid "
        + "WHERE \"attachmentRelatedObjects\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
        + "ORDER BY attachments.\"fileName\" DESC";

    public AttachmentBatcher() {
      super(sql, "foreignKeys", new AttachmentMapper(), "relatedObjectUuid");
    }
  }

  public List<List<Attachment>> getAttachments(List<String> foreignKeys) {
    final ForeignKeyBatcher<Attachment> attachmentBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(AttachmentBatcher.class);
    return attachmentBatcher.getByForeignKeys(foreignKeys);
  }

  static class AttachmentRelatedObjectsBatcher extends ForeignKeyBatcher<AttachmentRelatedObject> {
    private static final String sql =
        "/* batch.getAttachmentRelatedObjects */ SELECT * FROM \"attachmentRelatedObjects\" "
            + "WHERE \"attachmentUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectUuid\" ASC";

    public AttachmentRelatedObjectsBatcher() {
      super(sql, "foreignKeys", new AttachmentRelatedObjectMapper(), "attachmentUuid");
    }
  }

  public interface AttachmentBatch {
    @SqlBatch("INSERT INTO \"attachmentRelatedObjects\""
        + " (\"attachmentUuid\", \"relatedObjectType\", \"relatedObjectUuid\")"
        + "VALUES (:attachmentUuid, :relatedObjectType, :relatedObjectUuid)")
    void insertAttachmentRelatedObjects(@Bind("attachmentUuid") String attachmentUuid,
        @BindBean List<AttachmentRelatedObject> attachmentRelatedObjects);
  }

  private void insertAttachmentRelatedObjects(String uuid,
      List<AttachmentRelatedObject> attachmentRelatedObjects) {
    final AttachmentBatch ab = getDbHandle().attach(AttachmentBatch.class);
    ab.insertAttachmentRelatedObjects(uuid, attachmentRelatedObjects);
  }

  private void deleteAttachmentRelatedObjects(String attachmentUuid) {
    getDbHandle()
        .createUpdate(
            "/* deleteAttachmentRelatedObjects */ DELETE FROM \"attachmentRelatedObjects\""
                + " WHERE \"attachmentUuid\" = :attachmentUuid")
        .bind("attachmentUuid", attachmentUuid).execute();
  }

  public void deleteAttachments(String relatedObjectType, String relatedObjectUuid) {
    final String relatedObjectTypeParam = "relatedObjectType";
    final String relatedObjectUuidParam = "relatedObjectUuid";
    final String fromClause = "FROM \"attachmentRelatedObjects\" WHERE \"" + relatedObjectTypeParam
        + "\" = :relatedObjectType AND \"" + relatedObjectUuidParam + "\" = :relatedObjectUuid";
    final String selectAttachmentUuids = "SELECT \"attachmentUuid\" " + fromClause;

    // get uuid's of attachments linked to related object
    final Set<String> attachmentUuids = getDbHandle()
        .createQuery("/* selectAttachmentUuidsForRelatedObject */ " + selectAttachmentUuids)
        .bind(relatedObjectTypeParam, relatedObjectType)
        .bind(relatedObjectUuidParam, relatedObjectUuid).mapTo(String.class)
        .collect(Collectors.toSet());
    if (attachmentUuids.isEmpty()) {
      // nothing to delete
      return;
    }

    // delete attachmentRelatedObjects for the related object
    getDbHandle().createUpdate("/* deleteAttachmentRelatedObjects */ DELETE " + fromClause)
        .bind(relatedObjectTypeParam, relatedObjectType)
        .bind(relatedObjectUuidParam, relatedObjectUuid).execute();

    // delete attachments for the related object if they no longer have any links
    getDbHandle()
        .createUpdate("/* deleteAttachments */ DELETE FROM attachments"
            + " WHERE uuid in (<attachmentUuids>) AND uuid NOT IN (" + selectAttachmentUuids + ")")
        .bindList(NULL_KEYWORD, "attachmentUuids", attachmentUuids)
        .bind(relatedObjectTypeParam, relatedObjectType)
        .bind(relatedObjectUuidParam, relatedObjectUuid).execute();
  }
}
