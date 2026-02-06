package mil.dds.anet.database;


import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.ListIterator;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.GenericRelatedObjectMapper;
import mil.dds.anet.database.mappers.NoteMapper;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class NoteDao extends AnetBaseDao<Note, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "notes";

  public NoteDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  public enum UpdateType {
    CREATE, READ, UPDATE, DELETE
  }

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
  public Note getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Note> {
    private static final String SQL =
        "/* batch.getNotesByUuids */ SELECT * FROM notes WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(NoteDao.this.databaseHandler, SQL, "uuids", new NoteMapper());
    }
  }

  @Override
  public List<Note> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Transactional
  @Override
  public Note insert(Note obj) {
    DaoUtils.setInsertFields(obj);
    return insertInternal(obj);
  }

  @Override
  public Note insertInternal(Note n) {
    final Handle handle = getDbHandle();
    try {
      handle
          .createUpdate("/* insertNote */ INSERT INTO notes"
              + " (uuid, \"authorUuid\", text, \"createdAt\", \"updatedAt\")"
              + " VALUES (:uuid, :authorUuid, :text, :createdAt, :updatedAt)")
          .bindBean(n).bind("createdAt", DaoUtils.asLocalDateTime(n.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt()))
          .bind("authorUuid", n.getAuthorUuid()).execute();
      insertNoteRelatedObjects(DaoUtils.getUuid(n), n.getNoteRelatedObjects());
      return n;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  @Override
  public int update(Note obj) {
    DaoUtils.setUpdateFields(obj);
    return updateInternal(obj);
  }

  @Override
  public int updateInternal(Note n) {
    final Handle handle = getDbHandle();
    try {
      deleteNoteRelatedObjects(DaoUtils.getUuid(n)); // seems the easiest thing to do
      insertNoteRelatedObjects(DaoUtils.getUuid(n), n.getNoteRelatedObjects());
      // We don't update the type and assessmentKey!
      return handle
          .createUpdate("/* updateNote */ UPDATE notes "
              + "SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(n).bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  @Override
  public int delete(String uuid) {
    return deleteInternal(uuid);
  }

  @Override
  public int deleteInternal(String uuid) {
    final Handle handle = getDbHandle();
    try {
      deleteNoteRelatedObjects(uuid);
      return handle.createUpdate("/* deleteNote */ DELETE FROM notes where uuid = :uuid")
          .bind("uuid", uuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<Note>> getNotesForRelatedObject(
      @GraphQLRootContext GraphQLContext context, String relatedObjectUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    return new ForeignKeyFetcher<Note>()
        .load(context, FkDataLoaderKey.NOTE_RELATED_OBJECT_NOTES, relatedObjectUuid)
        .thenApply(notes -> notes.stream().filter(note -> {
          try {
            return hasNotePermission(user, note.getAuthorUuid(), UpdateType.READ);
          } catch (Exception e) {
            // something wrong with the note, just filter it out
            return false;
          }
        }).toList());
  }

  class NotesBatcher extends ForeignKeyBatcher<Note> {
    private static final String SQL =
        "/* batch.getNotesForRelatedObject */ SELECT * FROM \"noteRelatedObjects\" "
            + "INNER JOIN notes ON \"noteRelatedObjects\".\"noteUuid\" = notes.uuid "
            + "WHERE \"noteRelatedObjects\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
            + "ORDER BY notes.\"updatedAt\" DESC";

    public NotesBatcher() {
      super(NoteDao.this.databaseHandler, SQL, "foreignKeys", new NoteMapper(),
          "relatedObjectUuid");
    }
  }

  public List<List<Note>> getNotes(List<String> foreignKeys) {
    return new NotesBatcher().getByForeignKeys(foreignKeys);
  }

  class NoteRelatedObjectsBatcher extends ForeignKeyBatcher<GenericRelatedObject> {
    private static final String SQL =
        "/* batch.getNoteRelatedObjects */ SELECT * FROM \"noteRelatedObjects\" "
            + "WHERE \"noteUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectUuid\" ASC";

    public NoteRelatedObjectsBatcher() {
      super(NoteDao.this.databaseHandler, SQL, "foreignKeys",
          new GenericRelatedObjectMapper("noteUuid"), "noteUuid");
    }
  }

  public List<List<GenericRelatedObject>> getNoteRelatedObjects(List<String> foreignKeys) {
    return new NoteRelatedObjectsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<GenericRelatedObject>> getRelatedObjects(GraphQLContext context,
      Note note) {
    return new ForeignKeyFetcher<GenericRelatedObject>().load(context,
        FkDataLoaderKey.NOTE_NOTE_RELATED_OBJECTS, note.getUuid());
  }

  private void insertNoteRelatedObjects(String uuid,
      List<GenericRelatedObject> noteRelatedObjects) {
    final Handle handle = getDbHandle();
    try {
      for (final GenericRelatedObject nro : noteRelatedObjects) {
        handle.createUpdate(
            "/* insertNoteRelatedObject */ INSERT INTO \"noteRelatedObjects\" (\"noteUuid\", \"relatedObjectType\", \"relatedObjectUuid\") "
                + "VALUES (:noteUuid, :relatedObjectType, :relatedObjectUuid)")
            .bindBean(nro).bind("noteUuid", uuid).execute();
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  private void deleteNoteRelatedObjects(String uuid) {
    final Handle handle = getDbHandle();
    try {
      handle.execute(
          "/* deleteNoteRelatedObjects */ DELETE FROM \"noteRelatedObjects\" WHERE \"noteUuid\" = ?",
          uuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void deleteDanglingNotes() {
    // 1. noteRelatedObjects can be deleted if the relatedObject they point to no longer exists;
    // since only positions and reports can be deleted and can have notes, just check these two
    final int nrPositionsNroDeleted = deleteNoteRelatedObjects(PositionDao.TABLE_NAME, null);
    logger.info("Deleted {} dangling noteRelatedObjects for deleted positions",
        nrPositionsNroDeleted);
    final int nrReportsNroDeleted = deleteNoteRelatedObjects(ReportDao.TABLE_NAME, null);
    logger.info("Deleted {} dangling noteRelatedObjects for deleted reports", nrReportsNroDeleted);

    // 2. a note can be deleted if there are no longer any noteRelatedObjects linking to it
    final int nrNotesDeleted = deleteOrphanNotes();
    logger.info("Deleted {} dangling notes", nrNotesDeleted);
  }

  public int deleteNoteRelatedObjects(String tableName, String uuid) {
    final Handle handle = getDbHandle();
    try {
      final String notIn =
          String.format("\"relatedObjectUuid\" NOT IN ( SELECT uuid FROM \"%1$s\" )", tableName);
      final String equals = "\"relatedObjectUuid\" = ?";
      final String sql = String.format(
          "/* deleteDanglingNoteRelatedObjectsFor_%1$s */ DELETE FROM \"noteRelatedObjects\""
              + " WHERE \"relatedObjectType\" = ? AND %2$s",
          tableName, uuid == null ? notIn : equals);
      return uuid == null ? handle.execute(sql, tableName) : handle.execute(sql, tableName, uuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  public int deleteOrphanNotes() {
    final Handle handle = getDbHandle();
    try {
      return handle.execute("/* deleteDanglingNotes */ DELETE FROM notes"
          + " WHERE uuid NOT IN ( SELECT \"noteUuid\" FROM \"noteRelatedObjects\" )");
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public boolean hasNotePermission(final Person user, final String authorUuid,
      final UpdateType updateType) {
    // Admins always have access
    // Note that system user means this is called through e.g. a worker or a merge function
    if (Person.isSystemUser(user) || AuthUtils.isAdmin(user)) {
      return true;
    }

    return switch (updateType) {
      case CREATE, READ -> true;
      case UPDATE, DELETE -> Objects.equals(authorUuid, DaoUtils.getUuid(user));
    };
  }

  @Transactional
  public void updateSubscriptions(Note obj, String auditTrailUuid, boolean isDelete) {
    final List<SubscriptionUpdateGroup> subscriptionUpdates =
        getSubscriptionUpdates(obj, auditTrailUuid, isDelete);
    final SubscriptionDao subscriptionDao = engine().getSubscriptionDao();
    for (final SubscriptionUpdateGroup subscriptionUpdate : subscriptionUpdates) {
      subscriptionDao.updateSubscriptions(subscriptionUpdate, auditTrailUuid);
    }
  }

  private List<SubscriptionUpdateGroup> getSubscriptionUpdates(Note obj, String auditTrailUuid,
      boolean isDelete) {
    final String paramTpl = "noteRelatedObject%1$d";
    final List<SubscriptionUpdateGroup> updates = new ArrayList<>();
    final ListIterator<GenericRelatedObject> iter = obj.getNoteRelatedObjects().listIterator();
    while (iter.hasNext()) {
      final String param = String.format(paramTpl, iter.nextIndex());
      final GenericRelatedObject nro = iter.next();
      final SubscriptionUpdateStatement stmt =
          AnetSubscribableObjectDao.getCommonSubscriptionUpdateStatement(true,
              nro.getRelatedObjectUuid(), nro.getRelatedObjectType(), param);
      updates
          .add(new SubscriptionUpdateGroup(nro.getRelatedObjectType(), nro.getRelatedObjectUuid(),
              auditTrailUuid, isDelete ? Instant.now() : obj.getUpdatedAt(), stmt, true));
    }
    return updates;
  }

}
