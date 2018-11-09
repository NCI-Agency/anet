package mil.dds.anet.database;

import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;

import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.NoteMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;

@RegisterRowMapper(NoteMapper.class)
public class NoteDao implements IAnetDao<Note> {

	private final Handle dbHandle;
	private final IdBatcher<Note> idBatcher;
	private final ForeignKeyBatcher<Note> notesBatcher;

	public NoteDao(Handle h) {
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getNotesByUuids */ SELECT * FROM notes WHERE uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Note>(h, idBatcherSql, "uuids", new NoteMapper());

		final String notesBatcherSql = "/* batch.getNotesForRelatedObject */ SELECT * FROM \"notesRelatedObjects\" "
				+ "INNER JOIN notes ON \"notesRelatedObjects\".\"noteUuid\" = notes.uuid "
				+ "WHERE \"notesRelatedObjects\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
				+ "ORDER BY notes.\"updatedAt\" DESC";
		this.notesBatcher = new ForeignKeyBatcher<Note>(h, notesBatcherSql, "foreignKeys", new NoteMapper(), "relatedObjectUuid");
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
		return dbHandle.createQuery("/* getNoteByUuid */ SELECT * FROM notes WHERE uuid = :uuid")
			.bind("uuid", uuid)
			.map(new NoteMapper())
			.findFirst().orElse(null);
	}

	@Override
	public List<Note> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Note insert(Note n) {
		DaoUtils.setInsertFields(n);
		dbHandle.createUpdate(
				"/* tagInsert */ INSERT INTO notes (uuid, authorUuid, text, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :authorUuid, :text, :createdAt, :updatedAt)")
			.bindBean(n)
			.bind("authorUuid", DaoUtils.getUuid(n.getAuthor()))
			.execute();
		return n;
	}

	public int update(Note n) {
		DaoUtils.setUpdateFields(n);
		return dbHandle.createUpdate("/* updateNote */ UPDATE notes "
					+ "SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindBean(n)
				.execute();
	}

	public CompletableFuture<List<Note>> getNotesForRelatedObject(@GraphQLRootContext Map<String, Object> context, String relatedObjectUuid) {
		return new ForeignKeyFetcher<Note>()
				.load(context, "relatedObject.notes", relatedObjectUuid);
	}

	public List<List<Note>> getNotes(List<String> foreignKeys) {
		return notesBatcher.getByForeignKeys(foreignKeys);
	}

}
