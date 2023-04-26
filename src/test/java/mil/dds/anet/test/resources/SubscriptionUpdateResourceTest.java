package mil.dds.anet.test.resources;

import static mil.dds.anet.test.resources.SubscriptionResourceTest.SUBSCRIPTION_TESTS;
import static mil.dds.anet.test.resources.SubscriptionResourceTest.adminSubscriberUuid;
import static mil.dds.anet.test.resources.SubscriptionResourceTest.createSubscription;
import static mil.dds.anet.test.resources.SubscriptionResourceTest.deleteSubscription;
import static mil.dds.anet.test.resources.SubscriptionResourceTest.getSubscribedObjectUuid;
import static org.assertj.core.api.Assertions.assertThat;

import com.google.common.collect.Lists;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.client.AnetBeanList_SubscriptionUpdate;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.Note;
import mil.dds.anet.test.client.NoteInput;
import mil.dds.anet.test.client.NoteType;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.ReportCancelledReason;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportState;
import mil.dds.anet.test.client.Subscription;
import mil.dds.anet.test.client.SubscriptionUpdate;
import mil.dds.anet.test.client.SubscriptionUpdateSearchQueryInput;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.util.QueryExecutor;
import org.junit.jupiter.api.Test;

public class SubscriptionUpdateResourceTest extends AbstractResourceTest {

  protected static final String FIELDS =
      "{ createdAt isNote updatedObjectType updatedObjectUuid updatedObject {"
          + " ... on Location { uuid } ... on Organization { uuid }"
          + " ... on Person { uuid } ... on Position { uuid }"
          + " ... on Report { uuid } ... on Task { uuid } } subscription "
          + SubscriptionResourceTest.FIELDS + " }";

  @SuppressWarnings("serial")
  private static final Map<String, Consumer<String>> UPDATERS =
      new HashMap<String, Consumer<String>>() {
        {
          put(LocationDao.TABLE_NAME, SubscriptionUpdateResourceTest::updateLocation);
          put(OrganizationDao.TABLE_NAME, SubscriptionUpdateResourceTest::updateOrganization);
          put(PersonDao.TABLE_NAME, SubscriptionUpdateResourceTest::updatePerson);
          put(PositionDao.TABLE_NAME, SubscriptionUpdateResourceTest::updatePosition);
          put(ReportDao.TABLE_NAME, SubscriptionUpdateResourceTest::updateReport);
          put(TaskDao.TABLE_NAME, SubscriptionUpdateResourceTest::updateTask);
        }
      };

  @Test
  public void testSubscriptionUpdate() {
    // Create a report using the objects we are going to subscribe to
    final String reportUuid = createReport();
    // Subscribe jack to all object types, where for report we use the one we just created
    final Map<String, Subscription> subscriptions = SUBSCRIPTION_TESTS.entrySet().stream()
        .collect(Collectors.toMap(testCase -> testCase.getKey(),
            testCase -> createTestSubscription(testCase.getKey(), testCase.getValue(),
                reportUuid)));

    // Check jack's subscription updates
    final AnetBeanList_SubscriptionUpdate jackSubscriptionUpdates =
        getAllSubscriptionUpdates(jackQueryExecutor);
    assertThat(jackSubscriptionUpdates.getList()).noneMatch(su -> subscriptions.values().stream()
        .filter(s -> s.getUuid().equals(su.getSubscription().getUuid())).findAny().isPresent());

    // Update each subscribed object
    for (final Map.Entry<String, Subscription> e : subscriptions.entrySet()) {
      final Instant beforeUpdate = Instant.now();
      final String subscribedObjectType = e.getKey();
      final Subscription subscription = e.getValue();
      UPDATERS.get(subscribedObjectType).accept(subscription.getSubscribedObjectUuid());
      // Check jack's subscription updates
      if (ReportDao.TABLE_NAME.equals(subscribedObjectType)) {
        checkReportSubscriptionUpdates(subscriptions, beforeUpdate);
      } else {
        checkOtherSubscriptionUpdates(subscriptions, beforeUpdate, subscription.getUuid());
      }
    }

    // Delete jack's subscriptions
    subscriptions.values().stream().forEach(
        subscription -> deleteSubscription(jackMutationExecutor, subscription.getUuid(), false));

    // Delete the report
    deleteReport(reportUuid);
  }

