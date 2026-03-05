package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.util.List;
import java.util.UUID;
import mil.dds.anet.test.client.EventType;
import mil.dds.anet.test.client.EventTypeInput;
import mil.dds.anet.test.client.Status;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClientResponseException;

class EventTypeResourceTest extends AbstractResourceTest {
  public static final String FIELDS = "{ uuid status name updatedAt relatedEventsCount }";

  @Test
  void testEventTypes() {
    final List<EventType> eventTypes =
        withCredentials(adminUser, t -> queryExecutor.eventTypes(FIELDS));
    assertThat(eventTypes).hasSize(4).anyMatch(et -> et.getRelatedEventsCount() > 0);
  }

  @Test
  void testEventTypeCrud() {
    // Create
    final EventTypeInput input = EventTypeInput.builder().withStatus(Status.ACTIVE)
        .withName("testEventType." + UUID.randomUUID()).build();
    final EventType created =
        withCredentials(adminUser, t -> mutationExecutor.createEventType(FIELDS, input));
    assertThat(created).isNotNull();

    // Update
    final EventTypeInput updatedInput = getEventTypeInput(created);
    updatedInput.setStatus(Status.INACTIVE);
    Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateEventType("", updatedInput, false));
    assertThat(nrUpdated).isOne();
    final EventType updated =
        withCredentials(adminUser, t -> queryExecutor.eventType(FIELDS, updatedInput.getUuid()));
    assertThat(updated.getStatus()).isEqualTo(updatedInput.getStatus());

    // Update with outdated input
    final EventTypeInput outdatedInput = getEventTypeInput(created);
    try {
      withCredentials(adminUser, t -> mutationExecutor.updateEventType("", outdatedInput, false));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      final Throwable rootCause = ExceptionUtils.getRootCause(expectedException);
      if (!(rootCause instanceof WebClientResponseException.Conflict)) {
        fail("Expected WebClientResponseException.Conflict");
      }
    }

    // Now do a force-update
    nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateEventType("", outdatedInput, true));
    assertThat(nrUpdated).isOne();
    final EventType forceUpdated =
        withCredentials(adminUser, t -> queryExecutor.eventType(FIELDS, outdatedInput.getUuid()));
    assertThat(forceUpdated.getStatus()).isEqualTo(outdatedInput.getStatus());

    // Delete it
    final Integer nrDeleted = withCredentials(adminUser,
        t -> mutationExecutor.deleteEventType("", outdatedInput.getUuid()));
    assertThat(nrDeleted).isOne();
  }
}
