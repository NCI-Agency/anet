package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import mil.dds.anet.test.client.EventType;
import org.junit.jupiter.api.Test;

class EventTypeResourceTest extends AbstractResourceTest {
  public static final String FIELDS = "{ uuid status name updatedAt relatedEventsCount }";

  @Test
  void testEventTypes() {
    final List<EventType> eventTypes =
        withCredentials(adminUser, t -> queryExecutor.eventTypes(FIELDS));
    assertThat(eventTypes).hasSize(4).anyMatch(et -> et.getRelatedEventsCount() > 0);
  }
}
