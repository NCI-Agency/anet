package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.NoteDao.UpdateType;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class NoteResource {

  private final NoteDao dao;

  public NoteResource(NoteDao dao) {
    this.dao = dao;
  }

  @GraphQLMutation(name = "createNote")
  public Note createNote(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "note") Note n) {
    final Person user = DaoUtils.getUserFromContext(context);
    n.setAuthorUuid(DaoUtils.getUuid(user));
    checkNotePermission(user, n.getAuthorUuid(), UpdateType.CREATE);
    ResourceUtils.checkAndFixNote(n);
    n = dao.insert(n);
    AnetAuditLogger.log("Note {} created by {}", n, user);
    return n;
  }

  private void checkNotePermission(final Person user, final String authorUuid,
      final UpdateType updateType) {
    if (!dao.hasNotePermission(user, authorUuid, updateType)) {
      // Don't provide too much information, just say it is "denied"
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied");
    }
  }

  @GraphQLMutation(name = "updateNote")
  public Note updateNote(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "note") Note n) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Note original = dao.getByUuid(DaoUtils.getUuid(n));
    if (original == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found");
    }
    checkNotePermission(user, original.getAuthorUuid(), UpdateType.UPDATE);
    DaoUtils.assertObjectIsFresh(n, original);

    ResourceUtils.checkAndFixNote(n);
    final int numRows = dao.update(n);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process note update");
    }
    AnetAuditLogger.log("Note {} updated by {}", n, user);
    // Return the updated note since we want to use the updatedAt field
    return n;
  }

  @GraphQLMutation(name = "deleteNote")
  public Integer deleteNote(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String noteUuid) {
    final Note n = dao.getByUuid(noteUuid);
    if (n == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found");
    }
    final Person user = DaoUtils.getUserFromContext(context);
    checkNotePermission(user, n.getAuthorUuid(), UpdateType.DELETE);
    final int numRows = dao.delete(noteUuid);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process note delete");
    }
    AnetAuditLogger.log("Note {} deleted by {}", n, user);
    // GraphQL mutations *have* to return something, so we return the number of
    // deleted rows
    return numRows;
  }

}
