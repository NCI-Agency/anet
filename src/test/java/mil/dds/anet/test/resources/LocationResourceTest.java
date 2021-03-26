package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.util.HashMap;
import java.util.Map;
import javax.ws.rs.ForbiddenException;
import javax.ws.rs.NotFoundException;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Location;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.LocationSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import org.junit.jupiter.api.Test;

public class LocationResourceTest extends AbstractResourceTest {

  private static final String FIELDS = "{ uuid name status lat lng }";

  @Test
  public void locationTestGraphQL()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create
    final LocationInput lInput = TestData.createLocationInput("The Boat Dock", 43.21, -87.65);
    final Location created = adminMutationExecutor.createLocation(FIELDS, lInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getName()).isEqualTo(lInput.getName());

    // Search
    // You cannot search for the Boat Dock location, because full-text indexing
    // is done asynchronously and is not guaranteed to be done
    // so we search for a record in the base data set.
    final LocationSearchQueryInput query =
        LocationSearchQueryInput.builder().withText("Police").build();
    final AnetBeanList_Location searchObjects =
        adminQueryExecutor.locationList(getListFields(FIELDS), query);
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();

    // Update
    created.setName("Down by the Bay");
    final Integer nrUpdated = adminMutationExecutor.updateLocation("", getLocationInput(created));
    assertThat(nrUpdated).isEqualTo(1);
    final Location updated = adminQueryExecutor.location(FIELDS, created.getUuid());
    assertThat(updated.getName()).isEqualTo(created.getName());
  }

  @Test
  public void locationCreateSuperUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    createLocation(getSuperUser());
  }

  @Test
  public void locationCreateRegularUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    createLocation(getRegularUser());
  }

  private void createLocation(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final MutationExecutor userMutationExecutor = getMutationExecutor(user.getDomainUsername());
    final Position position = user.getPosition();
    final boolean isSuperUser = position.getType() == PositionType.SUPER_USER;
    final LocationInput lInput = TestData.createLocationInput("The Boat Dock2", 43.21, -87.65);
    try {
      final Location l = userMutationExecutor.createLocation(FIELDS, lInput);
      if (isSuperUser) {
        assertThat(l).isNotNull();
        assertThat(l.getUuid()).isNotNull();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperUser) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

  @Test
  public void locationUpdateSuperUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    updateLocation(getSuperUser());
  }

  @Test
  public void locationUpdateRegularUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    updateLocation(getRegularUser());
  }

  private void updateLocation(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final QueryExecutor userQueryExecutor = getQueryExecutor(user.getDomainUsername());
    final MutationExecutor userMutationExecutor = getMutationExecutor(user.getDomainUsername());
    final Position position = user.getPosition();
    final boolean isSuperUser = position.getType() == PositionType.SUPER_USER;
    final LocationSearchQueryInput query =
        LocationSearchQueryInput.builder().withText("Police").build();
    final AnetBeanList_Location searchObjects =
        userQueryExecutor.locationList(getListFields(FIELDS), query);
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final Location l = searchObjects.getList().get(0);

    try {
      final Integer nrUpdated = userMutationExecutor.updateLocation("", getLocationInput(l));
      if (isSuperUser) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperUser) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

  @Test
  public void mergeLocationTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create Loser Location
    final LocationInput loserLocation =
        TestData.createLocationInput("The Loser Location", 43.21, -87.65);
    final Location createdLoser = adminMutationExecutor.createLocation(FIELDS, loserLocation);
    assertThat(createdLoser).isNotNull();
    assertThat(createdLoser.getUuid()).isNotNull();
    assertThat(createdLoser.getName()).isEqualTo(loserLocation.getName());

    // Create Winner Location
    final LocationInput winnerLocation =
        TestData.createLocationInput("The Winner Location", 41.11, -85.15);
    final Location createdWinner = adminMutationExecutor.createLocation(FIELDS, winnerLocation);
    assertThat(createdWinner).isNotNull();
    assertThat(createdWinner.getUuid()).isNotNull();
    assertThat(createdWinner.getName()).isEqualTo(winnerLocation.getName());

    final LocationInput mergedLocationInput = getLocationInput(createdWinner);
    final Location mergedLocation =
        adminMutationExecutor.mergeLocations(FIELDS, loserLocation.getUuid(), mergedLocationInput);
    assertThat(mergedLocation).isNotNull();
    assertThat(mergedLocation.getUuid()).isNotNull();

    // Assert that loser is gone.
    try {
      adminQueryExecutor.location(FIELDS, loserLocation.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }
  }

}
