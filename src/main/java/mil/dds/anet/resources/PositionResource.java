package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class PositionResource {

  private final AnetObjectEngine engine;
  private final AuditTrailDao auditTrailDao;
  private final PositionDao dao;
  private final EmailAddressDao emailAddressDao;
  private final PersonDao personDao;

  public PositionResource(AnetObjectEngine anetObjectEngine, AuditTrailDao auditTrailDao,
      PositionDao dao, EmailAddressDao emailAddressDao, PersonDao personDao, PersonDao personDao1) {
    this.auditTrailDao = auditTrailDao;
    this.dao = dao;
    this.engine = anetObjectEngine;
    this.emailAddressDao = emailAddressDao;
    this.personDao = personDao1;
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

    emailAddressDao.updateEmailAddresses(PositionDao.TABLE_NAME, created.getUuid(),
        pos.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, PositionDao.TABLE_NAME, created.getUuid(),
        pos.customSensitiveInformationKey(), pos.getCustomSensitiveInformation());

    // Log the change
    auditTrailDao.logCreate(user, PositionDao.TABLE_NAME, created);
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
      current.loadAssociatedPositions(engine.getContext()).join();
      Utils.addRemoveElementsByUuid(current.loadAssociatedPositions(engine.getContext()).join(),
          pos.getAssociatedPositions(), newPosition -> {
            dao.associatePosition(DaoUtils.getUuid(newPosition), DaoUtils.getUuid(pos));
          }, oldPosition -> {
            dao.deletePositionAssociation(DaoUtils.getUuid(pos), DaoUtils.getUuid(oldPosition));
          });
      // Log the change
      final Instant now = Instant.now();
      final String auditTrailUuid = auditTrailDao.logUpdate(user, now, PositionDao.TABLE_NAME, pos,
          "positions associations have been changed", String.format("from %s to %s",
              current.getAssociatedPositions(), pos.getAssociatedPositions()));
      // Update any subscriptions
      pos.setUpdatedAt(now);
      dao.updateSubscriptions(pos, auditTrailUuid, false);

      // GraphQL mutations *have* to return something
      return 1;
    }
    return 0;
  }

  @GraphQLMutation(name = "updatePosition")
  public Integer updatePosition(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "position") Position pos,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    pos.checkAndFixCustomFields();
    pos.setDescription(
        Utils.isEmptyHtml(pos.getDescription()) ? null : Utils.sanitizeHtml(pos.getDescription()));

    final Person user = DaoUtils.getUserFromContext(context);
    final Position existing = dao.getByUuid(pos.getUuid());
    assertPermission(user, pos);
    DaoUtils.assertObjectIsFresh(pos, existing, force);

    validatePosition(user, pos);

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

    emailAddressDao.updateEmailAddresses(PositionDao.TABLE_NAME, pos.getUuid(),
        pos.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, PositionDao.TABLE_NAME, pos.getUuid(),
        pos.customSensitiveInformationKey(), pos.getCustomSensitiveInformation());

    // Automatically remove people from a position if the position is inactive.
    if (WithStatus.Status.INACTIVE.equals(pos.getStatus()) && existing != null
        && existing.getPersonUuid() != null) {
      final Person existingPerson = existing.loadPerson(engine.getContext()).join();
      // Remove this person from this position.
      dao.removePersonFromPosition(existing);
      // Log the change
      final String auditTrailUuid = auditTrailDao.logUpdate(user, PositionDao.TABLE_NAME, existing,
          "person has been removed from this position because the position is now inactive",
          String.format("from person %s", existingPerson));
      // Update any subscriptions
      dao.updateSubscriptions(existing, auditTrailUuid, false);
      existingPerson.setUpdatedAt(existing.getUpdatedAt());
      personDao.updateSubscriptions(existingPerson, auditTrailUuid, false);
    }

    // Log the change
    final String auditTrailUuid = auditTrailDao.logUpdate(user, PositionDao.TABLE_NAME, pos);
    // Update any subscriptions
    dao.updateSubscriptions(pos, auditTrailUuid, false);

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

    existing.loadPreviousPeople(engine.getContext()).join();
    final int numRows = dao.updatePositionHistory(pos);

    // Log the change
    final Instant now = Instant.now();
    final String auditTrailUuid = auditTrailDao.logUpdate(user, now, PositionDao.TABLE_NAME,
        existing, "position history has been updated",
        String.format("from %s to %s", existing.getPreviousPeople(), pos.getPreviousPeople()));
    // Update any subscriptions
    pos.setUpdatedAt(now);
    dao.updateSubscriptions(pos, auditTrailUuid, false);

    return numRows;
  }

  @GraphQLMutation(name = "putPersonInPosition")
  public int putPersonInPosition(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String positionUuid,
      @GraphQLArgument(name = "person") Person person,
      @GraphQLArgument(name = "primary", defaultValue = "true") boolean primary,
      @GraphQLArgument(name = "previousPositionUuid") String previousPositionUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position pos = dao.getByUuid(positionUuid);
    if (pos == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Position not found");
    }
    AuthUtils.assertCanAdministrateOrg(user, pos.getOrganizationUuid());

    final int numRows = dao.setPersonInPosition(DaoUtils.getUuid(person), positionUuid, primary,
        previousPositionUuid);

    // Log the change
    final Instant now = Instant.now();
    final String auditTrailUuid = auditTrailDao.logUpdate(user, now, PositionDao.TABLE_NAME, pos,
        String.format("person has been assigned this %s position",
            primary ? "primary" : "additional"),
        String.format("to person %s", person));
    // Update any subscriptions
    pos.setUpdatedAt(now);
    dao.updateSubscriptions(pos, auditTrailUuid, false);
    person.setUpdatedAt(now);
    personDao.updateSubscriptions(person, auditTrailUuid, false);

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

    final Person person = pos.loadPerson(engine.getContext()).join();
    final int numRows = dao.removePersonFromPosition(pos);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process delete person from position");
    }

    // Log the change
    final String auditTrailUuid = auditTrailDao.logUpdate(user, PositionDao.TABLE_NAME, pos,
        "person has been removed from this position",
        String.format("from person %s", pos.getPersonUuid()));
    // Update any subscriptions
    dao.updateSubscriptions(pos, auditTrailUuid, false);
    person.setUpdatedAt(pos.getUpdatedAt());
    personDao.updateSubscriptions(person, auditTrailUuid, false);

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
    if (WithStatus.Status.ACTIVE.equals(position.getStatus())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete an active position");
    }

    // if this position has any history, we'll just delete it
    // if this position is in an approval chain, we just delete it
    // if this position is in an organization, just remove it
    // if this position has any associated positions, just remove them
    final int numRows = dao.delete(positionUuid);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process position delete");
    }

    // Log the change
    final String auditTrailUuid = auditTrailDao.logDelete(user, PositionDao.TABLE_NAME, position);
    // Update any subscriptions
    dao.updateSubscriptions(position, auditTrailUuid, true);

    return numRows;
  }

  @GraphQLMutation(name = "mergePositions")
  public Integer mergePositions(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "winnerPosition") Position winnerPosition,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "useWinnerPersonHistory",
          defaultValue = "true") boolean useWinnerPersonHistory)
      throws ResponseStatusException {
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
    validatePosition(user, winnerPosition);

    int numRows = dao.mergePositions(winnerPosition, loserPosition, useWinnerPersonHistory);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process merge operation, error occurred while updating merged position relation information.");
    }

    // Log the change
    final String auditTrailUuid = auditTrailDao.logUpdate(user, PositionDao.TABLE_NAME,
        winnerPosition, "a position has been merged into it",
        String.format("merged position %s", loserPosition));
    // Update any subscriptions
    dao.updateSubscriptions(winnerPosition, auditTrailUuid, false);

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
