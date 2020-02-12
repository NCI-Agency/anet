package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AuthUtils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static String UNAUTH_MESSAGE = "You do not have permissions to do this";

  public static void assertAdministrator(Person user) {
    logger.debug("Asserting admin status for {}", user);
    if (isAdmin(user)) {
      return;
    }
    throw new WebApplicationException(UNAUTH_MESSAGE, Status.FORBIDDEN);
  }

  public static boolean isSuperUserForOrg(final Person user, final String organizationUuid,
      boolean allowPrincipalOrgs) {
    if (organizationUuid == null) {
      logger.error("Organization {} is null or has a null UUID in SuperUser check for {}",
          organizationUuid, user); // DANGER: possible log injection vector here?
      return false;
    }
    Position position = user.loadPosition();
    if (position == null) {
      logger.warn("User {} has no position, hence no permissions", user);
      return false;
    }
    if (position.getType() == PositionType.ADMINISTRATOR) {
      logger.debug("User {} is an administrator, automatically a superuser", user);
      return true;
    }
    logger.debug("Position for user {} is {}", user, position);
    if (position.getType() != PositionType.SUPER_USER) {
      return false;
    }

    // Given that we know it's a super-user position, does it actually match this organization?
    Organization loadedOrg =
        AnetObjectEngine.getInstance().getOrganizationDao().getByUuid(organizationUuid);
    if (loadedOrg.getType() == OrganizationType.PRINCIPAL_ORG) {
      return allowPrincipalOrgs;
    }

    if (position.getOrganizationUuid() == null) {
      return false;
    }
    if (Objects.equals(organizationUuid, position.getOrganizationUuid())) {
      return true;
    }

    // As a last check, load the descendant orgs.
    final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
    final Organization posOrg = position.loadOrganization(context).join();
    final OrganizationSearchQuery osQuery = new OrganizationSearchQuery();
    osQuery.setPageSize(0);
    final Optional<Organization> orgMatch = posOrg.loadDescendantOrgs(context, osQuery).join()
        .stream().filter(o -> o.getUuid().equals(organizationUuid)).findFirst();
    return orgMatch.isPresent();
  }

  public static void assertSuperUserForOrg(Person user, String organizationUuid,
      boolean allowPrincipalOrgs) {
    // log injection possibility here?
    logger.debug("Asserting superuser status for {} in {}", user, organizationUuid);
    if (isSuperUserForOrg(user, organizationUuid, allowPrincipalOrgs)) {
      return;
    }
    throw new WebApplicationException(UNAUTH_MESSAGE, Status.FORBIDDEN);
  }

  public static void assertSuperUser(Person user) {
    logger.debug("Asserting some superuser status for {}", user);
    Position position = user.loadPosition();
    if (position != null && (position.getType() == PositionType.SUPER_USER
        || position.getType() == PositionType.ADMINISTRATOR)) {
      return;
    }
    throw new WebApplicationException(UNAUTH_MESSAGE, Status.FORBIDDEN);
  }

  public static boolean isAdmin(Person user) {
    Position position = user.loadPosition();
    return (position != null) && (position.getType() == PositionType.ADMINISTRATOR);
  }

}
