package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLEnvironment;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.execution.ResolutionEnvironment;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class PersonResource {

  private static final String DUPLICATE_PERSON_DOMAINUSERNAME =
      "Another person is already using this domainUsername.";

  private final AnetDictionary dict;
  private final AnetObjectEngine engine;
  private final PersonDao dao;

  public PersonResource(AnetDictionary dict, AnetObjectEngine anetObjectEngine, PersonDao dao) {
    this.dict = dict;
    this.engine = anetObjectEngine;
    this.dao = dao;
  }

  public static boolean hasPermission(final Person user, final String personUuid) {
    return hasPermission(user,
        ApplicationContextProvider.getEngine().getPersonDao().getByUuid(personUuid));
  }

  public static boolean hasPermission(final Person user, final Person person) {
    return canCreateOrUpdatePerson(user, person, false);
  }

  /**
   * Returns a single person entry based on UUID.
   */
  @GraphQLQuery(name = "person")
  public Person getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Person p = dao.getByUuid(uuid);
    if (p == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found");
    }
    return p;
  }

  @GraphQLMutation(name = "createPerson")
  public Person createPerson(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "person") Person p) {
    p.checkAndFixCustomFields();
    final Person user = DaoUtils.getUserFromContext(context);
    if (!canCreateOrUpdatePerson(user, p, true)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "You do not have permissions to create this person");
    }

    final String positionUuid = DaoUtils.getUuid(p.getPosition());
    if (positionUuid != null && engine.getPositionDao().getByUuid(positionUuid) == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Position " + p.getPosition() + " does not exist");
    }

    // Only admins can set user/domainUsername
    if (!AuthUtils.isAdmin(user)) {
      p.setUser(false);
      p.setDomainUsername(null);
    }

    if (Boolean.TRUE.equals(p.getUser()) && !Utils.isEmptyOrNull(p.getEmailAddresses())) {
      validateEmail(p.getEmailAddresses());
    }

    p.setBiography(
        Utils.isEmptyHtml(p.getBiography()) ? null : Utils.sanitizeHtml(p.getBiography()));
    Person created;
    try {
      created = dao.insert(p);
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, DUPLICATE_PERSON_DOMAINUSERNAME);
    }

    if (DaoUtils.getUuid(created.getPosition()) != null) {
      engine.getPositionDao().setPersonInPosition(created.getUuid(),
          DaoUtils.getUuid(created.getPosition()));
    }

    engine.getEmailAddressDao().updateEmailAddresses(PersonDao.TABLE_NAME, created.getUuid(),
        p.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, PersonDao.TABLE_NAME, created.getUuid(),
        p.getCustomSensitiveInformation());

    AnetAuditLogger.log("Person {} created by {}", created, user);
    return created;
  }

  private static boolean canCreateOrUpdatePerson(Person editor, Person subject, boolean create) {
    if (editor.getUuid().equals(subject.getUuid())) {
      return true;
    }
    final Position editorPos = editor.getPosition();
    if (editorPos == null) {
      return false;
    }
    if (editorPos.getType() == PositionType.ADMINISTRATOR) {
      return true;
    }
    if (editorPos.getType() == PositionType.SUPERUSER) {
      // Ensure that the editor is the superuser for the subject's organization.
      final Position subjectPos;
      subjectPos =
          create
              ? ApplicationContextProvider.getEngine().getPositionDao()
                  .getByUuid(DaoUtils.getUuid(subject.getPosition()))
              : DaoUtils.getPosition(subject);
      if (subjectPos == null) {
        // Superusers can edit position-less people.
        return true;
      }
      return AuthUtils.canAdministrateOrg(editor, subjectPos.getOrganizationUuid());
    }
    return false;
  }

  @GraphQLMutation(name = "updatePerson")
  public Integer updatePerson(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "person") Person p) {
    p.checkAndFixCustomFields();
    final Person user = DaoUtils.getUserFromContext(context);
    final Person existing = dao.getByUuid(p.getUuid());
    assertCanUpdatePerson(user, existing);

    // Only admins can update user/domainUsername
    if (!AuthUtils.isAdmin(user)) {
      p.setUser(existing.getUser());
      p.setDomainUsername(existing.getDomainUsername());
    }

    if (Boolean.TRUE.equals(p.getUser()) && !Utils.isEmptyOrNull(p.getEmailAddresses())) {
      validateEmail(p.getEmailAddresses());
    }

    // Swap the position first in order to do the authentication check.
    if (p.getPosition() != null) {
      // Maybe update position?
      final Position existingPos = DaoUtils.getPosition(existing);
      final String positionUuid = DaoUtils.getUuid(p.getPosition());
      if (existingPos == null && positionUuid != null) {
        // Update the position for this person.
        AuthUtils.assertSuperuser(user);
        engine.getPositionDao().setPersonInPosition(DaoUtils.getUuid(p), positionUuid);
        AnetAuditLogger.log("Person {} put in position {} by {}", p, p.getPosition(), user);
      } else if (existingPos != null && positionUuid == null) {
        // Remove this person from their position.
        AuthUtils.assertSuperuser(user);
        engine.getPositionDao().removePersonFromPosition(existingPos.getUuid());
        AnetAuditLogger.log("Person {} removed from position {} by {}", p, existingPos, user);
      } else if (existingPos != null && !existingPos.getUuid().equals(positionUuid)) {
        // Update the position for this person.
        AuthUtils.assertSuperuser(user);
        engine.getPositionDao().setPersonInPosition(DaoUtils.getUuid(p), positionUuid);
        AnetAuditLogger.log("Person {} put in position {} by {}", p, p.getPosition(), user);
      }
    }

    // If person changed to inactive, clear out the user status and domainUsername
    if (WithStatus.Status.INACTIVE.equals(p.getStatus())
        && !WithStatus.Status.INACTIVE.equals(existing.getStatus())) {
      AnetAuditLogger.log("Person {} user status set to false", p);
      dao.updateAuthenticationDetails(p);
    }

    // Automatically remove people from a position if they are inactive.
    if (WithStatus.Status.INACTIVE.equals(p.getStatus()) && p.getPosition() != null) {
      Position existingPos = DaoUtils.getPosition(existing);
      if (existingPos != null) {
        // A user can reset 'themselves' if the account was incorrect ("This is not me")
        if (!user.getUuid().equals(p.getUuid())) {
          // Otherwise needs to be at least superuser
          AuthUtils.assertSuperuser(user);
        }
        AnetAuditLogger.log("Person {} removed from position by {} because they are now inactive",
            p, user);
        engine.getPositionDao().removePersonFromPosition(existingPos.getUuid());
      }
    }

    p.setBiography(
        Utils.isEmptyHtml(p.getBiography()) ? null : Utils.sanitizeHtml(p.getBiography()));
    final int numRows;
    try {
      numRows = dao.update(p);
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, DUPLICATE_PERSON_DOMAINUSERNAME);
    }

    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process person update");
    }

    engine.getEmailAddressDao().updateEmailAddresses(PersonDao.TABLE_NAME, p.getUuid(),
        p.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, PersonDao.TABLE_NAME, p.getUuid(),
        p.getCustomSensitiveInformation());

    AnetAuditLogger.log("Person {} updated by {}", p, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLMutation(name = "updatePersonHistory")
  public int updatePersonHistory(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "person") Person p) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Person existing = dao.getByUuid(p.getUuid());
    assertCanUpdatePerson(user, existing);

    final String existingPositionUuid = DaoUtils.getUuid(p.getPosition());
    ResourceUtils.validateHistoryInput(p.getUuid(), p.getPreviousPositions(), true,
        existingPositionUuid);

    if (dao.hasHistoryConflict(p.getUuid(), null, p.getPreviousPositions(), true)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "At least one of the positions in the history is occupied for the specified period.");
    }

    final int numRows = dao.updatePersonHistory(p);
    AnetAuditLogger.log("History updated for person {} by {}", p, user);
    return numRows;
  }

  private void assertCanUpdatePerson(final Person user, final Person existing) {
    if (!canCreateOrUpdatePerson(user, existing, false)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "You do not have permissions to edit this person");
    }
  }

  @GraphQLQuery(name = "personList")
  public AnetBeanList<Person> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLEnvironment ResolutionEnvironment env,
      @GraphQLArgument(name = "query") PersonSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(Utils.getSubFields(env), query);
  }

  @GraphQLMutation(name = "approvePerson")
  public Integer approvePerson(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String personUuid) {
    return approveOrDeletePerson(context, personUuid, true);
  }

  @GraphQLMutation(name = "deletePerson")
  public Integer deletePerson(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String personUuid) {
    return approveOrDeletePerson(context, personUuid, false);
  }

  public Integer approveOrDeletePerson(GraphQLContext context, String personUuid,
      boolean isApproved) {
    Person user = DaoUtils.getUserFromContext(context);
    final Person person = dao.getByUuid(personUuid);
    if (person == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found");
    }

    AuthUtils.assertAdministrator(user);
    if (!Boolean.TRUE.equals(person.getPendingVerification())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Person is not pending verification");
    }

    final int numRows = isApproved ? dao.approve(personUuid) : dao.delete(personUuid);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Couldn't " + (isApproved ? "approve" : "delete") + " person");
    }

    AnetAuditLogger.log("Person {} " + (isApproved ? "approved" : "deleted") + " by {}", person,
        user);
    return numRows;
  }

  /**
   * Convenience method for API testing.
   */
  @GraphQLQuery(name = "me")
  @AllowUnverifiedUsers
  public Person getCurrentUser(@GraphQLRootContext GraphQLContext context) {
    return DaoUtils.getUserFromContext(context);
  }

  @GraphQLMutation(name = "updateMe")
  @AllowUnverifiedUsers
  public Integer updateCurrentUser(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "person") Person p) {
    final Person user = DaoUtils.getUserFromContext(context);
    if (!Objects.equals(DaoUtils.getUuid(user), p.getUuid())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update yourself");
    }

    // Only admins can update user/domainUsername
    if (!AuthUtils.isAdmin(user)) {
      final Person existing = dao.getByUuid(p.getUuid());
      p.setUser(existing.getUser());
      p.setDomainUsername(existing.getDomainUsername());
    }

    if (Boolean.TRUE.equals(p.getUser()) && !Utils.isEmptyOrNull(p.getEmailAddresses())) {
      validateEmail(p.getEmailAddresses());
    }

    final Boolean automaticallyAllowAllNewUsers =
        (Boolean) dict.getDictionaryEntry("automaticallyAllowAllNewUsers");
    if (Boolean.FALSE.equals(automaticallyAllowAllNewUsers)) {
      // Users can not verify their own account!
      final Person existing = dao.getByUuid(p.getUuid());
      p.setPendingVerification(existing.getPendingVerification());
    }

    p.setBiography(
        Utils.isEmptyHtml(p.getBiography()) ? null : Utils.sanitizeHtml(p.getBiography()));
    final int numRows = dao.update(p);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process person update");
    }

    engine.getEmailAddressDao().updateEmailAddresses(PersonDao.TABLE_NAME, p.getUuid(),
        p.getEmailAddresses());

    AnetAuditLogger.log("Person {} updated by themselves", p);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLMutation(name = "mergePeople")
  public Integer mergePeople(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "winnerPerson") Person winner) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    final String winnerUuid = DaoUtils.getUuid(winner);
    if (loserUuid.equals(winnerUuid)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "You selected the same person twice");
    }

    final Person existingWinner = dao.getByUuid(winnerUuid);
    if (existingWinner == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Winner not found");
    }

    final Person loser = dao.getByUuid(loserUuid);
    if (loser == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loser not found");
    }

    // Do some additional sanity checks
    final String winnerPositionUuid = DaoUtils.getUuid(winner.getPosition());
    ResourceUtils.validateHistoryInput(winnerUuid, winner.getPreviousPositions(), true,
        winnerPositionUuid);

    if (dao.hasHistoryConflict(winnerUuid, loserUuid, winner.getPreviousPositions(), true)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT,
          "At least one of the positions in the history is occupied for the specified period.");
    }

    int numRows = dao.mergePeople(winner, loser);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process merge operation, error occurred while updating merged person relation information.");
    }
    AnetAuditLogger.log("Person {} merged into {} by {}", loser, winner, user);

    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  private void validateEmail(final List<EmailAddress> emailAddresses) {
    for (final EmailAddress emailAddress : emailAddresses) {
      validateEmail(emailAddress.getAddress());
    }
  }

  private void validateEmail(String emailInput) {
    if (Utils.isEmptyOrNull(emailInput)) {
      return;
    }
    final String[] splittedEmail = emailInput.split("@");
    if (splittedEmail.length < 2 || splittedEmail[1].isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Please provide a valid email address");
    }

    @SuppressWarnings("unchecked")
    final List<String> allowedDomainNames = ((List<String>) dict.getDictionaryEntry("domainNames"))
        .stream().map(String::toLowerCase).toList();

    if (!Utils.isEmailAllowed(emailInput, allowedDomainNames)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, validateEmailErrorMessage());
    }
  }

  private String validateEmailErrorMessage() {
    final String supportEmailAddr = (String) dict.getDictionaryEntry("SUPPORT_EMAIL_ADDR");
    final String messageBody =
        "Only valid email domain names are allowed. If your email domain name is not in the list, please contact the support team";
    final String errorMessage = Utils.isEmptyOrNull(supportEmailAddr) ? messageBody
        : String.format("%s at %s", messageBody, supportEmailAddr);
    return errorMessage;
  }
}
