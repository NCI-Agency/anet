package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Note.NoteType;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.NoteMapper;
import mil.dds.anet.database.mappers.NoteRelatedObjectMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class NoteDao extends AnetBaseDao<Note, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "notes";

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
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
  public int updateInternal(Note n) {
    deleteNoteRelatedObjects(DaoUtils.getUuid(n)); // seems the easiest thing to do
    insertNoteRelatedObjects(DaoUtils.getUuid(n), n.getNoteRelatedObjects());
    return getDbHandle()
        .createUpdate("/* updateNote */ UPDATE notes "
            + "SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
        .bindBean(n).bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt())).execute();
  }

  @InTransaction
  public int updateNoteTypeAndText(Note n) {
    return getDbHandle()
        .createUpdate(
            "/* updateNote */ UPDATE notes SET type = :type, text = :text WHERE uuid = :uuid")
        .bindBean(n).bind("type", DaoUtils.getEnumId(n.getType())).execute();
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

  @InTransaction
  public void deleteDanglingNotes() {
    // 1. for report assessments, their noteRelatedObjects can be deleted
    // if the report they point to has been deleted
    final int nrReportAssessmentsNroDeleted = getDbHandle().execute(
        "/* deleteDanglingNoteRelatedObjectsForReportAssessments */"
            + "DELETE FROM \"noteRelatedObjects\" WHERE \"noteUuid\" IN ("
            + " SELECT n.uuid FROM notes n WHERE n.type = ? AND EXISTS ("
            + "  SELECT nro_reports.\"noteUuid\" FROM \"noteRelatedObjects\" nro_reports"
            + "  WHERE nro_reports.\"relatedObjectType\" = ?"
            + "  AND nro_reports.\"noteUuid\" = n.uuid AND NOT EXISTS ("
            + "    SELECT r.uuid FROM reports r"
            + "    WHERE r.uuid = nro_reports.\"relatedObjectUuid\")))",
        DaoUtils.getEnumId(Note.NoteType.ASSESSMENT), ReportDao.TABLE_NAME);
    logger.info("Deleted {} dangling noteRelatedObjects for assessments of deleted reports",
        nrReportAssessmentsNroDeleted);

    // 2. noteRelatedObjects can be deleted if the relatedObject they point to no longer exists;
    // since only positions and reports can be deleted and can have notes, just check these two
    final int nrPositionsNroDeleted = getDbHandle().execute(
        "/* deleteDanglingNoteRelatedObjectsForPositions */ DELETE FROM \"noteRelatedObjects\""
            + " WHERE \"relatedObjectType\" = ?"
            + " AND \"relatedObjectUuid\" NOT IN ( SELECT uuid FROM positions )",
        PositionDao.TABLE_NAME);
    logger.info("Deleted {} dangling noteRelatedObjects for deleted positions",
        nrPositionsNroDeleted);
    final int nrReportsNroDeleted = getDbHandle().execute(
        "/* deleteDanglingNoteRelatedObjectsForReports */ DELETE FROM \"noteRelatedObjects\""
            + " WHERE \"relatedObjectType\" = ?"
            + " AND \"relatedObjectUuid\" NOT IN ( SELECT uuid FROM reports )",
        ReportDao.TABLE_NAME);
    logger.info("Deleted {} dangling noteRelatedObjects for deleted reports", nrReportsNroDeleted);

    // 3. a note can be deleted if there are no longer any noteRelatedObjects linking to it
    final int nrNotesDeleted = getDbHandle().execute("/* deleteDanglingNotes */ DELETE FROM notes"
        + " WHERE uuid NOT IN ( SELECT \"noteUuid\" FROM \"noteRelatedObjects\" )");
    logger.info("Deleted {} dangling notes", nrNotesDeleted);
  }

  @InTransaction
  public List<Note> getNotesByType(NoteType type) {
    return getDbHandle().createQuery("/* getNotesByType*/ SELECT * FROM notes WHERE type = :type")
        .bind("type", DaoUtils.getEnumId(type)).map(new NoteMapper()).list();
  }
}
