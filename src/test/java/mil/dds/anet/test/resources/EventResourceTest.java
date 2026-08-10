package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Event;
import mil.dds.anet.test.client.Event;
import mil.dds.anet.test.client.EventInput;
import mil.dds.anet.test.client.EventSearchQueryInput;
import mil.dds.anet.test.client.EventTypeInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.utils.UtilsTest;
import mil.dds.anet.utils.DaoUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClientResponseException;

public class EventResourceTest extends AbstractResourceTest {

  private static final String ORGANIZATION_FIELDS = "{ uuid shortName }";
  private static final String TASK_FIELDS =
      "{ uuid shortName longName description category status customFields }";
  private static final String EVENT_SERIES_FIELDS =
      "{ uuid status name description ownerOrg { uuid } hostRelatedObjects { relatedObjectType relatedObjectUuid } adminOrg { uuid } }";
  public static final String FIELDS =
      "{ uuid status name description eventSeries { uuid } ownerOrg { uuid } hostRelatedObjects { relatedObjectType relatedObjectUuid } adminOrg { uuid }"
          + " updatedAt startDate endDate eventType { uuid } organizations { uuid } people { uuid } tasks { uuid } }";

  @Test
  void eventTestGraphQL() {
    // Create
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    final EventInput eInput = TestData.createEventInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org));
    final Event created = succeedCreateEvent(eInput);

    // Update an event field
    created.setName("NMI PDT v2");
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateEvent("", getEventInput(created), false));
    assertThat(nrUpdated).isEqualTo(1);
    Event updated = withCredentials(adminUser, t -> queryExecutor.event(FIELDS, created.getUuid()));
    assertThat(updated.getStatus()).isEqualTo(created.getStatus());
    assertThat(updated.getName()).isEqualTo(created.getName());

    // Add entities to event
    updated.setEventSeries(withCredentials(adminUser,
        t -> mutationExecutor.createEventSeries(EVENT_SERIES_FIELDS,
            TestData.createEventSeriesInput("Event Series", "Event Series Description",
                getOrganizationInput(org), getOrganizationInput(org)))));
    updated.setOrganizations(Collections.singletonList(org));
    updated.setPeople(Collections.singletonList(getJackJackson()));
    updated.setTasks(Collections.singletonList(withCredentials(adminUser,
        t -> mutationExecutor.createTask(TASK_FIELDS,
            TestData.createTaskInput("The New Task for the NMI PDT Event",
                "The New Task for the NMI PDT Event", "The New Task for the NMI PDT Event",
                UtilsTest.getCombinedJsonTestCase().getInput())))));
    final EventInput updatedInput = getEventInput(updated);
    nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateEvent("", updatedInput, false));
    assertThat(nrUpdated).isEqualTo(1);

    updated = withCredentials(adminUser, t -> queryExecutor.event(FIELDS, created.getUuid()));
    assertThat(updated.getEventSeries()).isNotNull();
    assertThat(updated.getOrganizations()).hasSize(1);
    assertThat(updated.getPeople()).hasSize(1);
    assertThat(updated.getTasks()).hasSize(1);

    // Search filtering by text
    final EventSearchQueryInput query =
        EventSearchQueryInput.builder().withText("NMI PDT 2024-01").build();
    final AnetBeanList_Event searchObjects =
        withCredentials(adminUser, t -> queryExecutor.eventList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    assertThat(searchObjects.getList()).hasSize(1);

    // Search filtering by start date
    final EventSearchQueryInput query2 = EventSearchQueryInput.builder()
        .withStartDateStart(LocalDateTime.of(2024, Month.JANUARY, 7, 0, 0)
            .atZone(DaoUtils.getServerNativeZoneId()).toInstant())
        .withStartDateEnd(LocalDateTime.of(2024, Month.JANUARY, 10, 0, 0)
            .atZone(DaoUtils.getServerNativeZoneId()).toInstant())
        .build();

    final AnetBeanList_Event searchObjects2 =
        withCredentials(adminUser, t -> queryExecutor.eventList(getListFields(FIELDS), query2));
    assertThat(searchObjects2).isNotNull();
    assertThat(searchObjects2.getList()).isNotEmpty();
    assertThat(searchObjects2.getList()).hasSize(1);

    // Search filtering by end date
    final EventSearchQueryInput query3 = EventSearchQueryInput.builder()
        .withEndDateStart(LocalDateTime.of(2024, Month.JANUARY, 11, 0, 0)
            .atZone(DaoUtils.getServerNativeZoneId()).toInstant())
        .withEndDateEnd(LocalDateTime.of(2024, Month.JANUARY, 13, 0, 0)
            .atZone(DaoUtils.getServerNativeZoneId()).toInstant())
        .build();

    final AnetBeanList_Event searchObjects3 =
        withCredentials(adminUser, t -> queryExecutor.eventList(getListFields(FIELDS), query3));
    assertThat(searchObjects3).isNotNull();
    assertThat(searchObjects3.getList()).isNotEmpty();
    assertThat(searchObjects3.getList()).hasSize(1);

    // Search filtering by rank of attendees
    final EventSearchQueryInput query4 =
        EventSearchQueryInput.builder().withAttendeeRanks(List.of("CIV")).build();

    final AnetBeanList_Event searchObjects4 =
        withCredentials(adminUser, t -> queryExecutor.eventList(getListFields(FIELDS), query4));
    assertThat(searchObjects4).isNotNull();
    assertThat(searchObjects4.getList()).isNotEmpty();
    assertThat(searchObjects4.getList()).hasSize(1);
  }

  @Test
  void eventCreateValidationTest() {
    EventInput eventInput = new EventInput();
    failCreateEvent(eventInput);
    eventInput.setStatus(Status.ACTIVE);
    failCreateEvent(eventInput);
    eventInput.setName("NAME");
    failCreateEvent(eventInput);
    eventInput.setStartDate(Instant.now());
    failCreateEvent(eventInput);
    eventInput.setEndDate(Instant.now());
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    eventInput.setOwnerOrg(getOrganizationInput(org));
    failCreateEvent(eventInput);
    final GenericRelatedObjectInput host1 =
        GenericRelatedObjectInput.builder().withRelatedObjectType(OrganizationDao.TABLE_NAME)
            .withRelatedObjectUuid(org.getUuid()).build();
    final GenericRelatedObjectInput host2 =
        GenericRelatedObjectInput.builder().withRelatedObjectType(PersonDao.TABLE_NAME)
            .withRelatedObjectUuid(getJackJackson().getUuid()).build();
    eventInput.setHostRelatedObjects(List.of(host1, host2));
    failCreateEvent(eventInput);
    eventInput.setAdminOrg(getOrganizationInput(org));
    failCreateEvent(eventInput);
    final String EVENT_TYPE_CONFERENCE_UUID = "92a69ee6-829e-4a67-88fb-3387f81b6d37";
    eventInput.setEventType(EventTypeInput.builder().withUuid(EVENT_TYPE_CONFERENCE_UUID).build());
    succeedCreateEvent(eventInput);
  }

  @Test
  void eventCreateUpdateRegularUserPermissionTest() {
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    // Jack is not an admin of this new organization, will fail
    final EventInput eInput = TestData.createEventInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org));
    failCreateEvent(eInput);
    failUpdateEvent(eInput);
  }

  @Test
  void testUpdateConflict() {
    final String testUuid = "e850846e-9741-40e8-bc51-4dccc30cf47f";
    final Event test = withCredentials(adminUser, t -> queryExecutor.event(FIELDS, testUuid));

    // Update it
    final EventInput updatedInput = getEventInput(test);
    final String updatedDescription = UUID.randomUUID().toString();
    updatedInput.setDescription(updatedDescription);
    final Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateEvent("", updatedInput, false));
    assertThat(nrUpdated).isOne();
    final Event updated = withCredentials(adminUser, t -> queryExecutor.event(FIELDS, testUuid));
    assertThat(updated.getUpdatedAt()).isAfter(test.getUpdatedAt());
    assertThat(updated.getDescription()).isEqualTo(updatedDescription);

    // Try to update it again, with the input that is now outdated
    final EventInput outdatedInput = getEventInput(test);
    try {
      withCredentials(adminUser, t -> mutationExecutor.updateEvent("", outdatedInput, false));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      final Throwable rootCause = ExceptionUtils.getRootCause(expectedException);
      if (!(rootCause instanceof WebClientResponseException.Conflict)) {
        fail("Expected WebClientResponseException.Conflict");
      }
    }

    // Now do a force-update
    final Integer nrForceUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateEvent("", outdatedInput, true));
    assertThat(nrForceUpdated).isOne();
    final Event forceUpdated =
        withCredentials(adminUser, t -> queryExecutor.event(FIELDS, testUuid));
    assertThat(forceUpdated.getUpdatedAt()).isAfter(updated.getUpdatedAt());
    assertThat(forceUpdated.getDescription()).isEqualTo(test.getDescription());
  }

  private void failCreateEvent(final EventInput eventInput) {
    try {
      withCredentials(jackUser, t -> mutationExecutor.createEvent(FIELDS, eventInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failUpdateEvent(final EventInput eventInput) {
    try {
      withCredentials(jackUser, t -> mutationExecutor.updateEvent("", eventInput, false));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Event succeedCreateEvent(final EventInput eventInput) {
    final Event createdEvent =
        withCredentials(adminUser, t -> mutationExecutor.createEvent(FIELDS, eventInput));
    assertThat(createdEvent).isNotNull();
    assertThat(createdEvent.getUuid()).isNotNull();
    assertThat(createdEvent.getStatus()).isEqualTo(eventInput.getStatus());
    assertThat(createdEvent.getName()).isEqualTo(eventInput.getName());
    return createdEvent;
  }
}
