package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.client.Status.ACTIVE;
import static mil.dds.anet.test.client.Status.INACTIVE;
import static mil.dds.anet.test.resources.EventSeriesResourceTest.FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.test.client.EventSeries;
import mil.dds.anet.test.client.EventSeriesInput;
import mil.dds.anet.test.resources.AbstractResourceTest;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class EventSeriesMergeTest extends AbstractResourceTest {

  @ParameterizedTest
  @MethodSource("provideMergeTestParameters")
  void testMerge(boolean subscribeToLoser, boolean subscribeToWinner) {
    final String objectType = EventSeriesDao.TABLE_NAME;

    final var loserInput = EventSeriesInput.builder().withName("LM1-" + UUID.randomUUID())
        .withStatus(INACTIVE).build();
    final var loser =
        withCredentials(adminUser, t -> mutationExecutor.createEventSeries(FIELDS, loserInput));
    assertThat(loser).isNotNull().extracting(EventSeries::getUuid).isNotNull();

    // Subscribe to the event series
    final String loserSubscriptionUuid =
        addSubscription(subscribeToLoser, objectType, loser.getUuid(),
            t -> mutationExecutor.updateEventSeries("", getEventSeriesInput(loser), false));

    final var winnerInput =
        EventSeriesInput.builder().withName("WM1-" + UUID.randomUUID()).withStatus(ACTIVE).build();
    final var winner =
        withCredentials(adminUser, t -> mutationExecutor.createEventSeries(FIELDS, winnerInput));


    // Subscribe to the event series
    final String winnerSubscriptionUuid =
        addSubscription(subscribeToWinner, objectType, winner.getUuid(),
            t -> mutationExecutor.updateEventSeries("", getEventSeriesInput(winner), false));

    // Merge the two event series
    final var mergeInput = getEventSeriesInput(winner);
    mergeInput.setStatus(loser.getStatus());
    final var updated = withCredentials(adminUser,
        t -> mutationExecutor.mergeEventSeries("", loser.getUuid(), mergeInput));
    assertThat(updated).isOne();

    // Assert that loser is gone.
    assertThatThrownBy(
        () -> withCredentials(adminUser, t -> queryExecutor.eventSeries(FIELDS, loser.getUuid())))
        .isInstanceOf(Exception.class);

    // Check the subscriptions and updates
    checkSubscriptionsAndUpdatesAfterMerge(subscribeToLoser || subscribeToWinner, objectType,
        loser.getUuid(), winner.getUuid());
    // And unsubscribe
    deleteSubscription(subscribeToWinner, loserSubscriptionUuid);
    deleteSubscription(false, winnerSubscriptionUuid);
  }
}
