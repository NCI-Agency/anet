package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.client.Status.ACTIVE;
import static mil.dds.anet.test.client.Status.INACTIVE;
import static mil.dds.anet.test.resources.TaskResourceTest.FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.resources.AbstractResourceTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class TaskMergeTest extends AbstractResourceTest {
  @Test
  void testMergeLoop() {
    // 1.1
    final Task childTask = withCredentials(adminUser,
        t -> queryExecutor.task(FIELDS, "fdf107e7-a88a-4dc4-b744-748e9aaffabc"));
    // EF 1
    final Task parentTask = childTask.getParentTask();
    assertThatThrownBy(() -> withCredentials(adminUser,
        t -> mutationExecutor.mergeTasks("", parentTask.getUuid(), getTaskInput(childTask))))
        .isInstanceOf(Exception.class);
  }

  @ParameterizedTest
  @MethodSource("provideMergeTestParameters")
  void testMerge(boolean subscribeToLoser, boolean subscribeToWinner) {
    final String objectType = TaskDao.TABLE_NAME;

    final var loserInput = TaskInput.builder().withShortName("LM1-" + UUID.randomUUID())
        .withLongName("Loser for Merge").withStatus(INACTIVE).build();
    final var loser =
        withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, loserInput));
    assertThat(loser).isNotNull().extracting(Task::getUuid).isNotNull();

    // Subscribe to the task
    final String loserSubscriptionUuid = addSubscription(subscribeToLoser, objectType,
        loser.getUuid(), t -> mutationExecutor.updateTask("", getTaskInput(loser)));

    final var winnerInput = TaskInput.builder().withShortName("WM1-" + UUID.randomUUID())
        .withLongName("Winner for Merge").withStatus(ACTIVE).build();
    final var winner =
        withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, winnerInput));

    // Subscribe to the task
    final String winnerSubscriptionUuid = addSubscription(subscribeToWinner, objectType,
        winner.getUuid(), t -> mutationExecutor.updateTask("", getTaskInput(winner)));

    // Merge the two tasks
    final var mergeInput = getTaskInput(winner);
    mergeInput.setStatus(loser.getStatus());
    final var updated = withCredentials(adminUser,
        t -> mutationExecutor.mergeTasks("", loser.getUuid(), mergeInput));
    assertThat(updated).isOne();

    // Assert that loser is gone.
    assertThatThrownBy(
        () -> withCredentials(adminUser, t -> queryExecutor.task(FIELDS, loser.getUuid())))
        .isInstanceOf(Exception.class);

    // Check the subscriptions and updates
    checkSubscriptionsAndUpdatesAfterMerge(subscribeToLoser || subscribeToWinner, objectType,
        loser.getUuid(), winner.getUuid());
    // And unsubscribe
    deleteSubscription(subscribeToWinner, loserSubscriptionUuid);
    deleteSubscription(false, winnerSubscriptionUuid);
  }
}
