package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response.Status;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.NoteDao.UpdateType;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;

public class NoteResource {

  private final NoteDao dao;

  public NoteResource(AnetObjectEngine engine) {
    this.dao = engine.getNoteDao();
  }

  @GraphQLMutation(name = "createNote")
  public Note createNote(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "note") Note n) {
    final Person user = DaoUtils.getUserFromContext(context);
    n.setAuthorUuid(DaoUtils.getUuid(user));
    checkNotePermission(user, n, n.getAuthorUuid(), UpdateType.CREATE);
    ResourceUtils.checkAndFixNote(n);
    n = dao.insert(n);
    AnetAuditLogger.log("Note {} created by {}", n, user);
    return n;
  }

  private void checkNotePermission(final Person user, final Note note, final String authorUuid,
      final UpdateType updateType) {
    if (!dao.hasNotePermission(user, DaoUtils.getAuthorizationGroupUuids(user), note, authorUuid,
        updateType)) {
      // Don't provide too much information, just say it is "denied"
      throw new WebApplicationException("Permission denied", Status.FORBIDDEN);
    }
  }

  @GraphQLMutation(name = "updateNote")
  public Note updateNote(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "note") Note n) {
    final Note original = dao.getByUuid(DaoUtils.getUuid(n));
    if (original == null) {
      throw new WebApplicationException("Note not found", Status.NOT_FOUND);
    }
    final Person user = DaoUtils.getUserFromContext(context);
    checkNotePermission(user, n, original.getAuthorUuid(), UpdateType.UPDATE);
    ResourceUtils.checkAndFixNote(n);
    final int numRows = dao.update(n);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process note update", Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Note {} updated by {}", n, user);
    // Return the updated note since we want to use the updatedAt field
    return n;
  }

  @GraphQLMutation(name = "deleteNote")
  public Integer deleteNote(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String noteUuid) {
    final Note n = dao.getByUuid(noteUuid);
    if (n == null) {
      throw new WebApplicationException("Note not found", Status.NOT_FOUND);
    }
    final Person user = DaoUtils.getUserFromContext(context);
    checkNotePermission(user, n, n.getAuthorUuid(), UpdateType.DELETE);
    final int numRows = dao.delete(noteUuid);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process note delete", Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Note {} deleted by {}", n, user);
    // GraphQL mutations *have* to return something, so we return the number of
    // deleted rows
    return numRows;
  }

}
