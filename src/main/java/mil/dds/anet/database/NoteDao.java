package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;

import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.NoteMapper;
import mil.dds.anet.database.mappers.NoteRelatedObjectMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;

@RegisterRowMapper(NoteMapper.class)
public class NoteDao implements IAnetDao<Note> {

	private final Handle dbHandle;
	private final IdBatcher<Note> idBatcher;
	private final ForeignKeyBatcher<Note> notesBatcher;
	private final ForeignKeyBatcher<NoteRelatedObject> noteRelatedObjectsBatcher;

	public NoteDao(Handle h) {
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getNotesByUuids */ SELECT * FROM notes WHERE uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Note>(h, idBatcherSql, "uuids", new NoteMapper());

		final String notesBatcherSql = "/* batch.getNotesForRelatedObject */ SELECT * FROM \"noteRelatedObjects\" "
				+ "INNER JOIN notes ON \"noteRelatedObjects\".\"noteUuid\" = notes.uuid "
				+ "WHERE \"noteRelatedObjects\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
				+ "ORDER BY notes.\"updatedAt\" DESC";
		this.notesBatcher = new ForeignKeyBatcher<Note>(h, notesBatcherSql, "foreignKeys", new NoteMapper(), "relatedObjectUuid");

		final String noteRelatedObjectsBatcherSql = "/* batch.getNoteRelatedObjects */ SELECT * FROM \"noteRelatedObjects\" "
				+ "WHERE \"noteUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectuuid\" ASC";
		this.noteRelatedObjectsBatcher = new ForeignKeyBatcher<NoteRelatedObject>(h, noteRelatedObjectsBatcherSql, "foreignKeys", new NoteRelatedObjectMapper(), "noteUuid");
	}

	public AnetBeanList<Note> getAll(int pageNum, int pageSize) {
		final String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getAllNotes */ SELECT notes.*, COUNT(*) OVER() AS totalCount "
					+ "FROM notes ORDER BY \"updatedAt\" DESC "
					+ "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else {
			sql = "/* getAllNotes */ SELECT * from notes "
					+ "ORDER BY \"updatedAt\" DESC LIMIT :limit OFFSET :offset";
		}

		final Query query = dbHandle.createQuery(sql)
			.bind("limit", pageSize)
			.bind("offset", pageSize * pageNum);
		return new AnetBeanList<Note>(query, pageNum, pageSize, new NoteMapper(), null);
	}

	public Note getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<Note> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Note insert(Note n) {
		return dbHandle.inTransaction(h -> {
			DaoUtils.setInsertFields(n);
			h.createUpdate(
					"/* insertNote */ INSERT INTO notes (uuid, \"authorUuid\", text, \"createdAt\", \"updatedAt\") "
						+ "VALUES (:uuid, :authorUuid, :text, :createdAt, :updatedAt)")
				.bindBean(n)
				.bind("authorUuid", n.getAuthorUuid())
				.execute();
			insertNoteRelatedObjects(h, DaoUtils.getUuid(n), n.getNoteRelatedObjects());
			return n;
		});
	}

	public int update(Note n) {
		return dbHandle.inTransaction(h -> {
			DaoUtils.setUpdateFields(n);
			deleteNoteRelatedObjects(h, DaoUtils.getUuid(n)); // seems the easiest thing to do
			insertNoteRelatedObjects(h, DaoUtils.getUuid(n), n.getNoteRelatedObjects());
			return h.createUpdate("/* updateNote */ UPDATE notes "
						+ "SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
					.bindBean(n)
					.execute();
		});
	}

	public int delete(String uuid) {
		return dbHandle.inTransaction(h -> {
			deleteNoteRelatedObjects(h, uuid);
			return h.createUpdate("/* deleteNote */ DELETE FROM notes where uuid = :uuid")
				.bind("uuid", uuid)
				.execute();
		});
	}

	public CompletableFuture<List<Note>> getNotesForRelatedObject(@GraphQLRootContext Map<String, Object> context, String relatedObjectUuid) {
		return new ForeignKeyFetcher<Note>()
				.load(context, "noteRelatedObject.notes", relatedObjectUuid);
	}

	public List<List<Note>> getNotes(List<String> foreignKeys) {
		return notesBatcher.getByForeignKeys(foreignKeys);
	}

	public List<List<NoteRelatedObject>> getNoteRelatedObjects(List<String> foreignKeys) {
		return noteRelatedObjectsBatcher.getByForeignKeys(foreignKeys);
	}

	public CompletableFuture<List<NoteRelatedObject>> getRelatedObjects(Map<String, Object> context, Note note) {
		return new ForeignKeyFetcher<NoteRelatedObject>()
				.load(context, "note.noteRelatedObjects", note.getUuid());
	}

	private void insertNoteRelatedObjects(Handle h, String uuid, List<NoteRelatedObject> noteRelatedObjects) {
		for (final NoteRelatedObject nro : noteRelatedObjects) {
			h.createUpdate(
					"/* insertNoteRelatedObject */ INSERT INTO \"noteRelatedObjects\" (\"noteUuid\", \"relatedObjectType\", \"relatedObjectUuid\") "
						+ "VALUES (:noteUuid, :relatedObjectType, :relatedObjectUuid)")
				.bindBean(nro)
				.bind("noteUuid", uuid)
				.execute();
		}
	}

	private void deleteNoteRelatedObjects(Handle h, String uuid) {
		h.execute("/* deleteNoteRelatedObjects */ DELETE FROM \"noteRelatedObjects\" WHERE \"noteUuid\" = ?", uuid);
	}

}
