package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.PersonDao;
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
    Person person = findUser(dao, (String) claims.get(StandardClaimNames.SUB), true);
    if (person == null) {
      // Call synchronized method
      person = findOrCreateUser(dao, claims);
    }
    return person;
  }

  // Non-synchronized method, safe to run multiple times in parallel
  private static Person findUser(final PersonDao dao, final String openIdSubject,
      final boolean activeUser) {
    final List<Person> p = dao.findByOpenIdSubject(openIdSubject, activeUser);
    if (!p.isEmpty()) {
      final Person existingPerson = p.get(0);
      logger.trace("found existing user={} by openIdSubject={}", existingPerson, openIdSubject);
      return existingPerson;
    }

    return null;
  }

  // Synchronized method, so we create/update at most one user in the face of multiple
  // simultaneous authentication requests
  private static synchronized Person findOrCreateUser(final PersonDao dao,
      final Map<String, Object> claims) {
    final String openIdSubject = (String) claims.get(StandardClaimNames.SUB);
    final String username = (String) claims.get(StandardClaimNames.PREFERRED_USERNAME);
    final Person person = findUser(dao, openIdSubject, false);
    if (person != null) {
      return updatePerson(dao, person, openIdSubject, username);
    }

    // Might be user from before Keycloak integration, try username
    List<Person> p = dao.findByDomainUsername(username);
    if (!p.isEmpty()) {
      final Person existingPerson = p.get(0);
      logger.trace("found existing user={} by domainUsername={}", existingPerson, username);
      return updatePerson(dao, existingPerson, openIdSubject, username);
    }

    // Not found, first time this user has ever logged in
    return createPerson(dao, openIdSubject, username, (String) claims.get(StandardClaimNames.EMAIL),
        getCombinedName(claims));
  }

  private static Person updatePerson(final PersonDao dao, final Person person,
      final String openIdSubject, final String username) {
    logger.trace("updating user={} with domainUsername={} (was {}) and openIdSubject={} (was {})",
        person, username, person.getDomainUsername(), openIdSubject, person.getOpenIdSubject());
    person.setDomainUsername(username);
    person.setOpenIdSubject(openIdSubject);
    if (person.getStatus() != WithStatus.Status.ACTIVE || !Boolean.TRUE.equals(person.getUser())) {
      logger.trace("reactivating user={}", person);
      person.setStatus(WithStatus.Status.ACTIVE);
      person.setUser(true);
      person.setPendingVerification(true);
      person.setEndOfTourDate(null);
    }
    dao.updateAuthenticationDetails(person);
    return person;
  }

  private static Person createPerson(final PersonDao dao, final String openIdSubject,
      final String username, final String email, final String name) {
    final Person newPerson = new Person();
    logger.trace("creating new user with domainUsername={}, email={} and openIdSubject={}",
        username, email, openIdSubject);
    newPerson.setUser(true);
    newPerson.setPendingVerification(true);
    // Copy some data from the authentication token
    newPerson.setOpenIdSubject(openIdSubject);
    newPerson.setDomainUsername(username);
    newPerson.setName(name);
    /*
     * Note: there's also token.getGender(), but that's not generally available in AD/LDAP, and
     * token.getPhoneNumber(), but that requires scope="openid phone" on the authentication request,
     * which is hard to accomplish with current Keycloak code.
     */
    final Person person = dao.insert(newPerson);
    if (!Utils.isEmptyOrNull(email)) {
      final EmailAddressDao emailAddressDao =
          ApplicationContextProvider.getEngine().getEmailAddressDao();
      final EmailAddress emailAddress =
          new EmailAddress(Utils.getEmailNetworkForNotifications(), email);
      emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, person.getUuid(),
          List.of(emailAddress));
    }
    return person;
  }

  private static String getCombinedName(Map<String, Object> claims) {
    final StringBuilder combinedName = new StringBuilder();
    // Try to combine FAMILYNAME, GivenName MiddleName
    final String fn =
        Utils.trimStringReturnNull((String) claims.get(StandardClaimNames.FAMILY_NAME));
    if (!Utils.isEmptyOrNull(fn)) {
      combinedName.append(fn.toUpperCase());
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
