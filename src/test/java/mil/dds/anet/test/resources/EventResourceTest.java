package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.time.Instant;
import java.util.Collections;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Event;
import mil.dds.anet.test.client.Event;
import mil.dds.anet.test.client.EventInput;
import mil.dds.anet.test.client.EventSearchQueryInput;
import mil.dds.anet.test.client.EventType;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.utils.UtilsTest;
import org.junit.jupiter.api.Test;

public class EventResourceTest extends AbstractResourceTest {

  private static final String ORGANIZATION_FIELDS = "{ uuid shortName }";
  private static final String TASK_FIELDS =
      "{ uuid shortName longName description category status customFields }";
  private static final String EVENT_SERIES_FIELDS =
      "{ uuid status name description ownerOrg { uuid } hostOrg { uuid } adminOrg { uuid } }";
  public static final String FIELDS =
      "{ uuid status name description eventSeries { uuid } ownerOrg { uuid } hostOrg { uuid } adminOrg { uuid }"
          + " updatedAt startDate endDate type organizations { uuid } people { uuid } tasks { uuid } }";

  @Test
  void eventTestGraphQL() {
    // Create
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    final EventInput eInput = TestData.createEventInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org), getOrganizationInput(org));
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
                getOrganizationInput(org), getOrganizationInput(org), getOrganizationInput(org)))));
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

    // Search
    final EventSearchQueryInput query =
        EventSearchQueryInput.builder().withText("NMI PDT 2024-01").build();
    final AnetBeanList_Event searchObjects =
        withCredentials(adminUser, t -> queryExecutor.eventList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
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
    eventInput.setHostOrg(getOrganizationInput(org));
    failCreateEvent(eventInput);
    eventInput.setAdminOrg(getOrganizationInput(org));
    failCreateEvent(eventInput);
    eventInput.setType(EventType.CONFERENCE);
    succeedCreateEvent(eventInput);
  }

  @Test
  void eventCreateUpdateRegularUserPermissionTest() {
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    // Jack is not an admin of this new organization, will fail
    final EventInput eInput = TestData.createEventInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org), getOrganizationInput(org));
    failCreateEvent(eInput);
    failUpdateEvent(eInput);
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
