package mil.dds.anet.test.resources.merge;

import static mil.dds.anet.test.client.Status.ACTIVE;
import static mil.dds.anet.test.client.Status.INACTIVE;
import static mil.dds.anet.test.resources.TaskResourceTest.FIELDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.resources.AbstractResourceTest;
import org.junit.jupiter.api.Test;

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

  @Test
  void shouldMerge() {
    final var loserInput = TaskInput.builder().withShortName("LM1").withLongName("Loser for Merge")
        .withStatus(INACTIVE).build();
    final var loser =
        withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, loserInput));
    assertThat(loser).isNotNull().extracting(Task::getUuid).isNotNull();

    final var winnerInput = TaskInput.builder().withShortName("WM1")
        .withLongName("Winner for Merge").withStatus(ACTIVE).build();
    final var winner =
        withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, winnerInput));

    final var mergeInput = getTaskInput(winner);
    mergeInput.setStatus(loser.getStatus());
    final var updated = withCredentials(adminUser,
        t -> mutationExecutor.mergeTasks("", loser.getUuid(), mergeInput));
    assertThat(updated).isOne();

    assertThatThrownBy(
        () -> withCredentials(adminUser, t -> queryExecutor.task(FIELDS, loser.getUuid())))
        .isInstanceOf(Exception.class);
  }
}
