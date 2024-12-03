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

  private static final String _ORGANIZATION_FIELDS = "{uuid shortName}";
  protected static final String _TASK_FIELDS =
      "{ uuid shortName longName description category parentTask { uuid } taskedOrganizations { uuid } status customFields }";
  public static final String _EVENT_SERIES_FIELDS =
      "{ uuid name description adminOrg hostOrg status }";
  public static final String _EVENT_FIELDS =
      "{ uuid name description eventSeries adminOrg hostOrg startDate endDate type status organizations people tasks}";

  @Test
  void eventTestGraphQL() {
    // Create
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(_ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    final EventInput eInput = TestData.createEventInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org));
    final Event created = succeedCreateEvent(eInput);

    // Update an event field
    created.setName("NMI PDT v2");
    Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateEvent("", getEventInput(created)));
    assertThat(nrUpdated).isEqualTo(1);
    Event updated =
        withCredentials(adminUser, t -> queryExecutor.event(_EVENT_FIELDS, created.getUuid()));
    assertThat(updated.getName()).isEqualTo(created.getName());

    // Add entities to event
    created.setEventSeries(withCredentials(adminUser,
        t -> mutationExecutor.createEventSeries(_EVENT_SERIES_FIELDS,
            TestData.createEventSeriesInput("Event Series", "Event Series Description",
                getOrganizationInput(org), getOrganizationInput(org)))));
    created.setOrganizations(Collections.singletonList(org));
    created.setPeople(Collections.singletonList(getJackJackson()));
    created.setTasks(Collections.singletonList(withCredentials(adminUser,
        t -> mutationExecutor.createTask(_TASK_FIELDS,
            TestData.createTaskInput("The New Task for the NMI PDT Event",
                "The New Task for the NMI PDT Event", "The New Task for the NMI PDT Event",
                UtilsTest.getCombinedJsonTestCase().getInput())))));
    nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateEvent("", getEventInput(created)));
    assertThat(nrUpdated).isEqualTo(1);

    updated =
        withCredentials(adminUser, t -> queryExecutor.event(_EVENT_FIELDS, created.getUuid()));
    assertThat(updated.getEventSeries()).isNotNull();
    assertThat(updated.getOrganizations().size()).isEqualTo(1);
    assertThat(updated.getPeople().size()).isEqualTo(1);
    assertThat(updated.getTasks().size()).isEqualTo(1);

    // Search
    final EventSearchQueryInput query =
        EventSearchQueryInput.builder().withText("NMI PDT 2024-01").build();
    final AnetBeanList_Event searchObjects = withCredentials(adminUser,
        t -> queryExecutor.eventList(getListFields(_EVENT_FIELDS), query));
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
    eventInput.setType(EventType.CONFERENCE);
    failCreateEvent(eventInput);
    eventInput.setStartDate(Instant.now());
    failCreateEvent(eventInput);
    eventInput.setEndDate(Instant.now());
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(_ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    eventInput.setAdminOrg(getOrganizationInput(org));
    failCreateEvent(eventInput);
    eventInput.setHostOrg(getOrganizationInput(org));
    succeedCreateEvent(eventInput);
  }

  @Test
  void eventCreateUpdateRegularUserPermissionTest() {
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(_ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    // Jack is not an admin of this new organization, will fail
    final EventInput eInput = TestData.createEventInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org));
    failCreateEvent(eInput);
    failUpdateEvent(eInput);
  }

  private void failCreateEvent(final EventInput eventInput) {
    try {
      withCredentials(jackUser, t -> mutationExecutor.createEvent(_EVENT_FIELDS, eventInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failUpdateEvent(final EventInput eventInput) {
    try {
      withCredentials(jackUser, t -> mutationExecutor.updateEvent("", eventInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Event succeedCreateEvent(final EventInput eventInput) {
    final Event createdEvent =
        withCredentials(adminUser, t -> mutationExecutor.createEvent(_EVENT_FIELDS, eventInput));
    assertThat(createdEvent).isNotNull();
    assertThat(createdEvent.getUuid()).isNotNull();
    assertThat(createdEvent.getName()).isEqualTo(eventInput.getName());
    return createdEvent;
  }
}