  @Test
  public void testSubscriptionUpdateWithNote() {
    // Create a report using the objects we are going to subscribe to
    final String reportUuid = createReport();
    // Subscribe jack to all object types, where for report we use the one we just created
    final Map<String, Subscription> subscriptions = SUBSCRIPTION_TESTS.entrySet().stream()
        .collect(Collectors.toMap(testCase -> testCase.getKey(),
            testCase -> createTestSubscription(testCase.getKey(), testCase.getValue(),
                reportUuid)));

    // Check jack's subscription updates
    final AnetBeanList_SubscriptionUpdate jackSubscriptionUpdates =
        getAllSubscriptionUpdates(jackQueryExecutor);
    assertThat(jackSubscriptionUpdates.getList()).noneMatch(su -> subscriptions.values().stream()
        .filter(s -> s.getUuid().equals(su.getSubscription().getUuid())).findAny().isPresent());

    // Add a note to each subscribed object
    final List<Note> notes = new ArrayList<>();
    for (final Map.Entry<String, Subscription> e : subscriptions.entrySet()) {
      final Instant beforeUpdate = Instant.now();
      final String subscribedObjectType = e.getKey();
      final Subscription subscription = e.getValue();
      notes.add(createNote(subscribedObjectType, subscription.getSubscribedObjectUuid()));
      // Check jack's subscription updates
      checkOtherSubscriptionUpdates(subscriptions, beforeUpdate, subscription.getUuid());
    }

    // Delete jack's subscriptions
    subscriptions.values().stream().forEach(
        subscription -> deleteSubscription(jackMutationExecutor, subscription.getUuid(), false));

    // Delete the notes
    notes.stream().forEach(note -> deleteNote(note));

    // Delete the report
    deleteReport(reportUuid);
  }

  // helper methods

