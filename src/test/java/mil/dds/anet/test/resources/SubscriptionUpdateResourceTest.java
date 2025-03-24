package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.client.AnetBeanList_SubscriptionUpdate;
import mil.dds.anet.test.client.AuthorizationGroup;
import mil.dds.anet.test.client.Event;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.Note;
import mil.dds.anet.test.client.NoteInput;
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
import org.junit.jupiter.api.Test;

class SubscriptionUpdateResourceTest extends SubscriptionTestHelper {

  protected static final String FIELDS =
      "{ createdAt isNote updatedObjectType updatedObjectUuid updatedObject {"
          + " ... on Location { uuid } ... on Organization { uuid }"
          + " ... on Person { uuid } ... on Position { uuid }"
          + " ... on Report { uuid } ... on Task { uuid }"
          + " ... on AuthorizationGroup { uuid } ... on Event { uuid } } subscription "
          + SUBSCRIPTION_FIELDS + " }";

  private final Map<String, Consumer<String>> UPDATERS = Map.of( //
      LocationDao.TABLE_NAME, this::updateLocation, //
      OrganizationDao.TABLE_NAME, this::updateOrganization, //
      PersonDao.TABLE_NAME, this::updatePerson, //
      PositionDao.TABLE_NAME, this::updatePosition, //
      ReportDao.TABLE_NAME, this::updateReport, //
      TaskDao.TABLE_NAME, this::updateTask, //
      AuthorizationGroupDao.TABLE_NAME, this::updateAuthorizationGroup, //
      EventDao.TABLE_NAME, this::updateEvent);

  @Test
  void testSubscriptionUpdate() {
    // Create a report using the objects we are going to subscribe to
    final String reportUuid = createReport();
    // Subscribe jack to all object types, where for report we use the one we just created
    final Map<String, Subscription> subscriptions = SUBSCRIPTION_TESTS.entrySet().stream().collect(
        Collectors.toMap(Map.Entry::getKey, testCase -> createTestSubscription(testCase.getKey(),
            testCase.getValue(), reportUuid)));

    // Check jack's subscription updates
    final AnetBeanList_SubscriptionUpdate jackSubscriptionUpdates =
        getAllSubscriptionUpdates(jackUser);
    assertThat(jackSubscriptionUpdates.getList()).noneMatch(su -> subscriptions.values().stream()
        .anyMatch(s -> s.getUuid().equals(su.getSubscription().getUuid())));

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
    subscriptions.values()
        .forEach(subscription -> deleteSubscription(jackUser, subscription.getUuid(), false));

    // Delete the report
    deleteReport(reportUuid);
  }

  @Test
  void testSubscriptionUpdateWithNote() {
    // Create a report using the objects we are going to subscribe to
    final String reportUuid = createReport();
    // Subscribe jack to all object types, where for report we use the one we just created
    final Map<String, Subscription> subscriptions = SUBSCRIPTION_TESTS.entrySet().stream().collect(
        Collectors.toMap(Map.Entry::getKey, testCase -> createTestSubscription(testCase.getKey(),
            testCase.getValue(), reportUuid)));

    // Check jack's subscription updates
    final AnetBeanList_SubscriptionUpdate jackSubscriptionUpdates =
        getAllSubscriptionUpdates(jackUser);
    assertThat(jackSubscriptionUpdates.getList()).noneMatch(su -> subscriptions.values().stream()
        .anyMatch(s -> s.getUuid().equals(su.getSubscription().getUuid())));

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
    subscriptions.values()
        .forEach(subscription -> deleteSubscription(jackUser, subscription.getUuid(), false));

    // Delete the notes
    notes.forEach(this::deleteNote);

    // Delete the report
    deleteReport(reportUuid);
  }

  // helper methods

  protected AnetBeanList_SubscriptionUpdate getAllSubscriptionUpdates(final String username) {
    final SubscriptionUpdateSearchQueryInput susqi =
        SubscriptionUpdateSearchQueryInput.builder().withPageSize(0).build();
    return withCredentials(username,
        t -> queryExecutor.mySubscriptionUpdates(getListFields(FIELDS), susqi));
  }

