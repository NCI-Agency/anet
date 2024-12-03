package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.EventSeries;
import mil.dds.anet.test.client.EventSeriesInput;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Status;
import org.junit.jupiter.api.Test;

public class EventSeriesResourceTest extends AbstractResourceTest {

  private static final String _ORGANIZATION_FIELDS = "{uuid shortName}";
  public static final String _EVENT_SERIES_FIELDS =
      "{ uuid name description adminOrg hostOrg status }";

  @Test
  void eventTestSeriesGraphQL() {
    // Create
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(_ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    final EventSeriesInput eSeriesInput = TestData.createEventSeriesInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org));
    final EventSeries created = succeedCreateEventSeries(eSeriesInput);

    // Update an event series field
    created.setName("NMI PDT v2");
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateEventSeries("", getEventSeriesInput(created)));
    assertThat(nrUpdated).isEqualTo(1);
    EventSeries updated = withCredentials(adminUser,
        t -> queryExecutor.eventSeries(_EVENT_SERIES_FIELDS, created.getUuid()));
    assertThat(updated.getName()).isEqualTo(created.getName());
  }

  @Test
  void eventCreateValidationTest() {
    EventSeriesInput eventSeriesInput = new EventSeriesInput();
    failCreateEventSeries(eventSeriesInput);
    eventSeriesInput.setStatus(Status.ACTIVE);
    failCreateEventSeries(eventSeriesInput);
    eventSeriesInput.setName("NAME");
    failCreateEventSeries(eventSeriesInput);
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(_ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    eventSeriesInput.setAdminOrg(getOrganizationInput(org));
    failCreateEventSeries(eventSeriesInput);
    eventSeriesInput.setHostOrg(getOrganizationInput(org));
    succeedCreateEventSeries(eventSeriesInput);
  }

  @Test
  void eventCreateUpdateRegularUserPermissionTest() {
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(_ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    // Jack is not an admin of this new organization, will fail
    final EventSeriesInput eInput = TestData.createEventSeriesInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org));
    failCreateEventSeries(eInput);
    failUpdateEventSeries(eInput);
  }

  private void failCreateEventSeries(final EventSeriesInput eventSeriesInput) {
    try {
      withCredentials(jackUser,
          t -> mutationExecutor.createEventSeries(_EVENT_SERIES_FIELDS, eventSeriesInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failUpdateEventSeries(final EventSeriesInput eventSeriesInput) {
    try {
      withCredentials(jackUser, t -> mutationExecutor.updateEventSeries("", eventSeriesInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private EventSeries succeedCreateEventSeries(final EventSeriesInput eventSeriesInput) {
    final EventSeries createdEventSeries = withCredentials(adminUser,
        t -> mutationExecutor.createEventSeries(_EVENT_SERIES_FIELDS, eventSeriesInput));
    assertThat(createdEventSeries).isNotNull();
    assertThat(createdEventSeries.getUuid()).isNotNull();
    assertThat(createdEventSeries.getName()).isEqualTo(eventSeriesInput.getName());
    return createdEventSeries;
  }
}
