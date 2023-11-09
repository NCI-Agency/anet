package mil.dds.anet.test.resources.merge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.util.List;
import javax.ws.rs.NotFoundException;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.client.AttachmentInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.LocationType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.resources.AttachmentResourceTest;
import org.junit.jupiter.api.Test;

public class LocationMergeTest extends AbstractResourceTest {

  public static final String FIELDS =
      String.format("{ uuid name type description status lat lng customFields attachments %s }",
          AttachmentResourceTest.ATTACHMENT_FIELDS);

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

    // Add an attachment
    final GenericRelatedObjectInput firstLocationAttachment = GenericRelatedObjectInput.builder()
        .withRelatedObjectType("locations").withRelatedObjectUuid(firstLocation.getUuid()).build();
    final AttachmentInput firstLocationAttachmentInput =
        AttachmentInput.builder().withFileName("testFirstLocationAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(firstLocationAttachment)).build();
    final String createdFirstLocationAttachmentUuid =
        adminMutationExecutor.createAttachment("", firstLocationAttachmentInput);
    assertThat(createdFirstLocationAttachmentUuid).isNotNull();

    // Create Winner Location
    final LocationInput secondLocationInput = LocationInput.builder()
        .withName("MergeLocationsTest Second Location").withType(LocationType.POINT_LOCATION)
        .withLat(47.561517).withLng(-52.70876).withStatus(Status.ACTIVE).build();

    final Location secondLocation =
        adminMutationExecutor.createLocation(FIELDS, secondLocationInput);
    assertThat(secondLocation).isNotNull();
    assertThat(secondLocation.getUuid()).isNotNull();

    // Add an attachment
    final GenericRelatedObjectInput secondLocationAttachment = GenericRelatedObjectInput.builder()
        .withRelatedObjectType("locations").withRelatedObjectUuid(secondLocation.getUuid()).build();
    final AttachmentInput secondLocationAttachmentInput =
        AttachmentInput.builder().withFileName("testSecondLocationAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(secondLocationAttachment)).build();
    final String createdSecondLocationAttachmentUuid =
        adminMutationExecutor.createAttachment("", secondLocationAttachmentInput);
    assertThat(createdSecondLocationAttachmentUuid).isNotNull();

    // Merge the two locations
    final LocationInput mergedLocationInput = getLocationInput(firstLocation);
    mergedLocationInput.setStatus(secondLocation.getStatus());
    final int nrUpdated =
        adminMutationExecutor.mergeLocations("", secondLocation.getUuid(), mergedLocationInput);
    assertThat(nrUpdated).isOne();

    // Assert that loser is gone.
    try {
      adminQueryExecutor.location(FIELDS, secondLocation.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }

    // Check that attachments have been merged
    final Location mergedLocation =
        adminQueryExecutor.location(FIELDS, mergedLocationInput.getUuid());
    assertThat(mergedLocation.getAttachments()).hasSize(2);
  }

}
