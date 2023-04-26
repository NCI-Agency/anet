package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.resources.PersonResourceTest.FIELDS;
import static mil.dds.anet.test.resources.PersonResourceTest.PERSON_FIELDS_ONLY_HISTORY;
import static mil.dds.anet.test.resources.PersonResourceTest.POSITION_FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AttachmentInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
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

public class PersonMergeTest extends AbstractResourceTest {

  @Test
  public void testMerge()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a person
    PersonInput loserInput = PersonInput.builder().withName("Loser for Merging").build();
    Person loser = adminMutationExecutor.createPerson(FIELDS, loserInput);
    assertThat(loser).isNotNull();
    assertThat(loser.getUuid()).isNotNull();

    // Create a Position
    final PositionInput testInput = PositionInput.builder()
        .withName("A Test Position created by mergePeopleTest").withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE).build();

    // Assign to an AO
    final Organization ao = adminMutationExecutor.createOrganization("{ uuid }",
        TestData.createAdvisorOrganizationInput(true));
    testInput.setOrganization(getOrganizationInput(ao));
    testInput.setLocation(getLocationInput(getGeneralHospital()));

    final Position created = adminMutationExecutor.createPosition(POSITION_FIELDS, testInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getName()).isEqualTo(testInput.getName());

    // Assign the loser into the position
    Integer nrUpdated =
        adminMutationExecutor.putPersonInPosition("", getPersonInput(loser), created.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    final PositionInput testInput1 = PositionInput.builder().withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withName("Test Position for person history edit  1")
        .withOrganization(getOrganizationInput(ao))
        .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();

    final Position createdPos1 = adminMutationExecutor.createPosition(POSITION_FIELDS, testInput1);
    assertThat(createdPos1).isNotNull();
    assertThat(createdPos1.getUuid()).isNotNull();
    assertThat(createdPos1.getName()).isEqualTo(testInput1.getName());
    final PositionInput posInput1 = PositionInput.builder().withUuid(createdPos1.getUuid()).build();
    final PositionInput testInput2 = PositionInput.builder().withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withName("Test Position for person history edit 2")
        .withOrganization(getOrganizationInput(ao))
        .withLocation(getLocationInput(getGeneralHospital())).withStatus(Status.ACTIVE).build();

    final Position createdPos2 = adminMutationExecutor.createPosition(POSITION_FIELDS, testInput2);
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
        .withRelatedObjectType("people").withRelatedObjectUuid(loser.getUuid()).build();
    final AttachmentInput loserPersonAttachmentInput =
        AttachmentInput.builder().withFileName("testLoserPersonAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(loserPersonAttachment)).build();
    final String createdLoserPersonAttachmentUuid =
        adminMutationExecutor.createAttachment("", loserPersonAttachmentInput);
    assertThat(createdLoserPersonAttachmentUuid).isNotNull();

    // Create a person
    final PersonInput winnerInput = PersonInput.builder().withName("Winner for merging")
        .withStatus(Status.ACTIVE).withPreviousPositions(historyList).withPosition(posInput2)
        // set HTML of biography
        .withBiography(UtilsTest.getCombinedHtmlTestCase().getInput())
        // set JSON of customFields
        .withCustomFields(UtilsTest.getCombinedJsonTestCase().getInput()).withGender("Female")
        .withCountry("Canada").withCode("1234568")
        .withEndOfTourDate(
            ZonedDateTime.of(2020, 4, 1, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant())
        .build();

    final Person winner = adminMutationExecutor.createPerson(FIELDS, winnerInput);
    assertThat(winner).isNotNull();
    assertThat(winner.getUuid()).isNotNull();

    // Add an attachment
    final GenericRelatedObjectInput winnerPersonAttachment = GenericRelatedObjectInput.builder()
        .withRelatedObjectType("people").withRelatedObjectUuid(winner.getUuid()).build();
    final AttachmentInput winnerPersonAttachmentInput =
        AttachmentInput.builder().withFileName("testLoserPersonAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(winnerPersonAttachment)).build();
    final String createdWinnerPersonAttachmentUuid =
        adminMutationExecutor.createAttachment("", winnerPersonAttachmentInput);
    assertThat(createdWinnerPersonAttachmentUuid).isNotNull();

    // Merge the two persons
    winnerInput.setUuid(winner.getUuid());
    nrUpdated = adminMutationExecutor.mergePeople("", loser.getUuid(), winnerInput);
    assertThat(nrUpdated).isOne();

    // Assert that loser is gone.
    try {
      adminQueryExecutor.person(FIELDS, loser.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }

    // Check that attachments have been merged
    final Person mergedPerson = adminQueryExecutor.person(FIELDS, winnerInput.getUuid());
    assertThat(mergedPerson.getAttachments()).hasSize(2);

    // Assert that the position is empty.
    Position winnerPos = adminQueryExecutor.position(POSITION_FIELDS, created.getUuid());
    assertThat(winnerPos.getPerson()).isNull();

    // Re-create loser and put into the position.
    loserInput = PersonInput.builder().withName("Loser for Merging").build();
    loser = adminMutationExecutor.createPerson(FIELDS, loserInput);
    assertThat(loser).isNotNull();
    assertThat(loser.getUuid()).isNotNull();

    nrUpdated =
        adminMutationExecutor.putPersonInPosition("", getPersonInput(loser), created.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    nrUpdated = adminMutationExecutor.mergePeople("", loser.getUuid(), winnerInput);
    assertThat(nrUpdated).isEqualTo(1);

    // Assert that loser is gone.
    try {
      adminQueryExecutor.person(FIELDS, loser.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }

    // Assert that the winner is in the position.
    winnerPos = adminQueryExecutor.position(POSITION_FIELDS, createdPos2.getUuid());
    assertThat(winnerPos.getPerson().getUuid()).isEqualTo(winner.getUuid());
  }

  @Test
  public void testMergeNoHistory()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a person
    final PersonInput loserInput = PersonInput.builder().withName("Loser for Merging").build();
    final Person loser = adminMutationExecutor.createPerson(FIELDS, loserInput);
    assertThat(loser).isNotNull();
    assertThat(loser.getUuid()).isNotNull();

    final PersonInput winnerInput = PersonInput.builder().withName("Winner for merging")
        .withStatus(Status.ACTIVE)
        // set HTML of biography
        .withBiography(UtilsTest.getCombinedHtmlTestCase().getInput())
        // set JSON of customFields
        .withCustomFields(UtilsTest.getCombinedJsonTestCase().getInput()).withGender("Female")
        .withCountry("Canada").withCode("1234568")
        .withEndOfTourDate(
            ZonedDateTime.of(2020, 4, 1, 0, 0, 0, 0, DaoUtils.getServerNativeZoneId()).toInstant())
        .build();

    Person winner = adminMutationExecutor.createPerson(FIELDS, winnerInput);
    assertThat(winner).isNotNull();
    assertThat(winner.getUuid()).isNotNull();
    winnerInput.setUuid(winner.getUuid());
    final Integer nrUpdated = adminMutationExecutor.mergePeople("", loser.getUuid(), winnerInput);
    assertThat(nrUpdated).isEqualTo(1);

    // Assert that loser is gone.
    try {
      adminQueryExecutor.person(FIELDS, loser.getUuid());
      fail("Expected NotFoundException");
    } catch (NotFoundException expectedException) {
    }

    // Assert that the winner has no position and no history
    winner = adminQueryExecutor.person(FIELDS, winner.getUuid());
    assertThat(winner.getPosition()).isNull();
    assertThat(winner.getPreviousPositions()).isNullOrEmpty();
  }

  @Test
  public void testMergeSame()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    try {
      adminMutationExecutor.mergePeople("", admin.getUuid(), getPersonInput(admin));
      fail("Expected a WebApplicationException");
    } catch (WebApplicationException expectedException) {
    }
  }

  @Test
  public void testMergeUnknownWinner()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    try {
      final PersonInput winner = getPersonInput(admin);
      winner.setUuid(UUID.randomUUID().toString());
      adminMutationExecutor.mergePeople("", admin.getUuid(), winner);
      fail("Expected a WebApplicationException");
    } catch (WebApplicationException expectedException) {
    }
  }

  @Test
  public void testMergeUnknownLoser()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    try {
      adminMutationExecutor.mergePeople("", UUID.randomUUID().toString(), getPersonInput(admin));
      fail("Expected a WebApplicationException");
    } catch (WebApplicationException expectedException) {
    }
  }

  @Test
  public void testMergeDifferentRoles()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    PersonInput interlocutorInput =
        PersonInput.builder().withName("Interlocutor for Merging").build();
    Person interlocutor = adminMutationExecutor.createPerson(FIELDS, interlocutorInput);
    assertThat(interlocutor).isNotNull();
    assertThat(interlocutor.getUuid()).isNotNull();

    // Create a Position
    final PositionInput testInput =
        PositionInput.builder().withName("A Test Position created by mergeDifferentRolesTest")
            .withType(PositionType.REGULAR).withRole(PositionRole.MEMBER).withStatus(Status.ACTIVE)
            .build();

    // Assign to an AO
    final Organization ao = adminMutationExecutor.createOrganization("{ uuid }",
        TestData.createAdvisorOrganizationInput(true));
    testInput.setOrganization(getOrganizationInput(ao));
    testInput.setLocation(getLocationInput(getGeneralHospital()));

    final Position created = adminMutationExecutor.createPosition(POSITION_FIELDS, testInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getName()).isEqualTo(testInput.getName());

    // Assign the loser into the position
    Integer nrUpdated = adminMutationExecutor.putPersonInPosition("", getPersonInput(interlocutor),
        created.getUuid());
    assertThat(nrUpdated).isEqualTo(1);

    nrUpdated =
        adminMutationExecutor.mergePeople("", interlocutor.getUuid(), getPersonInput(admin));
    assertThat(nrUpdated).isEqualTo(1);
  }

  @Test
  public void testMergeOccupiedPosition()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    try {
      final Person occupiedPerson =
          adminQueryExecutor.person(PERSON_FIELDS_ONLY_HISTORY, getElizabethElizawell().getUuid());
      final Optional<PersonPositionHistory> opt = occupiedPerson.getPreviousPositions().stream()
          .filter(pph -> pph.getEndTime() == null).findAny();
      final PersonInput winner = getPersonInput(getRegularUser());
      winner.setPreviousPositions(
          getPersonPositionHistoryInput(occupiedPerson.getPreviousPositions()));
      winner.setPosition(
          opt.map(personPositionHistory -> getPositionInput(personPositionHistory.getPosition()))
              .orElse(null));
      adminMutationExecutor.mergePeople("", admin.getUuid(), winner);
      fail("Expected a WebApplicationException");
    } catch (WebApplicationException expectedException) {
    }
  }

}
