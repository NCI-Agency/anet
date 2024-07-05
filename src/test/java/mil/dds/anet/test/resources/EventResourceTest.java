package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collections;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Event;
import mil.dds.anet.test.client.Event;
import mil.dds.anet.test.client.EventInput;
import mil.dds.anet.test.client.EventSearchQueryInput;
import mil.dds.anet.test.utils.UtilsTest;
import org.junit.jupiter.api.Test;

public class EventResourceTest extends AbstractResourceTest {

  private static final String _ORGANIZATION_FIELDS = "uuid shortName";
  protected static final String _TASK_FIELDS =
      "{ uuid shortName longName description category parentTask { uuid } taskedOrganizations { uuid } status customFields }";
  public static final String _EVENT_FIELDS = "uuid name adminOrg hostOrg startDate endDate type";

  @Test
  void eventTestGraphQL() {
    // Create
    final EventInput eInput = TestData.createEventInput("NMI PDT", "Training",
        TestData.createAdvisorOrganizationInput(true),
        TestData.createAdvisorOrganizationInput(true));
    final Event created =
        withCredentials(adminUser, t -> mutationExecutor.createEvent(_EVENT_FIELDS, eInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getName()).isEqualTo(eInput.getName());

    // Search
    final EventSearchQueryInput query = EventSearchQueryInput.builder().withText("NMI PDT").build();
    final AnetBeanList_Event searchObjects = withCredentials(adminUser,
        t -> queryExecutor.eventList(getListFields(_EVENT_FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();

    // Update an event field
    created.setName("NMI PDT v2");
    Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateEvent("", getEventInput(created)));
    assertThat(nrUpdated).isEqualTo(1);
    Event updated =
        withCredentials(adminUser, t -> queryExecutor.event(_EVENT_FIELDS, created.getUuid()));
    assertThat(updated.getName()).isEqualTo(created.getName());

    // Add entities to event
    created.setOrganizations(Collections.singletonList(
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(_ORGANIZATION_FIELDS,
            TestData.createAdvisorOrganizationInput(true)))));
    created.setPeople(Collections.singletonList(getJackJackson()));
    created.setTasks(Collections.singletonList(withCredentials(adminUser,
        t -> mutationExecutor.createTask(_TASK_FIELDS,
            TestData.createTaskInput("TestF1", "Do a thing with a person", "Test-EF",
                UtilsTest.getCombinedJsonTestCase().getInput())))));
    updated =
        withCredentials(adminUser, t -> queryExecutor.event(_EVENT_FIELDS, created.getUuid()));
    assertThat(updated.getOrganizations().size()).isEqualTo(1);
    assertThat(updated.getPeople().size()).isEqualTo(1);
    assertThat(updated.getTasks().size()).isEqualTo(1);

  }
}
