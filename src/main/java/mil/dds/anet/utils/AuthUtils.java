package mil.dds.anet.utils;

import graphql.GraphQLContext;
import java.lang.invoke.MethodHandles;
import java.util.List;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class AuthUtils {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static final String UNAUTH_MESSAGE = "You do not have permissions to do this";

  private AuthUtils() {}

  public static void assertAdministrator(Person user) {
    logger.debug("Asserting admin status for {}", user);
    if (isAdmin(user)) {
      return;
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, UNAUTH_MESSAGE);
  }

  public static boolean canAdministrateOrg(final Person user, final String organizationUuid) {
    if (organizationUuid == null) {
      logger.debug("Organization {} is null or has a null UUID in canAdministrateOrg check for {}",
          organizationUuid, user);
      return false;
    }
    Position position = DaoUtils.getPosition(user);
    if (position == null) {
      logger.debug("User {} has no position, hence no permissions", user);
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
    final GraphQLContext context = ApplicationContextProvider.getEngine().getContext();
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
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, UNAUTH_MESSAGE);
  }

  public static void assertSuperuser(Person user) {
    logger.debug("Asserting superuser position for {}", user);
    if (!isSuperuser(user)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, UNAUTH_MESSAGE);
    }
  }

  public static boolean isSuperuser(Person user) {
    Position position = DaoUtils.getPosition(user);
    return position != null && (position.getType() == PositionType.SUPERUSER
        || position.getType() == PositionType.ADMINISTRATOR);
  }

  public static boolean isAdmin(Person user) {
    Position position = DaoUtils.getPosition(user);
    return (position != null) && (position.getType() == PositionType.ADMINISTRATOR);
  }

}
