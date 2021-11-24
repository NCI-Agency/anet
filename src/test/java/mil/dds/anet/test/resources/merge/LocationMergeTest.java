package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.resources.LocationResourceTest.FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import javax.ws.rs.NotFoundException;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.LocationType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.resources.AbstractResourceTest;
import org.junit.jupiter.api.Test;

public class LocationMergeTest extends AbstractResourceTest {

  @Test
  public void testMerge()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create Loser Location
    final LocationInput firstLocationInput = LocationInput.builder()
        .withName("MergeLocationsTest First Location").withType(LocationType.POINT_LOCATION)
        .withLat(47.613442).withLng(-52.740936).withStatus(Status.ACTIVE).build();

    final Location firstLocation = adminMutationExecutor.createLocation(FIELDS, firstLocationInput);
    assertThat(firstLocation).isNotNull();
    assertThat(firstLocation.getUuid()).isNotNull();

    // Create Winner Location
    final LocationInput secondLocationInput = LocationInput.builder()
        .withName("MergeLocationsTest Second Location").withType(LocationType.POINT_LOCATION)
        .withLat(47.561517).withLng(-52.70876).withStatus(Status.ACTIVE).build();

    final Location secondLocation =
        adminMutationExecutor.createLocation(FIELDS, secondLocationInput);
    assertThat(secondLocation).isNotNull();
    assertThat(secondLocation.getUuid()).isNotNull();

    final LocationInput mergedLocationInput = getLocationInput(firstLocation);
    mergedLocationInput.setStatus(secondLocation.getStatus());

    final Location mergedLocation =
        adminMutationExecutor.mergeLocations(FIELDS, secondLocation.getUuid(), mergedLocationInput);
    assertThat(mergedLocation).isNotNull();
    assertThat(mergedLocation.getUuid()).isNotNull();

    // Assert that loser is gone.
    try {
      adminQueryExecutor.location(FIELDS, secondLocation.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }
  }

}
