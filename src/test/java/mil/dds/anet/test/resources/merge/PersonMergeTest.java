package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.resources.PersonResourceTest.FIELDS;
import static mil.dds.anet.test.resources.PersonResourceTest.PERSON_FIELDS_ONLY_HISTORY;
import static mil.dds.anet.test.resources.PersonResourceTest.POSITION_FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Location;
import mil.dds.anet.test.client.AttachmentInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationSearchQueryInput;
import mil.dds.anet.test.client.LocationType;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonInput;
import mil.dds.anet.test.client.PersonPositionHistory;
import mil.dds.anet.test.client.PersonPositionHistoryInput;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.utils.UtilsTest;
import mil.dds.anet.utils.DaoUtils;
import org.junit.jupiter.api.Test;

class PersonMergeTest extends AbstractResourceTest {

  @Test
  void testMerge() {
    final LocationSearchQueryInput lsq =
        LocationSearchQueryInput.builder().withType(LocationType.COUNTRY).withPageSize(2).build();
    final AnetBeanList_Location locationList = withCredentials(adminUser,
        t -> queryExecutor.locationList(getListFields("{ uuid name }"), lsq));
    assertThat(locationList).isNotNull();
    assertThat(locationList.getList()).hasSize(2);
    final Location loserCountry = locationList.getList().get(0);
    final Location winnerCountry = locationList.getList().get(0);

    // Create a person
    final PersonInput loserInput1 = PersonInput.builder().withName("Loser for Merging")
        .withCountry(getLocationInput(loserCountry)).build();
    final Person loser1 =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(FIELDS, loserInput1));
    assertThat(loser1).isNotNull();
    assertThat(loser1.getUuid()).isNotNull();

    // Create a Position
    final PositionInput testInput = PositionInput.builder()
        .withName("A Test Position created by mergePeopleTest").withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();

