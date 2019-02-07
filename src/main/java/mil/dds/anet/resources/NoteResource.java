package mil.dds.anet.resources;

import java.util.Map;

import javax.annotation.security.PermitAll;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Note;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

@PermitAll
public class NoteResource {

	private NoteDao dao;

	public NoteResource(AnetObjectEngine engine) {
		this.dao = engine.getNoteDao();
	}

	@GraphQLMutation(name="createNote")
	public Note createNote(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="note") Note n) {
		checkText(n);
		checkNoteRelatedObjects(n);
		final Person user = DaoUtils.getUserFromContext(context);
		n.setAuthorUuid(DaoUtils.getUuid(user));
		n = dao.insert(n);
		AnetAuditLogger.log("Note {} created by {}", n, user);
		return n;
	}

	@GraphQLMutation(name="updateNote")
	public Note updateNote(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="note") Note n) {
		final Person user = DaoUtils.getUserFromContext(context);
		checkPermission(n, user);
		checkText(n);
		checkNoteRelatedObjects(n);
		final int numRows = dao.update(n);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process note update", Status.NOT_FOUND);
		}
		AnetAuditLogger.log("Note {} updated by {}", n, user);
		// Return the updated note since we want to use the updatedAt field
		return n;
	}

	@GraphQLMutation(name="deleteNote")
	public Integer deleteNote(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="uuid") String noteUuid) {
		final Note n = dao.getByUuid(noteUuid);
		if (n == null) {
			throw new WebApplicationException("Note not found", Status.NOT_FOUND);
		}
		final Person user = DaoUtils.getUserFromContext(context);
		checkPermission(n, user);
		final int numRows = dao.delete(noteUuid);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process note delete", Status.NOT_FOUND);
		}
		AnetAuditLogger.log("Note {} deleted by {}", n, user);
		// GraphQL mutations *have* to return something, so we return the number of deleted rows
		return numRows;
	}

	private void checkPermission(Note n, final Person user) {
		if (!n.getAuthorUuid().equals(DaoUtils.getUuid(user)) && !AuthUtils.isAdmin(user)) {
			throw new WebApplicationException("Only the author or an admin can do this", Status.FORBIDDEN);
		}
	}

	private void checkText(Note n) {
		if (n.getText() == null || n.getText().trim().length() == 0) {
			throw new WebApplicationException("Note text must not be empty", Status.BAD_REQUEST);
		}
	}

	private void checkNoteRelatedObjects(Note n) {
		if (Utils.isEmptyOrNull(n.getNoteRelatedObjects())) {
			throw new WebApplicationException("Note must have related objects", Status.BAD_REQUEST);
		}
	}

}
