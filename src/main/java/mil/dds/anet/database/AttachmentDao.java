package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.invoke.MethodHandles;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class AttachmentDao extends AnetBaseDao<Attachment, AbstractSearchQuery<?>> {

  public static final String[] fields = {"uuid", "authorUuid", "fileName", "mimeType",
      "contentLength", "description", "classification", "createdAt", "updatedAt"};
  public static final String[] contentFields = {"uuid", "content"};
  public static final String TABLE_NAME = "attachments";
  public static final String ATTACHMENT_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);
  public static final String CONTENT_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, contentFields, true);

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
    getDbHandle()
        .createUpdate("/* insertAttachment */ "
            + "INSERT INTO \"attachments\" (uuid, \"authorUuid\", \"mimeType\", \"content\","
            + "\"contentLength\", \"fileName\", \"description\", \"classification\", "
            + "\"createdAt\", \"updatedAt\") " + "VALUES (:uuid, :authorUuid, :mimeType, :content, "
            + ":contentLength, :fileName, :description, :classification, :createdAt, :updatedAt)")
        .bindBean(obj).bind("createdAt", DaoUtils.asLocalDateTime(obj.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt()))
        .bind("content", obj.getContentBlob()).bind("authorUuid", obj.getAuthorUuid())
        .bind("classification", DaoUtils.getEnumId(obj.getClassification())).execute();
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
            + "\"updatedAt\" = :updatedAt " + "WHERE uuid = :uuid")
        .bindBean(obj).bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt()))
        .bind("classification", DaoUtils.getEnumId(obj.getClassification()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt())).execute();
  }

  @Override
  public int deleteInternal(String uuid) {
    deleteAttachmentRelatedObjects(uuid);
    return getDbHandle()
        .createUpdate("/* deleteAttachment */ DELETE FROM attachments where uuid = :uuid")
        .bind("uuid", uuid).execute();
  }

  @InTransaction
  public void streamContentBlob(final String uuid, final OutputStream outputStream) {
    final String sql = "/* getAttachmentContent */ SELECT " + CONTENT_FIELDS
        + " FROM \"attachments\" WHERE uuid = :uuid";
    final Attachment attachment =
        getDbHandle().createQuery(sql).bind("uuid", uuid).map(new AttachmentMapper()).first();
    final Blob blob = attachment.getContentBlob();
    if (blob == null) {
      return;
    }
    try (final InputStream inputStream = blob.getBinaryStream()) {
      IOUtils.copyLarge(inputStream, outputStream);
      outputStream.flush();
    } catch (EofException e) {
      logger.warn("Streaming content of attachment {} was terminated by the client", uuid);
    } catch (SQLException e) {
      throw new RuntimeException("Could not read content of attachment " + uuid, e);
    } catch (IOException e) {
      throw new RuntimeException("Could not transfer content of attachment " + uuid, e);
    }
  }

  public CompletableFuture<List<Attachment>> getAttachmentsForRelatedObject(
      @GraphQLRootContext Map<String, Object> context, String relatedObjectUuid) {
    return new ForeignKeyFetcher<Attachment>()
        .load(context, FkDataLoaderKey.ATTACHMENT_RELATED_OBJECT_ATTACHMENTS, relatedObjectUuid)
        .thenApply(attachments -> attachments.stream().collect(Collectors.toList()));
  }

  public List<List<Attachment>> getAttachmentsOfRelatedObject(List<String> foreignKeys) {
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

  private void insertAttachmentRelatedObjects(String uuid,
      List<AttachmentRelatedObject> attachmentRelatedObjects) {
    for (final AttachmentRelatedObject aro : attachmentRelatedObjects) {
      getDbHandle().createUpdate("/* insertAttachmentRelatedObject */ "
          + "INSERT INTO \"attachmentRelatedObjects\" (\"attachmentUuid\", \"relatedObjectType\", \"relatedObjectUuid\")"
          + "VALUES (:attachmentUuid, :relatedObjectType, :relatedObjectUuid)").bindBean(aro)
          .bind("attachmentUuid", uuid).execute();
    }
  }

  private void deleteAttachmentRelatedObjects(String uuid) {
    getDbHandle().execute(
        "/* deleteAttachmentRelatedObjects */ DELETE FROM \"attachmentRelatedObjects\" WHERE \"attachmentUuid\" = ?",
        uuid);
  }
}
