package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;

import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.NoteMapper;
import mil.dds.anet.database.mappers.NoteRelatedObjectMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
@RegisterRowMapper(NoteMapper.class)
public class NoteDao extends AnetBaseDao<Note> {

	public NoteDao() {
		super("Notes", "notes", "*", null);
	}

	public AnetBeanList<Note> getAll(int pageNum, int pageSize) {
		final String sql;
		if (DaoUtils.isMsSql()) {
			sql = "/* getAllNotes */ SELECT notes.*, COUNT(*) OVER() AS totalCount "
					+ "FROM notes ORDER BY \"updatedAt\" DESC "
					+ "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else {
			sql = "/* getAllNotes */ SELECT * from notes "
					+ "ORDER BY \"updatedAt\" DESC LIMIT :limit OFFSET :offset";
		}

		final Query query = getDbHandle().createQuery(sql)
			.bind("limit", pageSize)
			.bind("offset", pageSize * pageNum);
		return new AnetBeanList<Note>(query, pageNum, pageSize, new NoteMapper(), null);
	}

	public Note getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<Note> getByIds(List<String> uuids) {
		final String idBatcherSql = "/* batch.getNotesByUuids */ SELECT * FROM notes WHERE uuid IN ( <uuids> )";
		final IdBatcher<Note> idBatcher = new IdBatcher<Note>(getDbHandle(), idBatcherSql, "uuids", new NoteMapper());
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Note insertInternal(Note n) {
		getDbHandle().createUpdate(
				"/* insertNote */ INSERT INTO notes (uuid, \"authorUuid\", text, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :authorUuid, :text, :createdAt, :updatedAt)")
			.bindBean(n)
			.bind("createdAt", DaoUtils.asLocalDateTime(n.getCreatedAt()))
			.bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt()))
			.bind("authorUuid", n.getAuthorUuid())
			.execute();
		insertNoteRelatedObjects(DaoUtils.getUuid(n), n.getNoteRelatedObjects());
		return n;
	}

	@Override
	public int updateInternal(Note n) {
		deleteNoteRelatedObjects(DaoUtils.getUuid(n)); // seems the easiest thing to do
		insertNoteRelatedObjects(DaoUtils.getUuid(n), n.getNoteRelatedObjects());
		return getDbHandle().createUpdate("/* updateNote */ UPDATE notes "
					+ "SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindBean(n)
				.bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt()))
				.execute();
	}

	@Override
	public int deleteInternal(String uuid) {
		deleteNoteRelatedObjects(uuid);
		return getDbHandle().createUpdate("/* deleteNote */ DELETE FROM notes where uuid = :uuid")
			.bind("uuid", uuid)
			.execute();
	}

	public CompletableFuture<List<Note>> getNotesForRelatedObject(@GraphQLRootContext Map<String, Object> context, String relatedObjectUuid) {
		return new ForeignKeyFetcher<Note>()
				.load(context, "noteRelatedObject.notes", relatedObjectUuid);
	}

	public List<List<Note>> getNotes(List<String> foreignKeys) {
		final String notesBatcherSql = "/* batch.getNotesForRelatedObject */ SELECT * FROM \"noteRelatedObjects\" "
				+ "INNER JOIN notes ON \"noteRelatedObjects\".\"noteUuid\" = notes.uuid "
				+ "WHERE \"noteRelatedObjects\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
				+ "ORDER BY notes.\"updatedAt\" DESC";
		final ForeignKeyBatcher<Note> notesBatcher = new ForeignKeyBatcher<Note>(getDbHandle(), notesBatcherSql, "foreignKeys", new NoteMapper(), "relatedObjectUuid");
		return notesBatcher.getByForeignKeys(foreignKeys);
	}

	public List<List<NoteRelatedObject>> getNoteRelatedObjects(List<String> foreignKeys) {
		final String noteRelatedObjectsBatcherSql = "/* batch.getNoteRelatedObjects */ SELECT * FROM \"noteRelatedObjects\" "
				+ "WHERE \"noteUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectuuid\" ASC";
		final ForeignKeyBatcher<NoteRelatedObject> noteRelatedObjectsBatcher = new ForeignKeyBatcher<NoteRelatedObject>(getDbHandle(), noteRelatedObjectsBatcherSql, "foreignKeys", new NoteRelatedObjectMapper(), "noteUuid");
		return noteRelatedObjectsBatcher.getByForeignKeys(foreignKeys);
	}

	public CompletableFuture<List<NoteRelatedObject>> getRelatedObjects(Map<String, Object> context, Note note) {
		return new ForeignKeyFetcher<NoteRelatedObject>()
				.load(context, "note.noteRelatedObjects", note.getUuid());
	}

	private void insertNoteRelatedObjects(String uuid, List<NoteRelatedObject> noteRelatedObjects) {
		for (final NoteRelatedObject nro : noteRelatedObjects) {
			getDbHandle().createUpdate(
					"/* insertNoteRelatedObject */ INSERT INTO \"noteRelatedObjects\" (\"noteUuid\", \"relatedObjectType\", \"relatedObjectUuid\") "
						+ "VALUES (:noteUuid, :relatedObjectType, :relatedObjectUuid)")
				.bindBean(nro)
				.bind("noteUuid", uuid)
				.execute();
		}
	}

	private void deleteNoteRelatedObjects(String uuid) {
		getDbHandle().execute("/* deleteNoteRelatedObjects */ DELETE FROM \"noteRelatedObjects\" WHERE \"noteUuid\" = ?", uuid);
	}

}