    // Assign to an AO
    final Organization ao = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization("{ uuid }", TestData.createAdvisorOrganizationInput(true)));
    testInput.setOrganization(getOrganizationInput(ao));
    testInput.setLocation(getLocationInput(getGeneralHospital()));

    final Position created = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, testInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getName()).isEqualTo(testInput.getName());

    // Assign the loser into the position
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.putPersonInPosition("", getPersonInput(loser1), created.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    final PositionInput testInput1 = PositionInput.builder().withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withName("Test Position for person history edit  1")
        .withOrganization(getOrganizationInput(ao))
        .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();

    final Position createdPos1 = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, testInput1));
    assertThat(createdPos1).isNotNull();
    assertThat(createdPos1.getUuid()).isNotNull();
    assertThat(createdPos1.getName()).isEqualTo(testInput1.getName());
    final PositionInput posInput1 = PositionInput.builder().withUuid(createdPos1.getUuid()).build();
    final PositionInput testInput2 = PositionInput.builder().withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withName("Test Position for person history edit 2")
        .withOrganization(getOrganizationInput(ao))
        .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();

    final Position createdPos2 = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, testInput2));
    assertThat(createdPos2).isNotNull();
    assertThat(createdPos2.getUuid()).isNotNull();
    assertThat(createdPos2.getName()).isEqualTo(testInput2.getName());
    final PositionInput posInput2 = PositionInput.builder().withUuid(createdPos2.getUuid()).build();
    final PersonPositionHistoryInput hist1 = PersonPositionHistoryInput.builder()
        .withCreatedAt(Instant.now().minus(100, ChronoUnit.DAYS))
        .withStartTime(Instant.now().minus(100, ChronoUnit.DAYS))
        .withEndTime(Instant.now().minus(50, ChronoUnit.DAYS)).withPosition(posInput1).build();
    final PersonPositionHistoryInput hist2 =
        PersonPositionHistoryInput.builder().withCreatedAt(Instant.now().minus(49, ChronoUnit.DAYS))
            .withStartTime(Instant.now().minus(49, ChronoUnit.DAYS)).withEndTime(null)
            .withPosition(posInput2).build();

    final List<PersonPositionHistoryInput> historyList = new ArrayList<>();
    historyList.add(hist1);
    historyList.add(hist2);

    // Add an attachment
    final GenericRelatedObjectInput loserPersonAttachment = GenericRelatedObjectInput.builder()
        .withRelatedObjectType("people").withRelatedObjectUuid(loser1.getUuid()).build();
    final AttachmentInput loserPersonAttachmentInput =
        AttachmentInput.builder().withFileName("testLoserPersonAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(loserPersonAttachment)).build();
    final String createdLoserPersonAttachmentUuid = withCredentials(adminUser,
        t -> mutationExecutor.createAttachment("", loserPersonAttachmentInput));
    assertThat(createdLoserPersonAttachmentUuid).isNotNull();

    // Create a person
    final PersonInput winnerInput = PersonInput.builder().withName("Winner for merging")
        .withStatus(Status.ACTIVE).withPreviousPositions(historyList).withPosition(posInput2)
        // set HTML of biography
        .withBiography(UtilsTest.getCombinedHtmlTestCase().getInput())
        // set JSON of customFields
        .withCustomFields(UtilsTest.getCombinedJsonTestCase().getInput()).withGender("Female")
        .withCountry(getLocationInput(winnerCountry)).withCode("1234568")
        .withEndOfTourDate(
            ZonedDateTime.of(2020, 4, 1, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant())
        .build();

    final Person winner =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(FIELDS, winnerInput));
    assertThat(winner).isNotNull();
    assertThat(winner.getUuid()).isNotNull();

    // Add an attachment
    final GenericRelatedObjectInput winnerPersonAttachment = GenericRelatedObjectInput.builder()
        .withRelatedObjectType("people").withRelatedObjectUuid(winner.getUuid()).build();
    final AttachmentInput winnerPersonAttachmentInput =
        AttachmentInput.builder().withFileName("testLoserPersonAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(winnerPersonAttachment)).build();
    final String createdWinnerPersonAttachmentUuid = withCredentials(adminUser,
        t -> mutationExecutor.createAttachment("", winnerPersonAttachmentInput));
    assertThat(createdWinnerPersonAttachmentUuid).isNotNull();

    // Merge the two persons
    winnerInput.setUuid(winner.getUuid());
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.mergePeople("", loser1.getUuid(), winnerInput));
    assertThat(nrUpdated).isOne();

    // Assert that loser is gone.
    try {
      withCredentials(adminUser, t -> queryExecutor.person(FIELDS, loser1.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Check that attachments have been merged
    final Person mergedPerson =
        withCredentials(adminUser, t -> queryExecutor.person(FIELDS, winnerInput.getUuid()));
    assertThat(mergedPerson.getAttachments()).hasSize(2);

    // Assert that the position is empty.
    Position winnerPos =
        withCredentials(adminUser, t -> queryExecutor.position(POSITION_FIELDS, created.getUuid()));
    assertThat(winnerPos.getPerson()).isNull();

    // Assert that winner has correct country
    assertThat(mergedPerson.getCountry()).isNotNull();
    assertThat(mergedPerson.getCountry().getUuid()).isEqualTo(winnerCountry.getUuid());
    assertThat(mergedPerson.getCountry().getName()).isEqualTo(winnerCountry.getName());

    // Re-create loser and put into the position.
    final PersonInput loserInput2 = PersonInput.builder().withName("Loser for Merging").build();
    final Person loser2 =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(FIELDS, loserInput2));
    assertThat(loser2).isNotNull();
    assertThat(loser2.getUuid()).isNotNull();

    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.putPersonInPosition("", getPersonInput(loser2), created.getUuid()));
    assertThat(nrUpdated).isEqualTo(1);

    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.mergePeople("", loser2.getUuid(), winnerInput));
    assertThat(nrUpdated).isEqualTo(1);

    // Assert that loser is gone.
    try {
      withCredentials(adminUser, t -> queryExecutor.person(FIELDS, loser2.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Assert that the winner is in the position.
    winnerPos = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, createdPos2.getUuid()));
    assertThat(winnerPos.getPerson().getUuid()).isEqualTo(winner.getUuid());
  }

  @Test
  void testMergeNoHistory() {
    // Create a person
    final PersonInput loserInput = PersonInput.builder().withName("Loser for Merging").build();
    final Person loser =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(FIELDS, loserInput));
    assertThat(loser).isNotNull();
    assertThat(loser.getUuid()).isNotNull();

    final PersonInput winnerInput = PersonInput.builder().withName("Winner for merging")
        .withStatus(Status.ACTIVE)
        // set HTML of biography
        .withBiography(UtilsTest.getCombinedHtmlTestCase().getInput())
        // set JSON of customFields
        .withCustomFields(UtilsTest.getCombinedJsonTestCase().getInput()).withGender("Female")
        .withCode("1234568")
        .withEndOfTourDate(
            ZonedDateTime.of(2020, 4, 1, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant())
        .build();

    final Person winner1 =
        withCredentials(adminUser, t -> mutationExecutor.createPerson(FIELDS, winnerInput));
    assertThat(winner1).isNotNull();
    assertThat(winner1.getUuid()).isNotNull();
    winnerInput.setUuid(winner1.getUuid());
    final Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.mergePeople("", loser.getUuid(), winnerInput));
    assertThat(nrUpdated).isEqualTo(1);

    // Assert that loser is gone.
    try {
      withCredentials(adminUser, t -> queryExecutor.person(FIELDS, loser.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Assert that the winner has no position and no history
    final Person winner2 =
        withCredentials(adminUser, t -> queryExecutor.person(FIELDS, winner1.getUuid()));
    assertThat(winner2.getPosition()).isNull();
    assertThat(winner2.getPreviousPositions()).isNullOrEmpty();
  }

  @Test
  void testMergeSame() {
    try {
      withCredentials(adminUser,
          t -> mutationExecutor.mergePeople("", admin.getUuid(), getPersonInput(admin)));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void testMergeUnknownWinner() {
    try {
      final PersonInput winner = getPersonInput(admin);
      winner.setUuid(UUID.randomUUID().toString());
      withCredentials(adminUser, t -> mutationExecutor.mergePeople("", admin.getUuid(), winner));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void testMergeUnknownLoser() {
    try {
      withCredentials(adminUser, t -> mutationExecutor.mergePeople("", UUID.randomUUID().toString(),
          getPersonInput(admin)));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void testMergeOccupiedPosition() {
    try {
      final String elizabethUuid = getElizabethElizawell().getUuid();
      final Person occupiedPerson = withCredentials(adminUser,
          t -> queryExecutor.person(PERSON_FIELDS_ONLY_HISTORY, elizabethUuid));
      final Optional<PersonPositionHistory> opt = occupiedPerson.getPreviousPositions().stream()
          .filter(pph -> pph.getEndTime() == null).findAny();
      final PersonInput winner = getPersonInput(getRegularUser());
      winner.setPreviousPositions(
          getPersonPositionHistoryInput(occupiedPerson.getPreviousPositions()));
      winner.setPosition(
          opt.map(personPositionHistory -> getPositionInput(personPositionHistory.getPosition()))
              .orElse(null));
      withCredentials(adminUser, t -> mutationExecutor.mergePeople("", admin.getUuid(), winner));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

}
