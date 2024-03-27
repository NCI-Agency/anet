package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLEnvironment;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.execution.ResolutionEnvironment;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.Utils;

public class PersonResource {
  private final PersonDao dao;
  private final AnetObjectEngine engine;
  private final AnetConfiguration config;

  public PersonResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.engine = engine;
    this.dao = engine.getPersonDao();
    this.config = config;
  }

  public static boolean hasPermission(final Person user, final String personUuid) {
    return canCreateOrUpdatePerson(user,
        AnetObjectEngine.getInstance().getPersonDao().getByUuid(personUuid), false);
  }

  /**
   * Returns a single person entry based on UUID.
   */
  @GraphQLQuery(name = "person")
  public Person getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Person p = dao.getByUuid(uuid);
    if (p == null) {
      throw new WebApplicationException("Person not found", Status.NOT_FOUND);
    }
    return p;
  }

  @GraphQLMutation(name = "createPerson")
  public Person createPerson(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "person") Person p) {
    p.checkAndFixCustomFields();
    final Person user = DaoUtils.getUserFromContext(context);
    if (!canCreateOrUpdatePerson(user, p, true)) {
      throw new WebApplicationException("You do not have permissions to create this person",
          Status.FORBIDDEN);
    }

    final String positionUuid = DaoUtils.getUuid(p.getPosition());
    if (positionUuid != null && engine.getPositionDao().getByUuid(positionUuid) == null) {
      throw new WebApplicationException("Position " + p.getPosition() + " does not exist",
          Status.BAD_REQUEST);
    }

    if (Boolean.TRUE.equals(p.getUser()) && !Utils.isEmptyOrNull(p.getEmailAddresses())) {
      validateEmail(p.getEmailAddresses());
    }

    p.setBiography(
        Utils.isEmptyHtml(p.getBiography()) ? null : Utils.sanitizeHtml(p.getBiography()));
    Person created = dao.insert(p);

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
      final Position subjectPos =
          create
              ? AnetObjectEngine.getInstance().getPositionDao()
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
  public Integer updatePerson(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "person") Person p) {
    p.checkAndFixCustomFields();
    final Person user = DaoUtils.getUserFromContext(context);
    final Person existing = dao.getByUuid(p.getUuid());
    assertCanUpdatePerson(user, existing);

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

    // If person changed to inactive, clear out the user status and domainUsername and openIdSubject
    if (Person.Status.INACTIVE.equals(p.getStatus())
        && !Person.Status.INACTIVE.equals(existing.getStatus())) {
      AnetAuditLogger.log("Person {} user status set to false, "
          + "and domainUsername '{}' and openIdSubject '{}' cleared by {} because they are now inactive",
          p, existing.getDomainUsername(), existing.getOpenIdSubject(), user);
      p.setUser(false);
      p.setDomainUsername(null);
      p.setOpenIdSubject(null);
      dao.updateAuthenticationDetails(p);
    }

    // Automatically remove people from a position if they are inactive.
    if (Person.Status.INACTIVE.equals(p.getStatus()) && p.getPosition() != null) {
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
    final int numRows = dao.update(p);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process person update", Status.NOT_FOUND);
    }

    engine.getEmailAddressDao().updateEmailAddresses(PersonDao.TABLE_NAME, p.getUuid(),
        p.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, PersonDao.TABLE_NAME, p.getUuid(),
        p.getCustomSensitiveInformation());

    AnetAuditLogger.log("Person {} updated by {}", p, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLMutation(name = "updatePersonAvatar")
  public int updatePersonAvatar(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "person") Person p) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Person existing = dao.getByUuid(p.getUuid());
    assertCanUpdatePerson(user, existing);
    final int numRows = dao.updateAvatar(p);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process person avatar update", Status.NOT_FOUND);
    }

    AnetAuditLogger.log("Person {} avatar updated by {}", p, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLMutation(name = "updatePersonHistory")
  public int updatePersonHistory(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "person") Person p) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Person existing = dao.getByUuid(p.getUuid());
    assertCanUpdatePerson(user, existing);

    final String existingPositionUuid = DaoUtils.getUuid(p.getPosition());
    ResourceUtils.validateHistoryInput(p.getUuid(), p.getPreviousPositions(), true,
        existingPositionUuid);

    if (dao.hasHistoryConflict(p.getUuid(), null, p.getPreviousPositions(), true)) {
      throw new WebApplicationException(
          "At least one of the positions in the history is occupied for the specified period.",
          Status.CONFLICT);
    }

    final int numRows = dao.updatePersonHistory(p);
    AnetAuditLogger.log("History updated for person {} by {}", p, user);
    return numRows;
  }

  private void assertCanUpdatePerson(final Person user, final Person existing) {
    if (!canCreateOrUpdatePerson(user, existing, false)) {
      throw new WebApplicationException("You do not have permissions to edit this person",
          Status.FORBIDDEN);
    }
  }

  @GraphQLQuery(name = "personList")
  public AnetBeanList<Person> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLEnvironment ResolutionEnvironment env,
      @GraphQLArgument(name = "query") PersonSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(Utils.getSubFields(env), query);
  }

  @GraphQLMutation(name = "approvePerson")
  public Integer approvePerson(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String personUuid) {
    return approveOrDeletePerson(context, personUuid, true);
  }

  @GraphQLMutation(name = "deletePerson")
  public Integer deletePerson(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String personUuid) {
    return approveOrDeletePerson(context, personUuid, false);
  }

  public Integer approveOrDeletePerson(Map<String, Object> context, String personUuid,
      boolean isApproved) {
    Person user = DaoUtils.getUserFromContext(context);
    final Person person = dao.getByUuid(personUuid);
    if (person == null) {
      throw new WebApplicationException("Person not found", Status.NOT_FOUND);
    }

    AuthUtils.assertAdministrator(user);
    if (!Boolean.TRUE.equals(person.getPendingVerification())) {
      throw new WebApplicationException("Person is not pending verification", Status.FORBIDDEN);
    }

    final int numRows = isApproved ? dao.approve(personUuid) : dao.delete(personUuid);
    if (numRows == 0) {
      throw new WebApplicationException(
          "Couldn't " + (isApproved ? "approve" : "delete") + " person",
          Status.INTERNAL_SERVER_ERROR);
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
  public Person getCurrentUser(@GraphQLRootContext Map<String, Object> context) {
    return DaoUtils.getUserFromContext(context);
  }

  @GraphQLMutation(name = "updateMe")
  @AllowUnverifiedUsers
  public Integer updateCurrentUser(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "person") Person p) {
    final Person user = DaoUtils.getUserFromContext(context);
    if (!Objects.equals(DaoUtils.getUuid(user), p.getUuid())) {
      throw new WebApplicationException("You can only update yourself", Status.FORBIDDEN);
    }

    if (Boolean.TRUE.equals(p.getUser()) && !Utils.isEmptyOrNull(p.getEmailAddresses())) {
      validateEmail(p.getEmailAddresses());
    }

    final Boolean automaticallyAllowAllNewUsers =
        (Boolean) this.config.getDictionaryEntry("automaticallyAllowAllNewUsers");
    if (Boolean.FALSE.equals(automaticallyAllowAllNewUsers)) {
      // Users can not verify their own account!
      final Person existing = dao.getByUuid(p.getUuid());
      p.setPendingVerification(existing.getPendingVerification());
    }

    p.setBiography(
        Utils.isEmptyHtml(p.getBiography()) ? null : Utils.sanitizeHtml(p.getBiography()));
    final int numRows = dao.update(p);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process person update", Status.NOT_FOUND);
    }

    engine.getEmailAddressDao().updateEmailAddresses(PersonDao.TABLE_NAME, p.getUuid(),
        p.getEmailAddresses());

    AnetAuditLogger.log("Person {} updated by themselves", p);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLMutation(name = "mergePeople")
  public Integer mergePeople(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "winnerPerson") Person winner) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    final String winnerUuid = DaoUtils.getUuid(winner);
    if (loserUuid.equals(winnerUuid)) {
      throw new WebApplicationException("You selected the same person twice", Status.BAD_REQUEST);
    }

    final Person existingWinner = dao.getByUuid(winnerUuid);
    if (existingWinner == null) {
      throw new WebApplicationException("Winner not found", Status.NOT_FOUND);
    }

    final Person loser = dao.getByUuid(loserUuid);
    if (loser == null) {
      throw new WebApplicationException("Loser not found", Status.NOT_FOUND);
    }

    // Do some additional sanity checks
    final String winnerPositionUuid = DaoUtils.getUuid(winner.getPosition());
    ResourceUtils.validateHistoryInput(winnerUuid, winner.getPreviousPositions(), true,
        winnerPositionUuid);

    if (dao.hasHistoryConflict(winnerUuid, loserUuid, winner.getPreviousPositions(), true)) {
      throw new WebApplicationException(
          "At least one of the positions in the history is occupied for the specified period.",
          Status.CONFLICT);
    }

    int numRows = dao.mergePeople(winner, loser);
    if (numRows == 0) {
      throw new WebApplicationException(
          "Couldn't process merge operation, error occurred while updating merged person relation information.",
          Status.NOT_FOUND);
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
    if (splittedEmail.length < 2 || splittedEmail[1].length() == 0) {
      throw new WebApplicationException("Please provide a valid email address", Status.BAD_REQUEST);
    }

    @SuppressWarnings("unchecked")
    final List<String> allowedDomainNames =
        ((List<String>) this.config.getDictionaryEntry("domainNames")).stream()
            .map(String::toLowerCase).collect(Collectors.toList());

    if (!Utils.isEmailAllowed(emailInput, allowedDomainNames)) {
      throw new WebApplicationException(validateEmailErrorMessage(), Status.BAD_REQUEST);
    }
  }

  private String validateEmailErrorMessage() {
    final String supportEmailAddr = (String) this.config.getDictionaryEntry("SUPPORT_EMAIL_ADDR");
    final String messageBody =
        "Only valid email domain names are allowed. If your email domain name is not in the list, please contact the support team";
    final String errorMessage = Utils.isEmptyOrNull(supportEmailAddr) ? messageBody
        : String.format("%s at %s", messageBody, supportEmailAddr);
    return errorMessage;
  }
}
