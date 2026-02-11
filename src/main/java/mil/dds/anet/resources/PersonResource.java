package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLEnvironment;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.execution.ResolutionEnvironment;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPreference;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PersonPreferenceDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.UserDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class PersonResource {

  private final AnetDictionary dict;
  private final PersonDao dao;
  private final EmailAddressDao emailAddressDao;
  private final PersonPreferenceDao personPreferenceDao;
  private final PositionDao positionDao;
  private final UserDao userDao;

  public PersonResource(AnetDictionary dict, PersonDao dao, EmailAddressDao emailAddressDao,
      PersonPreferenceDao personPreferenceDao, PositionDao positionDao, UserDao userDao) {
    this.dict = dict;
    this.dao = dao;
    this.emailAddressDao = emailAddressDao;
    this.personPreferenceDao = personPreferenceDao;
    this.positionDao = positionDao;
    this.userDao = userDao;
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

    // Only admins can set user/domainUsername
    if (!AuthUtils.isAdmin(user)) {
      p.setUser(false);
      p.setUsers(null);
    }

    if (Boolean.TRUE.equals(p.getUser()) && !Utils.isEmptyOrNull(p.getEmailAddresses())) {
      validateEmail(p.getEmailAddresses());
    }

    p.setBiography(
        Utils.isEmptyHtml(p.getBiography()) ? null : Utils.sanitizeHtml(p.getBiography()));
    final Person created = dao.insert(p);

    if (AuthUtils.isAdmin(user)) {
      userDao.updateUsers(p, p.getUsers());
    }

    emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, created.getUuid(),
        p.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, PersonDao.TABLE_NAME, created.getUuid(),
        p.customSensitiveInformationKey(), p.getCustomSensitiveInformation());

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
      if (create) {
        // Superusers can create new people.
        return true;
      }
      // Ensure that the editor is the superuser for the subject's organization.
      final Position subjectPos = DaoUtils.getPosition(subject);
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
      @GraphQLArgument(name = "person") Person p,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    p.checkAndFixCustomFields();

    final Person user = DaoUtils.getUserFromContext(context);
    final Person existing = dao.getByUuid(p.getUuid());
    assertCanUpdatePerson(user, existing);
    DaoUtils.assertObjectIsFresh(p, existing, force);

    // Only admins can update user/domainUsername
    if (!AuthUtils.isAdmin(user)) {
      p.setUser(existing.getUser());
      p.setUsers(existing.getUsers());
    }

    if (Boolean.TRUE.equals(p.getUser()) && !Utils.isEmptyOrNull(p.getEmailAddresses())) {
      validateEmail(p.getEmailAddresses());
    }

    // If person changed to inactive, update the status
    if (WithStatus.Status.INACTIVE.equals(p.getStatus())
        && !WithStatus.Status.INACTIVE.equals(existing.getStatus())) {
      AnetAuditLogger.log("Person {} set to inactive", p);
      dao.updateAuthenticationDetails(p);
    }

    // Automatically remove people from a position if they are inactive.
    if (WithStatus.Status.INACTIVE.equals(p.getStatus())) {
      final Position existingPos = DaoUtils.getPosition(existing);
      if (existingPos != null) {
        // A user can reset 'themselves' if the account was incorrect ("This is not me")
        if (!user.getUuid().equals(p.getUuid())) {
          // Otherwise needs to be at least superuser
          AuthUtils.assertSuperuser(user);
        }
        AnetAuditLogger.log("Person {} removed from position by {} because they are now inactive",
            p, user);
        positionDao.removePersonFromPositions(p.getUuid(), existingPos.getUuid());
      }
    }

    p.setBiography(
        Utils.isEmptyHtml(p.getBiography()) ? null : Utils.sanitizeHtml(p.getBiography()));
    final int numRows = dao.update(p);

    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process person update");
    }

    if (AuthUtils.isAdmin(user)) {
      userDao.updateUsers(p, p.getUsers());
    }

    emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, p.getUuid(), p.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, PersonDao.TABLE_NAME, p.getUuid(),
        p.customSensitiveInformationKey(), p.getCustomSensitiveInformation());

    // Update any subscriptions
    dao.updateSubscriptions(p);

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

  @GraphQLMutation(name = "updatePersonPreferences")
  public Integer updatePersonPreferences(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "preferences") List<PersonPreference> preferences) {
    final Person user = DaoUtils.getUserFromContext(context);

    int totalRows = 0;
    for (PersonPreference preference : preferences) {
      final int numRows = personPreferenceDao.upsert(user, preference);
      if (numRows == 0) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
            "Couldn't upsert person preference: " + preference);
      }
      totalRows += numRows;
    }
    AnetAuditLogger.log("Person preferences updated by {}", user);
    return totalRows;
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

    // Update any subscriptions
    dao.updateSubscriptions(person);

    AnetAuditLogger.log("Person {} " + (isApproved ? "approved" : "deleted") + " by {}", person,
        user);
    return numRows;
  }

  @GraphQLQuery(name = "me")
  @AllowUnverifiedUsers
  public Person getCurrentUser(@GraphQLRootContext GraphQLContext context) {
    return dao.getByUuid(DaoUtils.getUuid(DaoUtils.getUserFromContext(context)));
  }

  @GraphQLMutation(name = "updateMe")
  @AllowUnverifiedUsers
  public Integer updateCurrentUser(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "person") Person p,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    p.checkAndFixCustomFields();

    final Person user = DaoUtils.getUserFromContext(context);
    if (!Objects.equals(DaoUtils.getUuid(user), p.getUuid())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update yourself");
    }

    final Person existing = dao.getByUuid(p.getUuid());
    DaoUtils.assertObjectIsFresh(p, existing, force);

    // Only admins can update user/domainUsername
    if (!AuthUtils.isAdmin(user)) {
      p.setUser(existing.getUser());
      p.setUsers(existing.getUsers());
    }

    if (Boolean.TRUE.equals(p.getUser()) && !Utils.isEmptyOrNull(p.getEmailAddresses())) {
      validateEmail(p.getEmailAddresses());
    }

    final Boolean automaticallyAllowAllNewUsers =
        (Boolean) dict.getDictionaryEntry("automaticallyAllowAllNewUsers");
    if (Boolean.FALSE.equals(automaticallyAllowAllNewUsers)) {
      // Users can not verify their own account!
      p.setPendingVerification(existing.getPendingVerification());
    }

    p.setBiography(
        Utils.isEmptyHtml(p.getBiography()) ? null : Utils.sanitizeHtml(p.getBiography()));
    final int numRows = dao.update(p);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process person update");
    }

    emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, p.getUuid(), p.getEmailAddresses());

    AnetAuditLogger.log("Person {} updated by themselves", p);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLMutation(name = "mergePeople")
  public Integer mergePeople(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "winnerPerson") Person winner,
      @GraphQLArgument(name = "useWinnerPositionHistory",
          defaultValue = "true") boolean useWinnerPositionHistory) {
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

    int numRows = dao.mergePeople(winner, loser, useWinnerPositionHistory);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process merge operation, error occurred while updating merged person relation information.");
    }

    // Update any subscriptions
    dao.updateSubscriptions(winner);

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
