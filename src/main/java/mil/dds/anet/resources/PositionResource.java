package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.Utils;

public class PositionResource {

  private final PositionDao dao;
  private final AnetObjectEngine engine;

  public PositionResource(AnetObjectEngine engine) {
    this.engine = engine;
    this.dao = engine.getPositionDao();
  }

  @GraphQLQuery(name = "position")
  public Position getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Position p = dao.getByUuid(uuid);
    if (p == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }
    return p;
  }

  private void validatePosition(Person user, Position pos) {
    if (pos.getName() == null || pos.getName().trim().length() == 0) {
      throw new WebApplicationException("Position Name must not be null", Status.BAD_REQUEST);
    }
    if (pos.getType() == null) {
      throw new WebApplicationException("Position type must be defined", Status.BAD_REQUEST);
    }
    // only admins can make superuser positions
    if (!AuthUtils.isAdmin(user) && (pos.getType() == PositionType.SUPERUSER)) {
      final Position existingPos = dao.getByUuid(pos.getUuid());
      if (existingPos.getType() != PositionType.SUPERUSER) {
        throw new WebApplicationException(
            "You are not allowed to change the position type to SUPERUSER", Status.FORBIDDEN);
      }
    }
  }

  private void assertCanUpdatePosition(Person user, Position pos) {
    if (pos.getType() == PositionType.ADMINISTRATOR) {
      AuthUtils.assertAdministrator(user);
    }
    if (pos.getOrganizationUuid() == null) {
      throw new WebApplicationException("A Position must belong to an organization",
          Status.BAD_REQUEST);
    }
    AuthUtils.assertCanAdministrateOrg(user, pos.getOrganizationUuid());
  }

  @GraphQLMutation(name = "createPosition")
  public Position createPosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "position") Position pos) {
    pos.checkAndFixCustomFields();
    final Person user = DaoUtils.getUserFromContext(context);
    assertCanUpdatePosition(user, pos);
    validatePosition(user, pos);

    final Position created = dao.insert(pos);

    if (pos.getPersonUuid() != null) {
      dao.setPersonInPosition(pos.getPersonUuid(), created.getUuid());
    }

    DaoUtils.saveCustomSensitiveInformation(user, PositionDao.TABLE_NAME, created.getUuid(),
        pos.getCustomSensitiveInformation());

    AnetAuditLogger.log("Position {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateAssociatedPosition")
  public Integer updateAssociatedPosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "position") Position pos) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertCanAdministrateOrg(user, pos.getOrganizationUuid());

    final Position current = dao.getByUuid(pos.getUuid());
    if (current == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }

    // Run the diff and see if anything changed and update.
    if (pos.getAssociatedPositions() != null) {
      Utils.addRemoveElementsByUuid(current.loadAssociatedPositions(engine.getContext()).join(),
          pos.getAssociatedPositions(), newPosition -> {
            dao.associatePosition(DaoUtils.getUuid(newPosition), DaoUtils.getUuid(pos));
          }, oldPositionUuid -> {
            dao.deletePositionAssociation(DaoUtils.getUuid(pos), oldPositionUuid);
          });
      AnetAuditLogger.log("Position {} associations changed to {} by {}", current,
          pos.getAssociatedPositions(), user);
      // GraphQL mutations *have* to return something
      return 1;
    }
    return 0;
  }

  @GraphQLMutation(name = "updatePosition")
  public Integer updatePosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "position") Position pos) {
    pos.checkAndFixCustomFields();
    final Person user = DaoUtils.getUserFromContext(context);
    assertCanUpdatePosition(user, pos);
    validatePosition(user, pos);

    final Position existing = dao.getByUuid(pos.getUuid());

    final int numRows = dao.update(pos);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process position update", Status.NOT_FOUND);
    }

    if (AuthUtils.isAdmin(user) && pos.getOrganizationsAdministrated() != null
        && existing != null) {
      Utils.addRemoveElementsByUuid(
          existing.loadOrganizationsAdministrated(engine.getContext()).join(),
          pos.getOrganizationsAdministrated(), newOrg -> dao.addOrganizationToPosition(pos, newOrg),
          oldOrgUuid -> dao.removeOrganizationFromPosition(oldOrgUuid, pos));
    }

    DaoUtils.saveCustomSensitiveInformation(user, PositionDao.TABLE_NAME, pos.getUuid(),
        pos.getCustomSensitiveInformation());

    if (pos.getPersonUuid() != null || Position.Status.INACTIVE.equals(pos.getStatus())) {
      if (existing != null) {
        // Run the diff and see if anything changed and update.
        if (pos.getPerson() != null) {
          if (pos.getPersonUuid() == null) {
            // Intentionally remove the person
            dao.removePersonFromPosition(existing.getUuid());
            AnetAuditLogger.log("Person {} removed from position {} by {}", pos.getPersonUuid(),
                existing, user);
          } else if (!Objects.equals(pos.getPersonUuid(), existing.getPersonUuid())) {
            dao.setPersonInPosition(pos.getPersonUuid(), pos.getUuid());
            AnetAuditLogger.log("Person {} put in position {} by {}", pos.getPersonUuid(), existing,
                user);
          }
        }

        if (Position.Status.INACTIVE.equals(pos.getStatus()) && existing.getPersonUuid() != null) {
          // Remove this person from this position.
          AnetAuditLogger.log(
              "Person {} removed from position {} by {} because the position is now inactive",
              existing.getPersonUuid(), existing, user);
          dao.removePersonFromPosition(existing.getUuid());
        }
      }
    }

    AnetAuditLogger.log("Position {} updated by {}", pos, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLMutation(name = "updatePositionHistory")
  public int updatePositionHistory(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "position") Position pos) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position existing = dao.getByUuid(pos.getUuid());
    assertCanUpdatePosition(user, existing);

    ResourceUtils.validateHistoryInput(pos.getUuid(), pos.getPreviousPeople(), false,
        existing.getPersonUuid());

    if (AnetObjectEngine.getInstance().getPersonDao().hasHistoryConflict(pos.getUuid(), null,
        pos.getPreviousPeople(), false)) {
      throw new WebApplicationException(
          "At least one of the positions in the history is occupied for the specified period.",
          Status.CONFLICT);
    }

    final int numRows = AnetObjectEngine.getInstance().getPositionDao().updatePositionHistory(pos);
    AnetAuditLogger.log("History updated for position {} by {}", pos, user);
    return numRows;
  }

  @GraphQLMutation(name = "putPersonInPosition")
  public int putPersonInPosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String positionUuid,
      @GraphQLArgument(name = "person") Person person) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position pos = dao.getByUuid(positionUuid);
    if (pos == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }
    AuthUtils.assertCanAdministrateOrg(user, pos.getOrganizationUuid());

    final int numRows = dao.setPersonInPosition(DaoUtils.getUuid(person), positionUuid);
    AnetAuditLogger.log("Person {} put in Position {} by {}", person, pos, user);
    return numRows;
  }

  @GraphQLMutation(name = "deletePersonFromPosition")
  public Integer deletePersonFromPosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String positionUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position pos = dao.getByUuid(positionUuid);
    if (pos == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }
    AuthUtils.assertCanAdministrateOrg(user, pos.getOrganizationUuid());

    final int numRows = dao.removePersonFromPosition(positionUuid);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process delete person from position",
          Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Person removed from position {} by {}", pos, user);
    return numRows;
  }

  @GraphQLQuery(name = "positionList")
  public CompletableFuture<AnetBeanList<Position>> search(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") PositionSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(context, query);
  }

  @GraphQLMutation(name = "deletePosition")
  public Integer deletePosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String positionUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position position = dao.getByUuid(positionUuid);
    if (position == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }

    // if there is a person in this position, reject
    if (position.getPersonUuid() != null) {
      throw new WebApplicationException("Cannot delete a position that current has a person",
          Status.BAD_REQUEST);
    }

    // if position is active, reject
    if (Position.Status.ACTIVE.equals(position.getStatus())) {
      throw new WebApplicationException("Cannot delete an active position", Status.BAD_REQUEST);
    }

    AnetAuditLogger.log("Position {} deleted by {}", positionUuid, user);

    // if this position has any history, we'll just delete it
    // if this position is in an approval chain, we just delete it
    // if this position is in an organization, just remove it
    // if this position has any associated positions, just remove them
    return dao.delete(positionUuid);
  }

  @GraphQLMutation(name = "mergePositions")
  public Integer mergePositions(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "winnerPosition") Position winnerPosition,
      @GraphQLArgument(name = "loserUuid") String loserUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position loserPosition = dao.getByUuid(loserUuid);
    AuthUtils.assertAdministrator(user);

    if (winnerPosition.getOrganizationUuid() == null) {
      throw new WebApplicationException("A Position must belong to an organization",
          Status.BAD_REQUEST);
    }

    final String winnerPersonUuid = DaoUtils.getUuid(winnerPosition.getPerson());
    ResourceUtils.validateHistoryInput(winnerPosition.getUuid(), winnerPosition.getPreviousPeople(),
        false, winnerPersonUuid);

    // Check that given two position can be merged
    arePositionsMergeable(winnerPosition, loserPosition);
    if (AnetObjectEngine.getInstance().getPersonDao().hasHistoryConflict(winnerPosition.getUuid(),
        loserUuid, winnerPosition.getPreviousPeople(), false)) {
      throw new WebApplicationException(
          "At least one of the people in the history is occupied for the specified period.",
          Status.CONFLICT);
    }
    validatePosition(user, winnerPosition);

    int numRows = dao.mergePositions(winnerPosition, loserPosition);
    if (numRows == 0) {
      throw new WebApplicationException(
          "Couldn't process merge operation, error occurred while updating merged position relation information.",
          Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Position {} merged into {} by {}", loserPosition, winnerPosition, user);
    return numRows;
  }

  private void arePositionsMergeable(Position winnerPos, Position loserPos) {
    if (loserPos.getUuid().equals(winnerPos.getUuid())) {
      throw new WebApplicationException("Cannot merge identical positions.", Status.BAD_REQUEST);
    }

    if (Objects.nonNull(loserPos.getPersonUuid()) && Objects.nonNull(winnerPos.getPersonUuid())) {
      throw new WebApplicationException("Cannot merge positions when both have assigned person.",
          Status.BAD_REQUEST);
    }

    if (!loserPos.getOrganizationUuid().equals(winnerPos.getOrganizationUuid())) {
      throw new WebApplicationException("Cannot merge positions from different organizations.",
          Status.BAD_REQUEST);
    }

    if (Objects.nonNull(loserPos.getPersonUuid()) && Objects.isNull(winnerPos.getPersonUuid())) {
      throw new WebApplicationException(
          "If There is a person assigned to one of the combined Positions, "
              + "This person must be in the position which is merged",
          Status.BAD_REQUEST);
    }
  }

}
