package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.User;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.UserDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.StandardClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public class SecurityUtils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private SecurityUtils() {}

  public static Person getPersonFromPrincipal(final Principal principal) {
    final Map<String, Object> claims = getClaimsFromPrincipal(principal);
    if (claims.isEmpty()) {
      return null;
    }
    return getPersonFromClaims(claims);
  }

  private static Map<String, Object> getClaimsFromPrincipal(final Principal principal) {
    if (principal instanceof JwtAuthenticationToken jwt) {
      return jwt.getToken().getClaims();
    } else if (principal instanceof OAuth2AuthenticationToken oauth2) {
      return oauth2.getPrincipal().getAttributes();
    }
    return Map.of();
  }

  private static Person getPersonFromClaims(final Map<String, Object> claims) {
    final PersonDao dao = ApplicationContextProvider.getEngine().getPersonDao();
    // Call non-synchronized method first
    Person person = findUser(dao, (String) claims.get(StandardClaimNames.PREFERRED_USERNAME), true);
    if (person == null) {
      // Call synchronized method
      person = findOrCreateUser(dao, claims);
    }
    return person;
  }

  // Non-synchronized method, safe to run multiple times in parallel
  private static Person findUser(final PersonDao dao, final String domainUsername,
      final boolean activeUser) {
    final List<Person> p = dao.findByDomainUsername(domainUsername, activeUser);
    if (!p.isEmpty()) {
      final Person existingPerson = p.get(0);
      logger.trace("found existing user={} by domainUsername={}", existingPerson, domainUsername);
      return existingPerson;
    }

    return null;
  }

  // Synchronized method, so we create/update at most one user in the face of multiple
  // simultaneous authentication requests
  private static synchronized Person findOrCreateUser(final PersonDao dao,
      final Map<String, Object> claims) {
    final String username = (String) claims.get(StandardClaimNames.PREFERRED_USERNAME);
    final Person person = findUser(dao, username, false);
    if (person != null) {
      return updatePerson(dao, person, username);
    }

    // Not found, first time this user has ever logged in
    return createPerson(dao, username, (String) claims.get(StandardClaimNames.EMAIL),
        getCombinedName(claims));
  }

  private static Person updatePerson(final PersonDao dao, final Person person,
      final String username) {
    logger.trace("updating user={} with domainUsername={}", person, username);
    if (person.getStatus() != WithStatus.Status.ACTIVE || !Boolean.TRUE.equals(person.getUser())) {
      logger.trace("reactivating user={}", person);
      person.setStatus(WithStatus.Status.ACTIVE);
      person.setUser(true);
      person.setPendingVerification(true);
      person.setEndOfTourDate(null);
    }
    dao.updateAuthenticationDetails(person);
    final AuditTrailDao auditTrailDao = ApplicationContextProvider.getEngine().getAuditTrailDao();
    auditTrailDao.logUpdate(person, PersonDao.TABLE_NAME, person, "person has been (re)activated");
    return person;
  }

  private static Person createPerson(final PersonDao dao, final String username, final String email,
      final String name) {
    final Person newPerson = new Person();
    logger.trace("creating new user with domainUsername={} and email={}", username, email);
    newPerson.setUser(true);
    newPerson.setPendingVerification(true);
    // Copy some data from the authentication token
    newPerson.setName(name);
    /*
     * Note: there's also token.getGender(), but that's not generally available in AD/LDAP, and
     * token.getPhoneNumber(), but that requires scope="openid phone" on the authentication request,
     * which is hard to accomplish with current Keycloak code.
     */
    final Person person = dao.insert(newPerson);

    final User newUser = new User();
    // Copy some data from the authentication token
    newUser.setDomainUsername(username);
    newUser.setPersonUuid(person.getUuid());
    final UserDao userDao = ApplicationContextProvider.getEngine().getUserDao();
    final User user = userDao.insert(newUser);
    person.setUsers(List.of(user));

    if (!Utils.isEmptyOrNull(email)) {
      final EmailAddressDao emailAddressDao =
          ApplicationContextProvider.getEngine().getEmailAddressDao();
      final EmailAddress emailAddress =
          new EmailAddress(Utils.getEmailNetworkForNotifications(), email);
      emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, person.getUuid(),
          List.of(emailAddress));
    }
    final AuditTrailDao auditTrailDao = ApplicationContextProvider.getEngine().getAuditTrailDao();
    auditTrailDao.logCreate(person, PersonDao.TABLE_NAME, person,
        "person signed in for the first time");
    return person;
  }

  private static String getCombinedName(Map<String, Object> claims) {
    final StringBuilder combinedName = new StringBuilder();
    // Try to combine FamilyName, GivenName MiddleName
    final String fn =
        Utils.trimStringReturnNull((String) claims.get(StandardClaimNames.FAMILY_NAME));
    if (!Utils.isEmptyOrNull(fn)) {
      combinedName.append(fn);
      final String gn =
          Utils.trimStringReturnNull((String) claims.get(StandardClaimNames.GIVEN_NAME));
      if (!Utils.isEmptyOrNull(gn)) {
        combinedName.append(", ");
        combinedName.append(gn);
      }
      final String mn =
          Utils.trimStringReturnNull((String) claims.get(StandardClaimNames.MIDDLE_NAME));
      if (!Utils.isEmptyOrNull(mn)) {
        combinedName.append(" ");
        combinedName.append(mn);
      }
    }
    if (combinedName.isEmpty()
        && !Utils.isEmptyOrNull((String) claims.get(StandardClaimNames.NAME))) {
      // Fall back to just the name
      combinedName.append(claims.get(StandardClaimNames.NAME));
    }
    return combinedName.toString();
  }
}
