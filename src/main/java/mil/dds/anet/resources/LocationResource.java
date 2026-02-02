package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class LocationResource {

  private final AnetDictionary dict;
  private final AnetObjectEngine engine;
  private final LocationDao dao;

  public LocationResource(AnetDictionary dict, AnetObjectEngine anetObjectEngine, LocationDao dao) {
    this.dict = dict;
    this.engine = anetObjectEngine;
    this.dao = dao;
  }

  public static boolean hasPermission(final Person user, final String locationUuid) {
    return AuthUtils.isSuperuser(user);
  }

  public void assertPermission(final Person user, final String locationUuid) {
    if (!hasPermission(user, locationUuid)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
    }
  }

  @GraphQLQuery(name = "location")
  public Location getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Location loc = dao.getByUuid(uuid);
    if (loc == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Location not found");
    }
    return loc;
  }

  @GraphQLQuery(name = "locations")
  public List<Location> getByUuids(@GraphQLArgument(name = "uuids") List<String> uuids) {
    return dao.getByIds(uuids);
  }

  @GraphQLQuery(name = "locationList")
  @AllowUnverifiedUsers
  public AnetBeanList<Location> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") LocationSearchQuery query) {
    final Person user = DaoUtils.getUserFromContext(context);
    if (Boolean.TRUE.equals(user.getPendingVerification())) {
      // Unverified users can only search for countries
      query.setType(Location.LocationType.COUNTRY);
    }
    query.setUser(user);
    return dao.search(query);
  }

  @GraphQLMutation(name = "createLocation")
  public Location createLocation(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "location") Location l) {
    l.checkAndFixCustomFields();
    l.setDescription(
        Utils.isEmptyHtml(l.getDescription()) ? null : Utils.sanitizeHtml(l.getDescription()));
    final Person user = DaoUtils.getUserFromContext(context);
    if (Boolean.FALSE.equals(dict.getDictionaryEntry("regularUsersCanCreateLocations"))) {
      assertPermission(user, DaoUtils.getUuid(l));
    }
    if (l.getName() == null || l.getName().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location name must not be empty");
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

    // Update parent locations:
    if (l.getParentLocations() != null) {
      for (final Location parentLocation : l.getParentLocations()) {
        dao.addLocationRelationship(parentLocation, l);
      }
    }

    DaoUtils.saveCustomSensitiveInformation(user, LocationDao.TABLE_NAME, created.getUuid(),
        l.customSensitiveInformationKey(), l.getCustomSensitiveInformation());

    AnetAuditLogger.log("Location {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateLocation")
  public Integer updateLocation(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "location") Location l,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    l.checkAndFixCustomFields();
    l.setDescription(
        Utils.isEmptyHtml(l.getDescription()) ? null : Utils.sanitizeHtml(l.getDescription()));

    final Person user = DaoUtils.getUserFromContext(context);
    final Location existing = dao.getByUuid(l.getUuid());
    assertPermission(user, DaoUtils.getUuid(l));
    DaoUtils.assertObjectIsFresh(l, existing, force);

    // Check for loops in the hierarchy
    checkForLoops(l.getUuid(), l.getParentLocations());

    final int numRows = dao.update(l);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process location update");
    }

    // Update approval steps:
    final List<ApprovalStep> existingPlanningApprovalSteps =
        existing.loadPlanningApprovalSteps(engine.getContext()).join();
    final List<ApprovalStep> existingApprovalSteps =
        existing.loadApprovalSteps(engine.getContext()).join();
    Utils.updateApprovalSteps(l, l.getPlanningApprovalSteps(), existingPlanningApprovalSteps,
        l.getApprovalSteps(), existingApprovalSteps);

    // Update parent locations:
    if (l.getParentLocations() != null) {
      final List<Location> existingParentLocations =
          existing.loadParentLocations(engine.getContext(), null).join();
      Utils.addRemoveElementsByUuid(existingParentLocations, l.getParentLocations(),
          newParentLocation -> dao.addLocationRelationship(newParentLocation, l),
          oldParentLocation -> dao.removeLocationRelationship(oldParentLocation, l));
    }

    DaoUtils.saveCustomSensitiveInformation(user, LocationDao.TABLE_NAME, l.getUuid(),
        l.customSensitiveInformationKey(), l.getCustomSensitiveInformation());

    // Update any subscriptions
    dao.updateSubscriptions(l);

    AnetAuditLogger.log("Location {} updated by {}", l, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  private void checkForLoops(String locationUuid, List<Location> parentLocations) {
    if (!Utils.isEmptyOrNull(parentLocations)) {
      final Set<String> parentLocationUuids =
          parentLocations.stream().map(Location::getUuid).collect(Collectors.toSet());
      final Map<String, Set<String>> children = engine.buildLocationHash(locationUuid, true);
      children.keySet().retainAll(parentLocationUuids);
      if (!children.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
            "Location can not be its own (grand…)parent");
      }
    }
  }

  @GraphQLMutation(name = "mergeLocations")
  public Integer mergeLocations(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "winnerLocation") Location winnerLocation) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Location loserLocation = dao.getByUuid(loserUuid);

    AuthUtils.assertAdministrator(user);
    // Check that given two locations can be merged
    areLocationsMergeable(winnerLocation, loserLocation);
    validateLocation(winnerLocation);
    // Check for loops in the hierarchy
    checkForLoops(winnerLocation.getUuid(), winnerLocation.getParentLocations());
    checkForLoops(loserUuid, winnerLocation.getParentLocations());

    int numRows = dao.mergeLocations(loserLocation, winnerLocation);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process merge operation, error occurred while updating merged location relation information.");
    }

    // Update any subscriptions
    dao.updateSubscriptions(winnerLocation);

    AnetAuditLogger.log("Location {} merged into {} by {}", loserLocation, winnerLocation, user);
    return numRows;
  }

  private void validateLocation(Location winnerLocation) {
    if (winnerLocation.getName() == null || winnerLocation.getName().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location Name must not be empty");
    }
  }

  private void areLocationsMergeable(Location winnerLocation, Location loserLocation) {
    if (loserLocation.getUuid().equals(winnerLocation.getUuid())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Cannot merge identical locations.");
    }
  }

}
