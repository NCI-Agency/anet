package mil.dds.anet.test.resources.merge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.util.List;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.client.AttachmentInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.LocationType;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonInput;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.resources.AttachmentResourceTest;
import org.junit.jupiter.api.Test;

public class LocationMergeTest extends AbstractResourceTest {

  public static final String FIELDS = String.format(
      "{ uuid name type digram trigram description status lat lng customFields attachments %s }",
      AttachmentResourceTest.ATTACHMENT_FIELDS);
  private static final String PERSON_FIELDS = String.format("{ uuid country %s }", FIELDS);

  @Test
  void testMerge() {
    // Create winner Location
    final LocationInput firstLocationInput =
        LocationInput.builder().withName("MergeLocationsTest First Location")
            .withType(LocationType.COUNTRY).withDigram("FL").withTrigram("FLT").withLat(47.613442)
            .withLng(-52.740936).withStatus(Status.ACTIVE).build();

    final Location firstLocation = withCredentials(adminUser,
        t -> mutationExecutor.createLocation(FIELDS, firstLocationInput));
    assertThat(firstLocation).isNotNull();
    assertThat(firstLocation.getUuid()).isNotNull();

    // Add an attachment
    final GenericRelatedObjectInput firstLocationAttachment = GenericRelatedObjectInput.builder()
        .withRelatedObjectType("locations").withRelatedObjectUuid(firstLocation.getUuid()).build();
    final AttachmentInput firstLocationAttachmentInput =
        AttachmentInput.builder().withFileName("testFirstLocationAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(firstLocationAttachment)).build();
    final String createdFirstLocationAttachmentUuid = withCredentials(adminUser,
        t -> mutationExecutor.createAttachment("", firstLocationAttachmentInput));
    assertThat(createdFirstLocationAttachmentUuid).isNotNull();

    // Create loser Location
    final LocationInput secondLocationInput =
        LocationInput.builder().withName("MergeLocationsTest Second Location")
            .withType(LocationType.COUNTRY).withDigram("SL").withTrigram("SLT").withLat(47.561517)
            .withLng(-52.70876).withStatus(Status.ACTIVE).build();

    final Location secondLocation = withCredentials(adminUser,
        t -> mutationExecutor.createLocation(FIELDS, secondLocationInput));
    assertThat(secondLocation).isNotNull();
    assertThat(secondLocation.getUuid()).isNotNull();

    // Create a person
    final PersonInput testPersonInput =
        PersonInput.builder().withName("Test person for location merge")
            .withCountry(getLocationInput(secondLocation)).build();
    final Person testPerson = withCredentials(adminUser,
        t -> mutationExecutor.createPerson(PERSON_FIELDS, testPersonInput));
    assertThat(testPerson).isNotNull();
    assertThat(testPerson.getUuid()).isNotNull();

    // Add an attachment
    final GenericRelatedObjectInput secondLocationAttachment = GenericRelatedObjectInput.builder()
        .withRelatedObjectType("locations").withRelatedObjectUuid(secondLocation.getUuid()).build();
    final AttachmentInput secondLocationAttachmentInput =
        AttachmentInput.builder().withFileName("testSecondLocationAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(secondLocationAttachment)).build();
    final String createdSecondLocationAttachmentUuid = withCredentials(adminUser,
        t -> mutationExecutor.createAttachment("", secondLocationAttachmentInput));
    assertThat(createdSecondLocationAttachmentUuid).isNotNull();

    // Merge the two locations
    final LocationInput mergedLocationInput = getLocationInput(firstLocation);
    mergedLocationInput.setStatus(secondLocation.getStatus());
    final int nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.mergeLocations("", secondLocation.getUuid(), mergedLocationInput));
    assertThat(nrUpdated).isOne();

    // Assert that loser is gone.
    try {
      withCredentials(adminUser, t -> queryExecutor.location(FIELDS, secondLocation.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Check that attachments have been merged
    final Location mergedLocation = withCredentials(adminUser,
        t -> queryExecutor.location(FIELDS, mergedLocationInput.getUuid()));
    assertThat(mergedLocation.getAttachments()).hasSize(2);

    // Check that test person's country has been updated
    final Person testPersonMerged =
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, testPerson.getUuid()));
    assertThat(testPersonMerged).isNotNull();
    assertThat(testPersonMerged.getCountry()).isNotNull();
    assertThat(testPersonMerged.getCountry().getUuid()).isEqualTo(mergedLocation.getUuid());
    assertThat(testPersonMerged.getCountry().getName()).isEqualTo(mergedLocation.getName());
    assertThat(testPersonMerged.getCountry().getDigram()).isEqualTo(mergedLocation.getDigram());
    assertThat(testPersonMerged.getCountry().getTrigram()).isEqualTo(mergedLocation.getTrigram());
  }

}
