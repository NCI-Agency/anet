package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.resources.PositionResourceTest.FIELDS;
import static mil.dds.anet.test.resources.PositionResourceTest.ORGANIZATION_FIELDS;
import static mil.dds.anet.test.resources.PositionResourceTest.PERSON_FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.AttachmentInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonInput;
import mil.dds.anet.test.client.PersonPositionHistoryInput;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.resources.PositionResourceTest;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class PositionMergeTest extends AbstractResourceTest {

  @ParameterizedTest
  @MethodSource("provideMergeTestParameters")
  void testMerge(boolean subscribeToLoser, boolean subscribeToWinner) {
    final String objectType = PositionDao.TABLE_NAME;

    // Create a new position and designate the person upfront
    final PersonInput testPersonInput = PersonInput.builder().withName("MergePositionsTest Person")
        .withStatus(Status.ACTIVE).build();

    final Person testPerson = withCredentials(adminUser,
        t -> mutationExecutor.createPerson(PERSON_FIELDS, testPersonInput));
    assertThat(testPerson).isNotNull();
    assertThat(testPerson.getUuid()).isNotNull();

    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("Ministry").build();
    final AnetBeanList_Organization orgs = withCredentials(adminUser,
        t -> queryExecutor.organizationList(getListFields(ORGANIZATION_FIELDS), queryOrgs));
    assertThat(orgs.getList()).isNotEmpty();

    final PositionInput firstPositionInput = PositionInput.builder()
        .withName("MergePositionsTest First Position").withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withStatus(Status.ACTIVE).withPerson(getPersonInput(testPerson)).build();

    final Position firstPosition = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(FIELDS, firstPositionInput));
    assertThat(firstPosition).isNotNull();
    assertThat(firstPosition.getUuid()).isNotNull();
    final Position updatedFirstPosition =
        withCredentials(adminUser, t -> queryExecutor.position(FIELDS, firstPosition.getUuid()));

    // Add an attachment
    final GenericRelatedObjectInput loserPositionAttachment = GenericRelatedObjectInput.builder()
        .withRelatedObjectType(objectType).withRelatedObjectUuid(firstPosition.getUuid()).build();
    final AttachmentInput loserPositionAttachmentInput =
        AttachmentInput.builder().withFileName("testLoserPositionAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(loserPositionAttachment)).build();
    final String createdLoserPositionAttachmentUuid = withCredentials(adminUser,
        t -> mutationExecutor.createAttachment("", loserPositionAttachmentInput));
    assertThat(createdLoserPositionAttachmentUuid).isNotNull();

    // Subscribe to the position
    final String winnerSubscriptionUuid = addSubscription(subscribeToWinner, objectType,
        firstPosition.getUuid(),
        t -> mutationExecutor.updatePosition("", false, getPositionInput(updatedFirstPosition)));

    final PositionInput secondPositionInput = PositionInput.builder()
        .withName("MergePositionsTest Second Position").withType(PositionType.REGULAR)
        .withRole(PositionRole.MEMBER).withOrganization(getOrganizationInput(orgs.getList().get(0)))
        .withStatus(Status.ACTIVE).build();

    final Position secondPosition = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(FIELDS, secondPositionInput));
    assertThat(secondPosition).isNotNull();
    assertThat(secondPosition.getUuid()).isNotNull();

    // Add an attachment
    final GenericRelatedObjectInput winnerPositionAttachment = GenericRelatedObjectInput.builder()
        .withRelatedObjectType(objectType).withRelatedObjectUuid(secondPosition.getUuid()).build();
    final AttachmentInput winnerPositionAttachmentInput =
        AttachmentInput.builder().withFileName("testLoserPositionAttachment.jpg")
            .withMimeType(AttachmentResource.getAllowedMimeTypes().get(0))
            .withAttachmentRelatedObjects(List.of(winnerPositionAttachment)).build();
    final String createdWinnerPositionAttachmentUuid = withCredentials(adminUser,
        t -> mutationExecutor.createAttachment("", winnerPositionAttachmentInput));
    assertThat(createdWinnerPositionAttachmentUuid).isNotNull();

    // Subscribe to the position
    final String loserSubscriptionUuid =
        addSubscription(subscribeToLoser, objectType, secondPosition.getUuid(),
            t -> mutationExecutor.updatePosition("", false, getPositionInput(secondPosition)));

    final PersonPositionHistoryInput hist =
        PersonPositionHistoryInput.builder().withCreatedAt(Instant.now().minus(49, ChronoUnit.DAYS))
            .withStartTime(Instant.now().minus(49, ChronoUnit.DAYS)).withEndTime(null)
            .withPrimary(true).withPerson(getPersonInput(testPerson))
            .withPosition(getPositionInput(secondPosition)).build();

    final List<PersonPositionHistoryInput> historyList = new ArrayList<>();
    historyList.add(hist);
    final PositionInput mergedPositionInput = getPositionInput(firstPosition);
    mergedPositionInput.setPreviousPeople(historyList);
    mergedPositionInput.setPerson(getPersonInput(testPerson));
    mergedPositionInput.setStatus(secondPosition.getStatus());
    mergedPositionInput.setType(secondPosition.getType());

    // Merge the two positions
    final int nrUpdated = withCredentials(adminUser, t -> mutationExecutor.mergePositions("",
        secondPosition.getUuid(), false, mergedPositionInput));
    assertThat(nrUpdated).isOne();

    // Assert that loser is gone.
    try {
      withCredentials(adminUser, t -> queryExecutor.position(FIELDS, secondPosition.getUuid()));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Check that attachments have been merged
    final Position mergedPosition = withCredentials(adminUser,
        t -> queryExecutor.position(PositionResourceTest.FIELDS, mergedPositionInput.getUuid()));
    assertThat(mergedPosition.getAttachments()).hasSize(2);

    // Check the subscriptions and updates
    checkSubscriptionsAndUpdatesAfterMerge(subscribeToLoser || subscribeToWinner, objectType,
        secondPosition.getUuid(), firstPosition.getUuid());
    // And unsubscribe
    deleteSubscription(subscribeToWinner, loserSubscriptionUuid);
    deleteSubscription(false, winnerSubscriptionUuid);
  }

}
