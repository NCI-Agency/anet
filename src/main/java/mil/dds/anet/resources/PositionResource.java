package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class PositionResource {

  private final AnetObjectEngine engine;
  private final PositionDao dao;

  public PositionResource(AnetObjectEngine anetObjectEngine, PositionDao dao) {
    this.dao = dao;
    this.engine = anetObjectEngine;
  }

  public static boolean hasPermission(final Person user, final String positionUuid) {
    return hasPermission(user,
        ApplicationContextProvider.getEngine().getPositionDao().getByUuid(positionUuid));
  }

  public static boolean hasPermission(final Person user, final Position position) {
    if (position.getType() == PositionType.ADMINISTRATOR) {
      return AuthUtils.isAdmin(user);
    }
    return AuthUtils.canAdministrateOrg(user, position.getOrganizationUuid());
  }

  public void assertPermission(final Person user, final Position position) {
    if (!hasPermission(user, position)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
    }
  }

  @GraphQLQuery(name = "position")
  public Position getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Position p = dao.getByUuid(uuid);
    if (p == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Position not found");
    }
    return p;
  }

  private void validatePosition(Person user, Position pos) {
    if (pos.getName() == null || pos.getName().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Position Name must not be null");
    }
    if (pos.getType() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Position type must be defined");
    }
    // only admins can make superuser positions
    if (!AuthUtils.isAdmin(user) && (pos.getType() == PositionType.SUPERUSER)) {
      final Position existingPos = dao.getByUuid(pos.getUuid());
      if (existingPos.getType() != PositionType.SUPERUSER) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            "You are not allowed to change the position type to SUPERUSER");
      }
    }
  }

  @GraphQLMutation(name = "createPosition")
  public Position createPosition(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "position") Position pos) {
    pos.checkAndFixCustomFields();
    pos.setDescription(
        Utils.isEmptyHtml(pos.getDescription()) ? null : Utils.sanitizeHtml(pos.getDescription()));
    final Person user = DaoUtils.getUserFromContext(context);
    assertPermission(user, pos);
    validatePosition(user, pos);

    final Position created = dao.insert(pos);

    if (pos.getPersonUuid() != null) {
      dao.setPersonInPosition(pos.getPersonUuid(), created.getUuid());
    }

    engine.getEmailAddressDao().updateEmailAddresses(PositionDao.TABLE_NAME, created.getUuid(),
        pos.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, PositionDao.TABLE_NAME, created.getUuid(),
        pos.getCustomSensitiveInformation());

    AnetAuditLogger.log("Position {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateAssociatedPosition")
  public Integer updateAssociatedPosition(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "position") Position pos) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertCanAdministrateOrg(user, pos.getOrganizationUuid());

    final Position current = dao.getByUuid(pos.getUuid());
    if (current == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Position not found");
    }

    // Run the diff and see if anything changed and update.
    if (pos.getAssociatedPositions() != null) {
      Utils.addRemoveElementsByUuid(current.loadAssociatedPositions(engine.getContext()).join(),
          pos.getAssociatedPositions(), newPosition -> {
            dao.associatePosition(DaoUtils.getUuid(newPosition), DaoUtils.getUuid(pos));
          }, oldPosition -> {
            dao.deletePositionAssociation(DaoUtils.getUuid(pos), DaoUtils.getUuid(oldPosition));
          });
      AnetAuditLogger.log("Position {} associations changed to {} by {}", current,
          pos.getAssociatedPositions(), user);
      // GraphQL mutations *have* to return something
      return 1;
    }
    return 0;
  }

  @GraphQLMutation(name = "updatePosition")
  public Integer updatePosition(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "position") Position pos) {
    pos.checkAndFixCustomFields();
    pos.setDescription(
        Utils.isEmptyHtml(pos.getDescription()) ? null : Utils.sanitizeHtml(pos.getDescription()));
    final Person user = DaoUtils.getUserFromContext(context);
    assertPermission(user, pos);
    validatePosition(user, pos);

    final Position existing = dao.getByUuid(pos.getUuid());

    final int numRows = dao.update(pos);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process position update");
    }

    if (AuthUtils.isAdmin(user) && pos.getOrganizationsAdministrated() != null
        && existing != null) {
      Utils.addRemoveElementsByUuid(
          existing.loadOrganizationsAdministrated(engine.getContext()).join(),
          pos.getOrganizationsAdministrated(), newOrg -> dao.addOrganizationToPosition(pos, newOrg),
          oldOrg -> dao.removeOrganizationFromPosition(DaoUtils.getUuid(oldOrg), pos));
    }

    engine.getEmailAddressDao().updateEmailAddresses(PositionDao.TABLE_NAME, pos.getUuid(),
        pos.getEmailAddresses());

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
  public int updatePositionHistory(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "position") Position pos) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position existing = dao.getByUuid(pos.getUuid());
    assertPermission(user, existing);

    ResourceUtils.validateHistoryInput(pos.getUuid(), pos.getPreviousPeople(), false,
        existing.getPersonUuid());

    if (engine.getPersonDao().hasHistoryConflict(pos.getUuid(), null, pos.getPreviousPeople(),
        false)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "At least one of the positions in the history is occupied for the specified period.");
    }

    final int numRows = engine.getPositionDao().updatePositionHistory(pos);
    AnetAuditLogger.log("History updated for position {} by {}", pos, user);
    return numRows;
  }

  @GraphQLMutation(name = "putPersonInPosition")
  public int putPersonInPosition(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String positionUuid,
      @GraphQLArgument(name = "person") Person person) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position pos = dao.getByUuid(positionUuid);
    if (pos == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Position not found");
    }
    AuthUtils.assertCanAdministrateOrg(user, pos.getOrganizationUuid());

    final int numRows = dao.setPersonInPosition(DaoUtils.getUuid(person), positionUuid);
    AnetAuditLogger.log("Person {} put in Position {} by {}", person, pos, user);
    return numRows;
  }

  @GraphQLMutation(name = "deletePersonFromPosition")
  public Integer deletePersonFromPosition(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String positionUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position pos = dao.getByUuid(positionUuid);
    if (pos == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Position not found");
    }
    AuthUtils.assertCanAdministrateOrg(user, pos.getOrganizationUuid());

    final int numRows = dao.removePersonFromPosition(positionUuid);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process delete person from position");
    }
    AnetAuditLogger.log("Person removed from position {} by {}", pos, user);
    return numRows;
  }

  @GraphQLQuery(name = "positionList")
  public CompletableFuture<AnetBeanList<Position>> search(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") PositionSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(context, query);
  }

  @GraphQLMutation(name = "deletePosition")
  public Integer deletePosition(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String positionUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position position = dao.getByUuid(positionUuid);
    if (position == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Position not found");
    }

    // if there is a person in this position, reject
    if (position.getPersonUuid() != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Cannot delete a position that current has a person");
    }

    // if position is active, reject
    if (Position.Status.ACTIVE.equals(position.getStatus())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete an active position");
    }

    AnetAuditLogger.log("Position {} deleted by {}", positionUuid, user);

    // if this position has any history, we'll just delete it
    // if this position is in an approval chain, we just delete it
    // if this position is in an organization, just remove it
    // if this position has any associated positions, just remove them
    return dao.delete(positionUuid);
  }

  @GraphQLMutation(name = "mergePositions")
  public Integer mergePositions(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "winnerPosition") Position winnerPosition,
      @GraphQLArgument(name = "loserUuid") String loserUuid) throws ResponseStatusException {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position loserPosition = dao.getByUuid(loserUuid);
    AuthUtils.assertAdministrator(user);

    if (winnerPosition.getOrganizationUuid() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "A Position must belong to an organization");
    }

    final String winnerPersonUuid = DaoUtils.getUuid(winnerPosition.getPerson());
    ResourceUtils.validateHistoryInput(winnerPosition.getUuid(), winnerPosition.getPreviousPeople(),
        false, winnerPersonUuid);

    // Check that given two position can be merged
    arePositionsMergeable(winnerPosition, loserPosition);
    if (ApplicationContextProvider.getEngine().getPersonDao().hasHistoryConflict(
        winnerPosition.getUuid(), loserUuid, winnerPosition.getPreviousPeople(), false)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "At least one of the people in the history is occupied for the specified period.");
    }
    validatePosition(user, winnerPosition);

    int numRows = dao.mergePositions(winnerPosition, loserPosition);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process merge operation, error occurred while updating merged position relation information.");
    }
    AnetAuditLogger.log("Position {} merged into {} by {}", loserPosition, winnerPosition, user);
    return numRows;
  }

  private void arePositionsMergeable(Position winnerPos, Position loserPos) {
    if (loserPos.getUuid().equals(winnerPos.getUuid())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Cannot merge identical positions.");
    }

    if (Objects.nonNull(loserPos.getPersonUuid()) && Objects.nonNull(winnerPos.getPersonUuid())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Cannot merge positions when both have assigned person.");
    }

    if (!loserPos.getOrganizationUuid().equals(winnerPos.getOrganizationUuid())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Cannot merge positions from different organizations.");
    }

    if (Objects.nonNull(loserPos.getPersonUuid()) && Objects.isNull(winnerPos.getPersonUuid())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "If There is a person assigned to one of the combined Positions, "
              + "This person must be in the position which is merged");
    }
  }

}
