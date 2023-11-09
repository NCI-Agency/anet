package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class LocationResource {

  private final AnetObjectEngine engine;
  private final LocationDao dao;

  public LocationResource(AnetObjectEngine engine) {
    this.engine = engine;
    this.dao = engine.getLocationDao();
  }

  public static boolean hasPermission(final Person user, final String locationUuid) {
    return AuthUtils.isSuperuser(user);
  }

  public static void assertPermission(final Person user, final String locationUuid) {
    if (!hasPermission(user, locationUuid)) {
      throw new WebApplicationException(AuthUtils.UNAUTH_MESSAGE, Status.FORBIDDEN);
    }
  }

  @GraphQLQuery(name = "location")
  public Location getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Location loc = dao.getByUuid(uuid);
    if (loc == null) {
      throw new WebApplicationException("Location not found", Status.NOT_FOUND);
    }
    return loc;
  }

  @GraphQLQuery(name = "locationList")
  public AnetBeanList<Location> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") LocationSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  @GraphQLMutation(name = "createLocation")
  public Location createLocation(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "location") Location l) {
    l.checkAndFixCustomFields();
    l.setDescription(
        Utils.isEmptyHtml(l.getDescription()) ? null : Utils.sanitizeHtml(l.getDescription()));
    final Person user = DaoUtils.getUserFromContext(context);
    assertPermission(user, DaoUtils.getUuid(l));
    if (l.getName() == null || l.getName().trim().length() == 0) {
      throw new WebApplicationException("Location name must not be empty", Status.BAD_REQUEST);
    }
    final Location created = dao.insert(l);
    if (l.getPlanningApprovalSteps() != null) {
      // Create the planning approval steps
      for (ApprovalStep step : l.getPlanningApprovalSteps()) {
        Utils.validateApprovalStep(step);
        step.setRelatedObjectUuid(created.getUuid());
        engine.getApprovalStepDao().insertAtEnd(step);
      }
    }
    if (l.getApprovalSteps() != null) {
      // Create the approval steps
      for (ApprovalStep step : l.getApprovalSteps()) {
        Utils.validateApprovalStep(step);
        step.setRelatedObjectUuid(created.getUuid());
        engine.getApprovalStepDao().insertAtEnd(step);
      }
    }

    DaoUtils.saveCustomSensitiveInformation(user, LocationDao.TABLE_NAME, created.getUuid(),
        l.getCustomSensitiveInformation());

    AnetAuditLogger.log("Location {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateLocation")
  public Integer updateLocation(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "location") Location l) {
    l.checkAndFixCustomFields();
    l.setDescription(
        Utils.isEmptyHtml(l.getDescription()) ? null : Utils.sanitizeHtml(l.getDescription()));
    final Person user = DaoUtils.getUserFromContext(context);
    assertPermission(user, DaoUtils.getUuid(l));
    final int numRows = dao.update(l);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process location update", Status.NOT_FOUND);
    }

    // Load the existing location, so we can check for differences.
    final Location existing = dao.getByUuid(l.getUuid());
    final List<ApprovalStep> existingPlanningApprovalSteps =
        existing.loadPlanningApprovalSteps(engine.getContext()).join();
    final List<ApprovalStep> existingApprovalSteps =
        existing.loadApprovalSteps(engine.getContext()).join();
    Utils.updateApprovalSteps(l, l.getPlanningApprovalSteps(), existingPlanningApprovalSteps,
        l.getApprovalSteps(), existingApprovalSteps);

    DaoUtils.saveCustomSensitiveInformation(user, LocationDao.TABLE_NAME, l.getUuid(),
        l.getCustomSensitiveInformation());

    AnetAuditLogger.log("Location {} updated by {}", l, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLMutation(name = "mergeLocations")
  public Integer mergeLocations(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "winnerLocation") Location winnerLocation) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Location loserLocation = dao.getByUuid(loserUuid);

    AuthUtils.assertAdministrator(user);
    // Check that given two locations can be merged
    areLocationsMergeable(winnerLocation, loserLocation);
    validateLocation(winnerLocation);

    int numRows = dao.mergeLocations(loserLocation, winnerLocation);
    if (numRows == 0) {
      throw new WebApplicationException(
          "Couldn't process merge operation, error occurred while updating merged location relation information.",
          Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Location {} merged into {} by {}", loserLocation, winnerLocation, user);
    return numRows;
  }

  private void validateLocation(Location winnerLocation) {
    if (winnerLocation.getName() == null || winnerLocation.getName().trim().length() == 0) {
      throw new WebApplicationException("Location Name must not be null", Status.BAD_REQUEST);
    }
  }

  private void areLocationsMergeable(Location winnerLocation, Location loserLocation) {
    if (loserLocation.getUuid().equals(winnerLocation.getUuid())) {
      throw new WebApplicationException("Cannot merge identical locations.", Status.BAD_REQUEST);
    }
  }

}
