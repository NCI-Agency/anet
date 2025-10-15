package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.util.UUID;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.EventSeries;
import mil.dds.anet.test.client.EventSeriesInput;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Status;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClientResponseException;

public class EventSeriesResourceTest extends AbstractResourceTest {

  private static final String ORGANIZATION_FIELDS = "{ uuid shortName }";
  public static final String FIELDS =
      "{ uuid updatedAt status name description ownerOrg { uuid } hostOrg { uuid } adminOrg { uuid } }";

  @Test
  void eventTestSeriesGraphQL() {
    // Create
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    final EventSeriesInput eSeriesInput = TestData.createEventSeriesInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org), getOrganizationInput(org));
    final EventSeries created = succeedCreateEventSeries(eSeriesInput);

    // Update an event series field
    created.setName("NMI PDT v2");
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateEventSeries("", getEventSeriesInput(created), false));
    assertThat(nrUpdated).isEqualTo(1);
    EventSeries updated =
        withCredentials(adminUser, t -> queryExecutor.eventSeries(FIELDS, created.getUuid()));
    assertThat(updated.getStatus()).isEqualTo(created.getStatus());
    assertThat(updated.getName()).isEqualTo(created.getName());
  }

  @Test
  void eventCreateValidationTest() {
    EventSeriesInput eventSeriesInput = new EventSeriesInput();
    failCreateEventSeries(eventSeriesInput);
    eventSeriesInput.setStatus(Status.ACTIVE);
    failCreateEventSeries(eventSeriesInput);
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    eventSeriesInput.setOwnerOrg(getOrganizationInput(org));
    failCreateEventSeries(eventSeriesInput);
    eventSeriesInput.setHostOrg(getOrganizationInput(org));
    failCreateEventSeries(eventSeriesInput);
    eventSeriesInput.setAdminOrg(getOrganizationInput(org));
    failCreateEventSeries(eventSeriesInput);
    eventSeriesInput.setName("NAME");
    succeedCreateEventSeries(eventSeriesInput);
  }

  @Test
  void eventCreateUpdateRegularUserPermissionTest() {
    final Organization org = withCredentials(adminUser, t -> mutationExecutor
        .createOrganization(ORGANIZATION_FIELDS, TestData.createAdvisorOrganizationInput(true)));
    // Jack is not an admin of this new organization, will fail
    final EventSeriesInput eInput = TestData.createEventSeriesInput("NMI PDT", "Training",
        getOrganizationInput(org), getOrganizationInput(org), getOrganizationInput(org));
    failCreateEventSeries(eInput);
    failUpdateEventSeries(eInput);
  }

  @Test
  void testUpdateConflict() {
    final String testUuid = "b7b70191-54e4-462f-8e40-679dd2e71ec4";
    final EventSeries test =
        withCredentials(adminUser, t -> queryExecutor.eventSeries(FIELDS, testUuid));

    // Update it
    final EventSeriesInput updatedInput = getEventSeriesInput(test);
    final String updatedDescription = UUID.randomUUID().toString();
    updatedInput.setDescription(updatedDescription);
    final Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateEventSeries("", updatedInput, false));
    assertThat(nrUpdated).isOne();
    final EventSeries updated =
        withCredentials(adminUser, t -> queryExecutor.eventSeries(FIELDS, testUuid));
    assertThat(updated.getUpdatedAt()).isAfter(test.getUpdatedAt());
    assertThat(updated.getDescription()).isEqualTo(updatedDescription);

    // Try to update it again, with the input that is now outdated
    final EventSeriesInput outdatedInput = getEventSeriesInput(test);
    try {
      withCredentials(adminUser, t -> mutationExecutor.updateEventSeries("", outdatedInput, false));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      final Throwable rootCause = ExceptionUtils.getRootCause(expectedException);
      if (!(rootCause instanceof WebClientResponseException.Conflict)) {
        fail("Expected WebClientResponseException.Conflict");
      }
    }

    // Now do a force-update
    final Integer nrForceUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateEventSeries("", outdatedInput, true));
    assertThat(nrForceUpdated).isOne();
    final EventSeries forceUpdated =
        withCredentials(adminUser, t -> queryExecutor.eventSeries(FIELDS, testUuid));
    assertThat(forceUpdated.getUpdatedAt()).isAfter(updated.getUpdatedAt());
    assertThat(forceUpdated.getDescription()).isEqualTo(test.getDescription());
  }

  private void failCreateEventSeries(final EventSeriesInput eventSeriesInput) {
    try {
      withCredentials(jackUser, t -> mutationExecutor.createEventSeries(FIELDS, eventSeriesInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failUpdateEventSeries(final EventSeriesInput eventSeriesInput) {
    try {
      withCredentials(jackUser,
          t -> mutationExecutor.updateEventSeries("", eventSeriesInput, false));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private EventSeries succeedCreateEventSeries(final EventSeriesInput eventSeriesInput) {
    final EventSeries createdEventSeries = withCredentials(adminUser,
        t -> mutationExecutor.createEventSeries(FIELDS, eventSeriesInput));
    assertThat(createdEventSeries).isNotNull();
    assertThat(createdEventSeries.getUuid()).isNotNull();
    assertThat(createdEventSeries.getStatus()).isEqualTo(eventSeriesInput.getStatus());
    assertThat(createdEventSeries.getName()).isEqualTo(eventSeriesInput.getName());
    return createdEventSeries;
  }
}