  protected static AnetBeanList_SubscriptionUpdate getAllSubscriptionUpdates(
      final QueryExecutor queryExecutor) {
    try {
      final SubscriptionUpdateSearchQueryInput susqi =
          SubscriptionUpdateSearchQueryInput.builder().withPageSize(0).build();
      return queryExecutor.mySubscriptionUpdates(getListFields(FIELDS), susqi);
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private Subscription createTestSubscription(final String subscribedObjectType,
      final String subscribedObjectUuid, final String reportUuid) {
    return createSubscription(jackMutationExecutor, subscribedObjectType,
        ReportDao.TABLE_NAME.equals(subscribedObjectType) ? reportUuid : subscribedObjectUuid,
        adminSubscriberUuid, false, false);
  }

  private void checkReportSubscriptionUpdates(final Map<String, Subscription> subscriptions,
      final Instant beforeUpdate) {
    // When updating a CANCELLED report (or PUBLISHED, but we're not testing that here),
    // these subscriptions should get an update:
    // * to the report itself
    // * to the report's people
    // * to the report's people's positions
    // * to the report's advisorOrg (and interlocutorOrg, but we're not testing that here)
    // * to the report's tasks
    // * to the report's location
    final AnetBeanList_SubscriptionUpdate jackSubscriptionUpdates2 =
        getAllSubscriptionUpdates(jackQueryExecutor);
    final List<SubscriptionUpdate> newUpdates = jackSubscriptionUpdates2.getList().stream()
        .filter(su -> su.getCreatedAt().isAfter(beforeUpdate)).collect(Collectors.toList());
    for (final Subscription otherSubscription : subscriptions.values()) {
      final Optional<SubscriptionUpdate> opt = newUpdates.stream()
          .filter(su -> su.getSubscription().getUuid().equals(otherSubscription.getUuid()))
          .findAny();
      assertThat(opt).isNotEmpty();
      assertThat(opt.get().getSubscription().getUpdatedAt()).isAfter(beforeUpdate);
    }
  }

  private void checkOtherSubscriptionUpdates(final Map<String, Subscription> subscriptions,
      final Instant beforeUpdate, final String subscriptionUuid) {
    // When updating other types of objects (i.e non-report, or adding a note to an object),
    // only subscriptions to that object get an update
    final AnetBeanList_SubscriptionUpdate jackSubscriptionUpdates2 =
        getAllSubscriptionUpdates(jackQueryExecutor);
    final List<SubscriptionUpdate> newUpdates = jackSubscriptionUpdates2.getList().stream()
        .filter(su -> su.getCreatedAt().isAfter(beforeUpdate)).collect(Collectors.toList());
    for (final Subscription otherSubscription : subscriptions.values()) {
      final Optional<SubscriptionUpdate> opt = newUpdates.stream()
          .filter(su -> su.getSubscription().getUuid().equals(otherSubscription.getUuid()))
          .findAny();
      if (!otherSubscription.getUuid().equals(subscriptionUuid)) {
        assertThat(opt).isEmpty();
      } else {
        assertThat(opt).isNotEmpty();
        assertThat(opt.get().getSubscription().getUpdatedAt()).isAfter(beforeUpdate);
      }
    }
  }

  private Note createNote(final String subscribedObjectType, final String subscribedObjectUuid) {
    try {
      final GenericRelatedObjectInput nroInput =
          GenericRelatedObjectInput.builder().withRelatedObjectType(subscribedObjectType)
              .withRelatedObjectUuid(subscribedObjectUuid).build();
      final NoteInput noteInput = NoteInput.builder().withType(NoteType.FREE_TEXT)
          .withText("Test note for subscription updates")
          .withNoteRelatedObjects(Collections.singletonList(nroInput)).build();
      return adminMutationExecutor.createNote(NoteResourceTest.NOTE_FIELDS, noteInput);
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private void deleteNote(final Note note) {
    try {
      adminMutationExecutor.deleteNote("", note.getUuid());
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private String createReport() {
    // Create a DRAFT report referencing the subscribed objects
    try {
      final ReportInput reportInput = ReportInput.builder().withState(ReportState.DRAFT)
          .withIntent("Test report for subscription updates").withEngagementDate(Instant.now())
          .withLocation(
              getLocationInput(getLocation(getSubscribedObjectUuid(LocationDao.TABLE_NAME))))
          .withCancelledReason(ReportCancelledReason.CANCELLED_BY_ADVISOR)
          .withReportPeople(
              getReportPeopleInput(Lists.newArrayList(personToPrimaryReportAuthor(getJackJackson()),
                  personToReportPerson(getPerson(getSubscribedObjectUuid(PersonDao.TABLE_NAME))),
                  personToPrimaryReportPerson(getChristopfTopferness()))))
          .withAdvisorOrg(getOrganizationInput(
              getOrganization(getSubscribedObjectUuid(OrganizationDao.TABLE_NAME))))
          .withTasks(Lists
              .newArrayList(getTaskInput(getTask(getSubscribedObjectUuid(TaskDao.TABLE_NAME)))))
          .withNextSteps("<p>Test report next steps for subscription updates</p>")
          .withReportText("<p>Test report intent for subscription updates</p>").build();
      final String reportUuid =
          jackMutationExecutor.createReport("{ uuid }", reportInput).getUuid();
      jackMutationExecutor.submitReport("", reportUuid);
      return reportUuid;
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private static void updateReport(final String reportUuid) {
    try {
      // Approve report, which will update report state to CANCELLED
      adminMutationExecutor.approveReport("", null, reportUuid);
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private void deleteReport(final String reportUuid) {
    try {
      adminMutationExecutor.deleteReport("", reportUuid);
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private static void updateLocation(final String subscribedObjectUuid) {
    try {
      final Location subscribedObject = getLocation(subscribedObjectUuid);
      adminMutationExecutor.updateLocation("", getLocationInput(subscribedObject));
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private static Location getLocation(final String subscribedObjectUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    return jackQueryExecutor.location(LocationResourceTest.FIELDS, subscribedObjectUuid);
  }

  private static void updateOrganization(final String subscribedObjectUuid) {
    try {
      final Organization subscribedObject = getOrganization(subscribedObjectUuid);
      adminMutationExecutor.updateOrganization("", getOrganizationInput(subscribedObject));
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private static Organization getOrganization(final String subscribedObjectUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    return jackQueryExecutor.organization(OrganizationResourceTest.FIELDS, subscribedObjectUuid);
  }

  private static void updatePerson(final String subscribedObjectUuid) {
    try {
      final Person subscribedObject = getPerson(subscribedObjectUuid);
      adminMutationExecutor.updatePerson("", getPersonInput(subscribedObject));
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private static Person getPerson(final String subscribedObjectUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    return jackQueryExecutor.person(PersonResourceTest.FIELDS, subscribedObjectUuid);
  }

  private static void updatePosition(final String subscribedObjectUuid) {
    try {
      final Position subscribedObject = getPosition(subscribedObjectUuid);
      adminMutationExecutor.updatePosition("", getPositionInput(subscribedObject));
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private static Position getPosition(final String subscribedObjectUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    return jackQueryExecutor.position(PositionResourceTest.FIELDS, subscribedObjectUuid);
  }

  private static void updateTask(final String subscribedObjectUuid) {
    try {
      final Task subscribedObject = getTask(subscribedObjectUuid);
      adminMutationExecutor.updateTask("", getTaskInput(subscribedObject));
    } catch (GraphQLRequestExecutionException | GraphQLRequestPreparationException e) {
      throw new RuntimeException(e);
    }
  }

  private static Task getTask(final String subscribedObjectUuid)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    return jackQueryExecutor.task(TaskResourceTest.FIELDS, subscribedObjectUuid);
  }
}
