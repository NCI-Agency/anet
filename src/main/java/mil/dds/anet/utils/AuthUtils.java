package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
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

  public static boolean canAdministrateOrg(final Person user, final String organizationUuid) {
    if (organizationUuid == null) {
      logger.error("Organization {} is null or has a null UUID in canAdministrateOrg check for {}",
          organizationUuid, user);
      return false;
    }
    Position position = DaoUtils.getPosition(user);
    if (position == null) {
      logger.warn("User {} has no position, hence no permissions", user);
      return false;
    }
    if (position.getType() == PositionType.ADMINISTRATOR) {
      logger.debug("User {} is an administrator, can automatically administrate org", user);
      return true;
    }
    logger.debug("Position for user {} is {}", user, position);
    if (position.getType() != PositionType.SUPERUSER) {
      return false;
    }

    // Check the responsible organizations.
    final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
    final List<Organization> administratedOrgs =
        position.loadOrganizationsAdministrated(context).join();
    if (administratedOrgs.stream().anyMatch(o -> o.getUuid().equals(organizationUuid))) {
      return true;
    }

    // As a final resort, check the descendant orgs of the position's responsible orgs.
    final OrganizationSearchQuery osQuery = new OrganizationSearchQuery();
    osQuery.setPageSize(0);
    for (final Organization administratedOrg : administratedOrgs) {
      if (administratedOrg.loadDescendantOrgs(context, osQuery).join().stream()
          .anyMatch(o -> o.getUuid().equals(organizationUuid))) {
        return true;
      }
    }
    return false;
  }

  public static void assertCanAdministrateOrg(Person user, String organizationUuid) {
    // log injection possibility here?
    logger.debug("Asserting canAdministrateOrg status for {} in {}", user, organizationUuid);
    if (canAdministrateOrg(user, organizationUuid)) {
      return;
    }
    throw new WebApplicationException(UNAUTH_MESSAGE, Status.FORBIDDEN);
  }

  public static void assertSuperuser(Person user) {
    logger.debug("Asserting superuser position for {}", user);
    Position position = DaoUtils.getPosition(user);
    if (position != null && (position.getType() == PositionType.SUPERUSER
        || position.getType() == PositionType.ADMINISTRATOR)) {
      return;
    }
    throw new WebApplicationException(UNAUTH_MESSAGE, Status.FORBIDDEN);
  }

  public static boolean isAdmin(Person user) {
    Position position = DaoUtils.getPosition(user);
    return (position != null) && (position.getType() == PositionType.ADMINISTRATOR);
  }

}