  private Subscription createTestSubscription(final String subscribedObjectType,
      final String subscribedObjectUuid, final String reportUuid) {
    final String adminSubscriberUuid = admin.getPosition().getUuid();
    return createSubscription(jackUser, subscribedObjectType,
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
        getAllSubscriptionUpdates(jackUser);
    final List<SubscriptionUpdate> newUpdates = jackSubscriptionUpdates2.getList().stream()
        .filter(su -> su.getCreatedAt().isAfter(beforeUpdate)).toList();
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
    // When updating other types of objects (i.e. non-report, or adding a note to an object),
    // only subscriptions to that object get an update
    final AnetBeanList_SubscriptionUpdate jackSubscriptionUpdates2 =
        getAllSubscriptionUpdates(jackUser);
    final List<SubscriptionUpdate> newUpdates = jackSubscriptionUpdates2.getList().stream()
        .filter(su -> su.getCreatedAt().isAfter(beforeUpdate)).toList();
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
    final GenericRelatedObjectInput nroInput =
        GenericRelatedObjectInput.builder().withRelatedObjectType(subscribedObjectType)
            .withRelatedObjectUuid(subscribedObjectUuid).build();
    final NoteInput noteInput = NoteInput.builder().withText("Test note for subscription updates")
        .withNoteRelatedObjects(Collections.singletonList(nroInput)).build();
    return withCredentials(adminUser,
        t -> mutationExecutor.createNote(NoteResourceTest.NOTE_FIELDS, noteInput));
  }

  private void deleteNote(final Note note) {
    withCredentials(adminUser, t -> mutationExecutor.deleteNote("", note.getUuid()));
  }

  private String createReport() {
    // Create a DRAFT report referencing the subscribed objects
    final ReportInput reportInput = ReportInput.builder().withState(ReportState.DRAFT)
        .withIntent("Test report for subscription updates").withEngagementDate(Instant.now())
        .withLocation(
            getLocationInput(getLocation(getSubscribedObjectUuid(LocationDao.TABLE_NAME))))
        .withCancelledReason(ReportCancelledReason.CANCELLED_BY_ADVISOR)
        .withReportPeople(getReportPeopleInput(List.of(personToReportAuthor(getJackJackson()),
            personToPrimaryReportPerson(getPerson(getSubscribedObjectUuid(PersonDao.TABLE_NAME)),
                false),
            personToReportPerson(getChristopfTopferness(), true))))
        .withTasks(List.of(getTaskInput(getTask(getSubscribedObjectUuid(TaskDao.TABLE_NAME)))))
        .withAuthorizationGroups(List.of(getAuthorizationGroupInput(
            getAuthorizationGroup(getSubscribedObjectUuid(AuthorizationGroupDao.TABLE_NAME)))))
        .withEvent(getEventInput(getEvent(getSubscribedObjectUuid(EventDao.TABLE_NAME))))
        .withNextSteps("<p>Test report next steps for subscription updates</p>")
        .withReportText("<p>Test report intent for subscription updates</p>").build();
    final String reportUuid = withCredentials(jackUser,
        t -> mutationExecutor.createReport("{ uuid }", reportInput).getUuid());
    withCredentials(jackUser, t -> mutationExecutor.submitReport("", reportUuid));
    return reportUuid;
  }

  private void updateReport(final String reportUuid) {
    // Approve report, which will update report state to CANCELLED
    withCredentials(adminUser, t -> mutationExecutor.approveReport("", null, reportUuid));
  }

  private void deleteReport(final String reportUuid) {
    withCredentials(adminUser, t -> mutationExecutor.deleteReport("", reportUuid));
  }

  private void updateLocation(final String subscribedObjectUuid) {
    final Location subscribedObject = getLocation(subscribedObjectUuid);
    withCredentials(adminUser,
        t -> mutationExecutor.updateLocation("", getLocationInput(subscribedObject)));
  }

  private Location getLocation(final String subscribedObjectUuid) {
    return withCredentials(adminUser,
        t -> queryExecutor.location(LocationResourceTest.FIELDS, subscribedObjectUuid));
  }

  private void updateOrganization(final String subscribedObjectUuid) {
    final Organization subscribedObject = getOrganization(subscribedObjectUuid);
    withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", getOrganizationInput(subscribedObject)));
  }

  private Organization getOrganization(final String subscribedObjectUuid) {
    return withCredentials(adminUser,
        t -> queryExecutor.organization(OrganizationResourceTest.FIELDS, subscribedObjectUuid));
  }

  private void updatePerson(final String subscribedObjectUuid) {
    final Person subscribedObject = getPerson(subscribedObjectUuid);
    withCredentials(adminUser,
        t -> mutationExecutor.updatePerson("", getPersonInput(subscribedObject)));
  }

  private Person getPerson(final String subscribedObjectUuid) {
    return withCredentials(adminUser,
        t -> queryExecutor.person(PersonResourceTest.FIELDS, subscribedObjectUuid));
  }

  private void updatePosition(final String subscribedObjectUuid) {
    final Position subscribedObject = getPosition(subscribedObjectUuid);
    withCredentials(adminUser,
        t -> mutationExecutor.updatePosition("", getPositionInput(subscribedObject)));
  }

  private Position getPosition(final String subscribedObjectUuid) {
    return withCredentials(adminUser,
        t -> queryExecutor.position(PositionResourceTest.FIELDS, subscribedObjectUuid));
  }

  private void updateTask(final String subscribedObjectUuid) {
    final Task subscribedObject = getTask(subscribedObjectUuid);
    withCredentials(adminUser,
        t -> mutationExecutor.updateTask("", getTaskInput(subscribedObject)));
  }

  private Task getTask(final String subscribedObjectUuid) {
    return withCredentials(adminUser,
        t -> queryExecutor.task(TaskResourceTest.FIELDS, subscribedObjectUuid));
  }

  private void updateAuthorizationGroup(final String subscribedObjectUuid) {
    final AuthorizationGroup subscribedObject = getAuthorizationGroup(subscribedObjectUuid);
    withCredentials(adminUser, t -> mutationExecutor.updateAuthorizationGroup("",
        getAuthorizationGroupInput(subscribedObject)));
  }

  private AuthorizationGroup getAuthorizationGroup(final String subscribedObjectUuid) {
    return withCredentials(adminUser, t -> queryExecutor
        .authorizationGroup(AuthorizationGroupResourceTest.FIELDS, subscribedObjectUuid));
  }

  private void updateEvent(final String subscribedObjectUuid) {
    final Event subscribedObject = getEvent(subscribedObjectUuid);
    withCredentials(adminUser,
        t -> mutationExecutor.updateEvent("", getEventInput(subscribedObject)));
  }

  private Event getEvent(final String subscribedObjectUuid) {
    return withCredentials(adminUser,
        t -> queryExecutor.event(EventResourceTest.FIELDS, subscribedObjectUuid));
  }
}
