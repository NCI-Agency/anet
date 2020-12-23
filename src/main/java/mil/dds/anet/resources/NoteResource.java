package mil.dds.anet.resources;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Note.NoteType;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class NoteResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AnetObjectEngine engine;
  private final NoteDao dao;
  private final PositionDao positionDao;

  public NoteResource(AnetObjectEngine engine) {
    this.engine = engine;
    this.dao = engine.getNoteDao();
    this.positionDao = engine.getPositionDao();
  }

  @GraphQLMutation(name = "createNote")
  public Note createNote(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "note") Note n) {
    checkAndFixText(n);
    checkNoteRelatedObjects(n);
    final Person user = DaoUtils.getUserFromContext(context);
    n.setAuthorUuid(DaoUtils.getUuid(user));
    n = dao.insert(n);
    AnetAuditLogger.log("Note {} created by {}", n, user);
    return n;
  }

  @GraphQLMutation(name = "updateNote")
  public Note updateNote(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "note") Note n) {
    final Person user = DaoUtils.getUserFromContext(context);
    checkPermission(n, user);
    checkAndFixText(n);
    checkNoteRelatedObjects(n);
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
    checkPermission(n, user);
    final int numRows = dao.delete(noteUuid);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process note delete", Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Note {} deleted by {}", n, user);
    // GraphQL mutations *have* to return something, so we return the number of
    // deleted rows
    return numRows;
  }

  private void checkPermission(final Note note, final Person user) {
    if (AuthUtils.isAdmin(user)) {
      // Admin can edit any note
      return;
    }

    if (note.getType() != NoteType.ASSESSMENT) {
      if (note.getAuthorUuid().equals(DaoUtils.getUuid(user))) {
        // Authors can edit their non-assessment notes
        return;
      }
      throw new WebApplicationException("Only the author or an admin can do this",
          Status.FORBIDDEN);
    }

    // Assessments have special restrictions
    Set<String> responsibleTasksUuids = null;
    Set<String> associatedPositionsUuids = null;
    for (final NoteRelatedObject nro : note.loadNoteRelatedObjects(engine.getContext()).join()) {
      if (TaskDao.TABLE_NAME.equals(nro.getRelatedObjectType())) {
        responsibleTasksUuids = lazyLoadResponsibleTasks(responsibleTasksUuids, user);
        if (responsibleTasksUuids.contains(nro.getRelatedObjectUuid())) {
          // This task is among the user's responsible tasks
          return;
        }
      } else if (PersonDao.TABLE_NAME.equals(nro.getRelatedObjectType())) {
        associatedPositionsUuids = lazyLoadAssociatedPositions(associatedPositionsUuids, user);
        final Position position = positionDao
            .getCurrentPositionForPerson(engine.getContext(), nro.getRelatedObjectUuid()).join();
        if (associatedPositionsUuids.contains(DaoUtils.getUuid(position))) {
          // This position is among the associated positions of the user
          return;
        }
      }
    }
    throw new WebApplicationException("You do not have permissions to edit this assessment",
        Status.FORBIDDEN);
  }

  private Set<String> lazyLoadResponsibleTasks(final Set<String> responsibleTasksUuids,
      final Person user) {
    if (responsibleTasksUuids != null) {
      // Already loaded
      return responsibleTasksUuids;
    }
    // Load
    final TaskSearchQuery tsq = new TaskSearchQuery();
    tsq.setStatus(Task.Status.ACTIVE);
    final List<Task> responsibleTasks =
        user.loadPosition().loadResponsibleTasks(engine.getContext(), tsq).join();
    return responsibleTasks.stream().map(rp -> rp.getUuid()).collect(Collectors.toSet());
  }

  private Set<String> lazyLoadAssociatedPositions(final Set<String> associatedPositionsUuids,
      final Person user) {
    if (associatedPositionsUuids != null) {
      // Already loaded
      return associatedPositionsUuids;
    }
    // Load
    final List<Position> associatedPositions =
        user.loadPosition().loadAssociatedPositions(engine.getContext()).join();
    return associatedPositions.stream().map(ap -> ap.getUuid()).collect(Collectors.toSet());
  }

  private void checkAndFixText(Note n) {
    if (n.getText() == null || n.getText().trim().length() == 0) {
      throw new WebApplicationException("Note text must not be empty", Status.BAD_REQUEST);
    }
    sanitizeText(n);
  }

  private void sanitizeText(Note n) {
    if (NoteType.FREE_TEXT.equals(n.getType())) {
      n.setText(Utils.isEmptyHtml(n.getText()) ? null : Utils.sanitizeHtml(n.getText()));
    } else {
      try {
        n.setText(Utils.sanitizeJson(n.getText()));
      } catch (JsonProcessingException e) {
        n.setText(null);
        logger.error("Unable to process Json, payload discarded", e);
      }
    }
  }

  private void checkNoteRelatedObjects(Note n) {
    if (Utils.isEmptyOrNull(n.getNoteRelatedObjects())) {
      throw new WebApplicationException("Note must have related objects", Status.BAD_REQUEST);
    }
  }

}
