package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.NoteMapper;
import mil.dds.anet.database.mappers.NoteRelatedObjectMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;

public class NoteDao extends AnetBaseDao<Note, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "notes";

  public Note getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Note> {
    private static final String sql =
        "/* batch.getNotesByUuids */ SELECT * FROM notes WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new NoteMapper());
    }
  }

  @Override
  public List<Note> getByIds(List<String> uuids) {
    final IdBatcher<Note> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public Note insert(Note obj) {
    DaoUtils.setInsertFields(obj);
    final Note note = insertInternal(obj);
    updateSubscriptions(1, note);
    return note;
  }

  @Override
  public Note insertInternal(Note n) {
    getDbHandle().createUpdate(
        "/* insertNote */ INSERT INTO notes (uuid, \"authorUuid\", type, text, \"createdAt\", \"updatedAt\") "
            + "VALUES (:uuid, :authorUuid, :type, :text, :createdAt, :updatedAt)")
        .bindBean(n).bind("createdAt", DaoUtils.asLocalDateTime(n.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt()))
        .bind("authorUuid", n.getAuthorUuid()).bind("type", DaoUtils.getEnumId(n.getType()))
        .execute();
    insertNoteRelatedObjects(DaoUtils.getUuid(n), n.getNoteRelatedObjects());
    return n;
  }

  @Override
  public int update(Note obj) {
    DaoUtils.setUpdateFields(obj);
    final int numRows = updateInternal(obj);
    updateSubscriptions(numRows, obj);
    return numRows;
  }

  @Override
  public int updateInternal(Note n) {
    deleteNoteRelatedObjects(DaoUtils.getUuid(n)); // seems the easiest thing to do
    insertNoteRelatedObjects(DaoUtils.getUuid(n), n.getNoteRelatedObjects());
    return getDbHandle()
        .createUpdate("/* updateNote */ UPDATE notes "
            + "SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
        .bindBean(n).bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt())).execute();
  }

  @Override
  public int delete(String uuid) {
    final Note note = getByUuid(uuid);
    note.loadNoteRelatedObjects(AnetObjectEngine.getInstance().getContext()).join();
    DaoUtils.setUpdateFields(note);
    updateSubscriptions(1, note);
    return deleteInternal(uuid);
  }

  @Override
  public int deleteInternal(String uuid) {
    deleteNoteRelatedObjects(uuid);
    return getDbHandle().createUpdate("/* deleteNote */ DELETE FROM notes where uuid = :uuid")
        .bind("uuid", uuid).execute();
  }

  public CompletableFuture<List<Note>> getNotesForRelatedObject(
      @GraphQLRootContext Map<String, Object> context, String relatedObjectUuid) {
    return new ForeignKeyFetcher<Note>().load(context, FkDataLoaderKey.NOTE_RELATED_OBJECT_NOTES,
        relatedObjectUuid);
  }

  static class NotesBatcher extends ForeignKeyBatcher<Note> {
    private static final String sql =
        "/* batch.getNotesForRelatedObject */ SELECT * FROM \"noteRelatedObjects\" "
            + "INNER JOIN notes ON \"noteRelatedObjects\".\"noteUuid\" = notes.uuid "
            + "WHERE \"noteRelatedObjects\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
            + "ORDER BY notes.\"updatedAt\" DESC";

    public NotesBatcher() {
      super(sql, "foreignKeys", new NoteMapper(), "relatedObjectUuid");
    }
  }

  public List<List<Note>> getNotes(List<String> foreignKeys) {
    final ForeignKeyBatcher<Note> notesBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(NotesBatcher.class);
    return notesBatcher.getByForeignKeys(foreignKeys);
  }

  static class NoteRelatedObjectsBatcher extends ForeignKeyBatcher<NoteRelatedObject> {
    private static final String sql =
        "/* batch.getNoteRelatedObjects */ SELECT * FROM \"noteRelatedObjects\" "
            + "WHERE \"noteUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectUuid\" ASC";

    public NoteRelatedObjectsBatcher() {
      super(sql, "foreignKeys", new NoteRelatedObjectMapper(), "noteUuid");
    }
  }

  public List<List<NoteRelatedObject>> getNoteRelatedObjects(List<String> foreignKeys) {
    final ForeignKeyBatcher<NoteRelatedObject> noteRelatedObjectsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(NoteRelatedObjectsBatcher.class);
    return noteRelatedObjectsBatcher.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<NoteRelatedObject>> getRelatedObjects(Map<String, Object> context,
      Note note) {
    return new ForeignKeyFetcher<NoteRelatedObject>().load(context,
        FkDataLoaderKey.NOTE_NOTE_RELATED_OBJECTS, note.getUuid());
  }

  private void insertNoteRelatedObjects(String uuid, List<NoteRelatedObject> noteRelatedObjects) {
    for (final NoteRelatedObject nro : noteRelatedObjects) {
      getDbHandle().createUpdate(
          "/* insertNoteRelatedObject */ INSERT INTO \"noteRelatedObjects\" (\"noteUuid\", \"relatedObjectType\", \"relatedObjectUuid\") "
              + "VALUES (:noteUuid, :relatedObjectType, :relatedObjectUuid)")
          .bindBean(nro).bind("noteUuid", uuid).execute();
    }
  }

  private void deleteNoteRelatedObjects(String uuid) {
    getDbHandle().execute(
        "/* deleteNoteRelatedObjects */ DELETE FROM \"noteRelatedObjects\" WHERE \"noteUuid\" = ?",
        uuid);
  }

  private void updateSubscriptions(int numRows, Note obj) {
    if (numRows > 0) {
      final List<SubscriptionUpdateGroup> subscriptionUpdates = getSubscriptionUpdates(obj);
      final SubscriptionDao subscriptionDao = AnetObjectEngine.getInstance().getSubscriptionDao();
      for (final SubscriptionUpdateGroup subscriptionUpdate : subscriptionUpdates) {
        subscriptionDao.updateSubscriptions(subscriptionUpdate);
      }
    }
  }

  private List<SubscriptionUpdateGroup> getSubscriptionUpdates(Note obj) {
    final String paramTpl = "noteRelatedObject%1$d";
    final List<SubscriptionUpdateGroup> updates = new ArrayList<>();
    final ListIterator<NoteRelatedObject> iter = obj.getNoteRelatedObjects().listIterator();
    while (iter.hasNext()) {
      final String param = String.format(paramTpl, iter.nextIndex());
      final NoteRelatedObject nro = iter.next();
      final SubscriptionUpdateStatement stmt =
          AnetSubscribableObjectDao.getCommonSubscriptionUpdateStatement(true,
              nro.getRelatedObjectUuid(), nro.getRelatedObjectType(), param);
      updates.add(new SubscriptionUpdateGroup(nro.getRelatedObjectType(),
          nro.getRelatedObjectUuid(), obj.getUpdatedAt(), stmt, true));
    }
    return updates;
  }
}
