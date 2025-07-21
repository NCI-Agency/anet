package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.AnetBeanList_Task;
import mil.dds.anet.test.client.AssessmentSearchQueryInput;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.client.TaskSearchQueryInput;
import mil.dds.anet.test.utils.UtilsTest;
import org.junit.jupiter.api.Test;

class TaskResourceTest extends AbstractResourceTest {

  protected static final String FIELDS =
      "{ uuid shortName longName description category parentTask { uuid } taskedOrganizations { uuid }"
          + " status customFields }";

  @Test
  void taskTest() {
    final Task taskA = withCredentials(adminUser,
        t -> mutationExecutor.createTask(FIELDS,
            TestData.createTaskInput("TestF1", "Do a thing with a person", "Test-EF",
                // set JSON of customFields
                UtilsTest.getCombinedJsonTestCase().getInput())));
    assertThat(taskA).isNotNull();
    assertThat(taskA.getUuid()).isNotNull();
    // check that JSON of customFields is sanitized after create
    assertThat(taskA.getCustomFields()).isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    final TaskInput taskAInput = getTaskInput(taskA);

    final Task createdB = withCredentials(adminUser,
        t -> mutationExecutor.createTask(FIELDS, TestData.createTaskInput("TestM1",
            "Teach a person how to fish", "Test-Milestone", taskAInput, null, Status.ACTIVE)));
    assertThat(createdB).isNotNull();
    assertThat(createdB.getUuid()).isNotNull();

    final Task createdC = withCredentials(adminUser,
        t -> mutationExecutor.createTask(FIELDS, TestData.createTaskInput("TestM2",
            "Watch the person fishing", "Test-Milestone", taskAInput, null, Status.ACTIVE)));
    assertThat(createdC).isNotNull();
    assertThat(createdC.getUuid()).isNotNull();

    final Task createdD = withCredentials(adminUser,
        t -> mutationExecutor.createTask(FIELDS,
            TestData.createTaskInput("TestM3", "Have the person go fishing without you",
                "Test-Milestone", taskAInput, null, Status.ACTIVE)));
    assertThat(createdD).isNotNull();
    assertThat(createdD.getUuid()).isNotNull();

    final Task createdE = withCredentials(adminUser,
        t -> mutationExecutor.createTask(FIELDS, TestData.createTaskInput("TestF2",
            "Be a thing in a test case", "Test-EF", null, null, Status.ACTIVE)));
    assertThat(createdE).isNotNull();
    assertThat(createdE.getUuid()).isNotNull();

    // modify a task.
    taskAInput.setLongName("Do a thing with a person modified");
    // update JSON of customFields
    taskAInput.setCustomFields(UtilsTest.getCombinedJsonTestCase().getInput());
    Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateTask("", taskAInput));
    assertThat(nrUpdated).isEqualTo(1);
    final Task returnedA =
        withCredentials(adminUser, t -> queryExecutor.task(FIELDS, taskA.getUuid()));
    assertThat(returnedA.getLongName()).isEqualTo(taskAInput.getLongName());
    // check that JSON of customFields is sanitized after update
    assertThat(returnedA.getCustomFields())
        .isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    // update description
    taskAInput.setDescription(UtilsTest.getCombinedHtmlTestCase().getInput());
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.updateTask("", taskAInput));
    assertThat(nrUpdated).isEqualTo(1);

    // add html to description and ensure it gets stripped out.
    taskAInput.setDescription(
        "<b>Hello world</b>.  I like script tags! <script>window.alert('hello world')</script>");
    nrUpdated = withCredentials(adminUser, t -> mutationExecutor.updateTask("", taskAInput));
    assertThat(nrUpdated).isEqualTo(1);
    final Task updated =
        withCredentials(adminUser, t -> queryExecutor.task(FIELDS, taskA.getUuid()));
    assertThat(updated.getDescription()).contains("<b>Hello world</b>");
    assertThat(updated.getDescription()).doesNotContain("<script>window.alert");

    // Assign the Task to the AO
    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("EF8").build();
    final AnetBeanList_Organization orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields("{ uuid shortName }"), queryOrgs));
    final Organization ef8 =
        orgs.getList().stream().filter(o -> o.getShortName().equals("EF8")).findFirst().get();
    assertThat(ef8).isNotNull();

    taskAInput.setTaskedOrganizations(Collections.singletonList(getOrganizationInput(ef8)));
    final Integer nrUpdated2 =
        withCredentials(adminUser, t -> mutationExecutor.updateTask("", taskAInput));
    assertThat(nrUpdated2).isEqualTo(1);
    final Task returnedA2 =
        withCredentials(jackUser, t -> queryExecutor.task(FIELDS, taskA.getUuid()));
    assertThat(returnedA2.getTaskedOrganizations().iterator().next().getUuid())
        .isEqualTo(ef8.getUuid());

    // Fetch the tasks of the organization
    final TaskSearchQueryInput queryTasks =
        TaskSearchQueryInput.builder().withTaskedOrgUuid(List.of(ef8.getUuid())).build();
    final AnetBeanList_Task tasks =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), queryTasks));
    assertThat(tasks.getList()).anyMatch(t -> t.getUuid().equals(returnedA.getUuid()));

    // set task to inactive
    taskAInput.setStatus(Status.INACTIVE);
    final Integer nrUpdated3 =
        withCredentials(adminUser, t -> mutationExecutor.updateTask("", taskAInput));
    assertThat(nrUpdated3).isEqualTo(1);
    final Task returnedA3 =
        withCredentials(jackUser, t -> queryExecutor.task(FIELDS, taskA.getUuid()));
    assertThat(returnedA3.getStatus()).isEqualTo(Status.INACTIVE);
  }

  @Test
  void searchTest() {
    final TaskSearchQueryInput query1 = TaskSearchQueryInput.builder().withText("Budget").build();
    final AnetBeanList_Task searchObjects =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), query1));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final List<Task> searchResults = searchObjects.getList();
    assertThat(searchResults).isNotEmpty();
    assertThat(searchResults.stream().filter(p -> p.getLongName().toLowerCase().contains("budget"))
        .count()).isEqualTo(searchResults.size());

    // Search for a task by the organization
    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("EF 2").build();
    final AnetBeanList_Organization orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields("{ uuid shortName }"), queryOrgs));
    final Organization ef2 =
        orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2")).findFirst().get();
    assertThat(ef2).isNotNull();

    query1.setText(null);
    query1.setTaskedOrgUuid(List.of(ef2.getUuid()));
    final AnetBeanList_Task searchObjects2 =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), query1));
    assertThat(searchObjects2).isNotNull();
    assertThat(searchObjects2.getList()).isNotEmpty();
    final List<Task> searchResults2 = searchObjects2.getList();
    assertThat(searchResults2).isNotEmpty();
    assertThat(searchResults2.stream()
        .filter(p -> p.getTaskedOrganizations().stream()
            .anyMatch(org -> org.getUuid().equals(ef2.getUuid())))
        .count()).isEqualTo(searchResults2.size());

    // Search by category
    query1.setTaskedOrgUuid(null);
    query1.setText("expenses");
    query1.setCategory("Milestone");
    final AnetBeanList_Task searchObjects3 =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), query1));
    assertThat(searchObjects3).isNotNull();
    assertThat(searchObjects3.getList()).isNotEmpty();
    final List<Task> searchResults3 = searchObjects3.getList();
    assertThat(searchResults3).isNotEmpty();

    // Search by responsible position
    final Position andrewPosition = getAndrewAnderson().getPosition();
    query1.setResponsiblePositionUuid(andrewPosition.getUuid());
    query1.setText("");
    final AnetBeanList_Task searchObjects4 =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), query1));
    assertThat(searchObjects4).isNotNull();
    assertThat(searchObjects4.getList()).isNotEmpty();
    final List<Task> searchResults4 = searchObjects4.getList();
    assertThat(searchResults4).isNotEmpty();

    // Autocomplete
    final TaskSearchQueryInput query2 = TaskSearchQueryInput.builder().withText("1.1*").build();
    final AnetBeanList_Task searchObjects5 =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), query2));
    assertThat(searchObjects5).isNotNull();
    assertThat(searchObjects5.getList()).isNotEmpty();
    final List<Task> searchResults5 = searchObjects5.getList();
    assertThat(searchResults5.stream().filter(p -> p.getShortName().equals("1.1")).count())
        .isEqualTo(1);
    assertThat(searchResults5.stream().filter(p -> p.getShortName().equals("1.1.A")).count())
        .isEqualTo(1);
    assertThat(searchResults5.stream().filter(p -> p.getShortName().equals("1.1.B")).count())
        .isEqualTo(1);

    query2.setText("1.1.A*");
    final AnetBeanList_Task searchObjects6 =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), query2));
    assertThat(searchObjects6).isNotNull();
    assertThat(searchObjects6.getList()).isNotEmpty();
    final List<Task> searchResults6 = searchObjects6.getList();
    assertThat(searchResults6.stream().filter(p -> p.getShortName().equals("1.1.A")).count())
        .isEqualTo(1);
  }

  @Test
  void shouldFindOnlyUnassignedTasks() {
    final var query = TaskSearchQueryInput.builder().withIsAssigned(false).build();
    final var searchObjects =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final var searchResults = searchObjects.getList();
    assertThat(searchResults).isNotEmpty()
        .allSatisfy(result -> assertThat(result.getTaskedOrganizations()).isNullOrEmpty());
  }

  @Test
  void searchAssessmentsTestForTaskMonthly() {
    final String assessmentKey = "taskMonthly";
    final String matchingShortName = "1.1.A";
    searchForAssessments(assessmentKey, null, matchingShortName);
    searchForAssessments(assessmentKey, Map.of("status", List.of("GREEN")), matchingShortName);
    searchForAssessments(assessmentKey, Map.of("status", List.of("GREEN", "AMBER", "RED")),
        matchingShortName);
    searchForAssessments(assessmentKey, Map.of("status", List.of("RED")), null);
  }

  private void searchForAssessments(final String key, final Map<?, ?> filters,
      final String matchingShortName) {
    final AssessmentSearchQueryInput aq = AssessmentSearchQueryInput.builder().withKey(key)
        .withFilters(filters == null ? null : new HashMap<>(filters)).build();
    final TaskSearchQueryInput q = TaskSearchQueryInput.builder().withAssessment(aq).build();
    final AnetBeanList_Task result =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), q));
    if (matchingShortName == null) {
      assertThat(result.getList()).isEmpty();
    } else {
      assertThat(result.getList()).isNotEmpty()
          .anyMatch(o -> matchingShortName.equals(o.getShortName()));
    }
  }

  @Test
  void duplicateTaskTest() {
    final Task taskEF7 = withCredentials(adminUser,
        t -> queryExecutor.task(FIELDS, "19364d81-3203-483d-a6bf-461d58888c76"));
    final Task taskEF8 = withCredentials(adminUser,
        t -> queryExecutor.task(FIELDS, "9b9f4205-0721-4893-abf8-69e020d4db23"));

    final TaskInput taskInput = TestData.createTaskInput("DupTest " + UUID.randomUUID(),
        "Test dups", "Test-EF", getTaskInput(taskEF7), null, Status.ACTIVE);
    final Task created =
        withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, taskInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();

    // Trying to create another task with the same shortName but a different parentTask should
    // succeed
    taskInput.setParentTask(getTaskInput(taskEF8));
    final Task created2 =
        withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, taskInput));
    assertThat(created2).isNotNull();
    assertThat(created2.getUuid()).isNotNull();

    // Trying to create another task with the same shortName and parentTask should fail
    try {
      withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, taskInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Trying to create another task with a different shortName but the same parentTask should
    // succeed
    taskInput.setShortName("DupTest " + UUID.randomUUID());
    final Task created3 =
        withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, taskInput));
    assertThat(created3).isNotNull();
    assertThat(created3.getUuid()).isNotNull();

    // Trying to create another top-level task with a duplicate shortName should fail
    final TaskInput topLevelTaskInput = TestData.createTaskInput(taskEF7.getShortName(),
        "Test dups", "Test-EF 7", null, null, Status.ACTIVE);
    try {
      withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, topLevelTaskInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Trying to create another top-level task with a different shortName should succeed
    topLevelTaskInput.setShortName("DupTest " + UUID.randomUUID());
    final Task created4 =
        withCredentials(adminUser, t -> mutationExecutor.createTask(FIELDS, topLevelTaskInput));
    assertThat(created4).isNotNull();
    assertThat(created4.getUuid()).isNotNull();
  }

  @Test
  void taskSuperuserPermissionTest() {
    // Bob is a regular superuser
    final Person superuser = getBobBobtown();
    final Position superuserPosition = superuser.getPosition();

    final TaskInput taskInput = TaskInput.builder().withShortName("Parent Task 1")
        .withLongName("Task 1 for Testing Superusers").withStatus(Status.ACTIVE).build();
    failCreateTask(getDomainUsername(superuser), taskInput);
    final Task parentTask = succeedCreateTask(adminUser, taskInput);

    final TaskInput childTaskInput = TaskInput.builder().withShortName("Child Task 1")
        .withLongName("Child Task of Parent Task 1").withStatus(Status.ACTIVE)
        .withParentTask(getTaskInput(parentTask)).build();
    failCreateTask(getDomainUsername(superuser), childTaskInput);

    // Set superuser as responsible for the parent task
    parentTask.setResponsiblePositions(List.of(superuserPosition));
    succeedUpdateTask(adminUser, getTaskInput(parentTask));

    final Task createdChildTask = succeedCreateTask(getDomainUsername(superuser), childTaskInput);

    // Can edit the child of their responsible task
    createdChildTask.setShortName("Updated Child Task 1");
    succeedUpdateTask(getDomainUsername(superuser), getTaskInput(createdChildTask));
  }

  @Test
  void taskCanCreateTopLevelTasksSuperuserPermissionTest() {
    // Jim is a superuser that can create top level tasks

    // Can create top level task
    final TaskInput taskInput = TaskInput.builder().withShortName("Parent Task 2")
        .withLongName("Task 2 for Testing Superusers").withStatus(Status.ACTIVE).build();
    final Task newTopLevelTask = succeedCreateTask("jim", taskInput);
    // and edit it and created sub-tasks of the top level task he created
    succeedUpdateTask("jim", getTaskInput(newTopLevelTask));
    final TaskInput childTaskInput = TaskInput.builder().withShortName("Child Task 2")
        .withLongName("Child Task of Parent Task 2").withStatus(Status.ACTIVE)
        .withParentTask(getTaskInput(newTopLevelTask)).build();
    succeedCreateTask("jim", childTaskInput);

    // Can NOT edit and create sub-tasks of an existing task: EF 1
    final Task ef1 = withCredentials(jackUser,
        t -> queryExecutor.task("{ uuid }", "1145e584-4485-4ce0-89c4-2fa2e1fe846a"));
    // Can NOT edit EF 1
    failUpdateTask("jim", getTaskInput(ef1));
    // Can NOT create a sub task of EF 1
    final TaskInput childTaskInput2 =
        TaskInput.builder().withShortName("EF 1 new child").withLongName("New Child Task of EF 1")
            .withStatus(Status.ACTIVE).withParentTask(getTaskInput(ef1)).build();
    failCreateTask("jim", childTaskInput2);
  }

  @Test
  void taskCanCreateEditAnyTaskSuperuserPermissionTest() {
    // Billie is a superuser that can create or edit any task

    // Can create top level task
    final TaskInput taskInput = TaskInput.builder().withShortName("Parent Task 3")
        .withLongName("Task 3 for Testing Superusers").withStatus(Status.ACTIVE).build();
    final Task newTopLevelTask = succeedCreateTask("billie", taskInput);
    // and edit it and created sub-tasks of the top level task he created
    succeedUpdateTask("billie", getTaskInput(newTopLevelTask));
    final TaskInput childTaskInput = TaskInput.builder().withShortName("Child Task 3")
        .withLongName("Child Task of Parent Task 3").withStatus(Status.ACTIVE)
        .withParentTask(getTaskInput(newTopLevelTask)).build();
    succeedCreateTask("billie", childTaskInput);

    // Can edit and create sub-tasks of an existing task: EF 1
    final Task ef1 = withCredentials(jackUser,
        t -> queryExecutor.task(FIELDS, "1145e584-4485-4ce0-89c4-2fa2e1fe846a"));
    // Can edit EF 1
    succeedUpdateTask("billie", getTaskInput(ef1));
    // Can create a sub task of EF 1
    final TaskInput childTaskInput2 =
        TaskInput.builder().withShortName("EF 1 new child").withLongName("New Child Task of EF 1")
            .withStatus(Status.ACTIVE).withParentTask(getTaskInput(ef1)).build();
    succeedCreateTask("billie", childTaskInput2);
  }

  @Test
  void changeParentTaskAsSuperuserTest() {
    final Person superuser = getBobBobtown();
    final Position superuserPosition = superuser.getPosition();

    final TaskInput taskInput = TaskInput.builder().withShortName("Parent Task 4")
        .withLongName("Task 4 for Testing Superusers").withStatus(Status.ACTIVE).build();
    final Task createdParentTask = succeedCreateTask(adminUser, taskInput);

    final TaskInput childTaskInput = TaskInput.builder().withShortName("Child Task 4")
        .withLongName("Child Task of Parent Task 4").withStatus(Status.ACTIVE)
        .withParentTask(getTaskInput(createdParentTask)).build();
    final Task createdChildTask = succeedCreateTask(adminUser, childTaskInput);

    createdChildTask.setParentTask(null);
    failUpdateTask(getDomainUsername(superuser), getTaskInput(createdChildTask));
    createdChildTask.setParentTask(createdParentTask);

    // Set superuser as responsible for the child task
    createdChildTask.setResponsiblePositions(List.of(superuserPosition));
    succeedUpdateTask(adminUser, getTaskInput(createdChildTask));

    // Cannot set parent as null because they're not responsible for the parent task
    createdChildTask.setParentTask(null);
    failUpdateTask(getDomainUsername(superuser), getTaskInput(createdChildTask));
    createdChildTask.setParentTask(createdParentTask);
    // Set superuser as responsible for the parent task
    createdParentTask.setResponsiblePositions(List.of(superuserPosition));
    succeedUpdateTask(adminUser, getTaskInput(createdParentTask));
    // Now superuser can set the parent task as null
    createdChildTask.setParentTask(null);
    succeedUpdateTask(getDomainUsername(superuser), getTaskInput(createdChildTask));

    final TaskInput newParentTask = TaskInput.builder().withShortName("New Parent Task 4")
        .withLongName("New Parent Task 4 for Testing Superusers").withStatus(Status.ACTIVE).build();

    final Task createdNewParentTask = succeedCreateTask(adminUser, newParentTask);

    // Cannot assign the new task as the child's parent because they're not responsible for
    // the new task
    createdChildTask.setParentTask(createdNewParentTask);
    failUpdateTask(getDomainUsername(superuser), getTaskInput(createdChildTask));
    // Revert previous change
    createdChildTask.setParentTask(createdParentTask);

    // Update responsible position
    createdNewParentTask.setResponsiblePositions(List.of(superuserPosition));
    succeedUpdateTask(adminUser, getTaskInput(createdNewParentTask));

    // Now they can assign the new parent
    createdChildTask.setParentTask(createdNewParentTask);
    succeedUpdateTask(getDomainUsername(superuser), getTaskInput(createdChildTask));
  }

  @Test
  void illegalParentTaskTest() {
    final String testTopTaskUuid = "cd35abe7-a5c9-4b3e-885b-4c72bf564ed7"; // EF 1
    final Task topTask =
        withCredentials(adminUser, t -> queryExecutor.task(FIELDS, testTopTaskUuid));
    assertThat(topTask).isNotNull();
    assertThat(topTask.getUuid()).isEqualTo(testTopTaskUuid);

    final String testSubTaskUuid = "cd35abe7-a5c9-4b3e-885b-4c72bf564ed7"; // 1.1
    final Task subTask =
        withCredentials(adminUser, t -> queryExecutor.task(FIELDS, testSubTaskUuid));
    assertThat(subTask).isNotNull();
    assertThat(subTask.getUuid()).isEqualTo(testSubTaskUuid);

    // Set self as parent
    final TaskInput topTaskInput = getTaskInput(topTask);
    final TaskInput parentTopTaskInput = getTaskInput(topTask);
    topTaskInput.setParentTask(parentTopTaskInput);
    try {
      // Should fail, as it would create a loop
      withCredentials(adminUser, t -> mutationExecutor.updateTask("", topTaskInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Set subTask as parent
    final TaskInput parentSubTaskInput = getTaskInput(subTask);
    topTaskInput.setParentTask(parentSubTaskInput);
    try {
      // Should fail, as it would create a loop
      withCredentials(adminUser, t -> mutationExecutor.updateTask("", topTaskInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void taskCreateAdminPermissionTest() {
    createTask(admin);
  }

  @Test
  void taskCreateSuperuserPermissionTest() {
    createTask(getSuperuser());
  }

  @Test
  void taskCreateRegularUserPermissionTest() {
    createTask(getRegularUser());
  }

  private void createTask(Person user) {
    final String orgFields = "{ uuid shortName longName status identificationCode }";
    final Position position = user.getPosition();
    final boolean isAdmin = position.getType() == PositionType.ADMINISTRATOR;
    final Organization organization = position.getOrganization();

    // interlocutor organization
    final OrganizationSearchQueryInput query = OrganizationSearchQueryInput.builder().build();
    final AnetBeanList_Organization interlocutorOrgs = withCredentials(getDomainUsername(user),
        t -> queryExecutor.organizationList(getListFields(orgFields), query));
    assertThat(interlocutorOrgs).isNotNull();
    assertThat(interlocutorOrgs.getList()).isNotEmpty();
    final Organization interlocutorOrg = interlocutorOrgs.getList().get(0);
    final TaskInput taskInterlocutorInput =
        TestData.createTaskInput("Test task interlocutor " + UUID.randomUUID(),
            "Test permissions interlocutor org", "Test-PT-Interlocutor");
    taskInterlocutorInput
        .setTaskedOrganizations(Collections.singletonList(getOrganizationInput(interlocutorOrg)));
    try {
      final Task createdTask = withCredentials(getDomainUsername(user),
          t -> mutationExecutor.createTask(FIELDS, taskInterlocutorInput));
      if (isAdmin) {
        assertThat(createdTask).isNotNull();
        assertThat(createdTask.getUuid()).isNotNull();
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }

    // own organization
    final TaskInput taskOwnInput = TestData.createTaskInput("Test task own " + UUID.randomUUID(),
        "Test permissions own org", "Test-PT-Own");
    taskInterlocutorInput
        .setTaskedOrganizations(Collections.singletonList(getOrganizationInput(organization)));
    try {
      final Task createdTask = withCredentials(getDomainUsername(user),
          t -> mutationExecutor.createTask(FIELDS, taskOwnInput));
      if (isAdmin) {
        assertThat(createdTask).isNotNull();
        assertThat(createdTask.getUuid()).isNotNull();
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }

    // other advisor organization
    final OrganizationSearchQueryInput query2 = OrganizationSearchQueryInput.builder().build();
    final AnetBeanList_Organization advisorOrgs = withCredentials(getDomainUsername(user),
        t -> queryExecutor.organizationList(getListFields(orgFields), query2));
    assertThat(advisorOrgs).isNotNull();
    assertThat(advisorOrgs.getList()).isNotEmpty();
    final Optional<Organization> foundOrg = advisorOrgs.getList().stream()
        .filter(o -> !organization.getUuid().equals(o.getUuid())).findFirst();
    assertThat(foundOrg).isPresent();
    final Organization advisorOrg = foundOrg.get();
    final TaskInput taskOtherInput = TestData.createTaskInput(
        "Test task other " + UUID.randomUUID(), "Test permissions other org", "Test-PT-Other");
    taskOtherInput
        .setTaskedOrganizations(Collections.singletonList(getOrganizationInput(advisorOrg)));
    try {
      final Task createdTask = withCredentials(getDomainUsername(user),
          t -> mutationExecutor.createTask(FIELDS, taskOtherInput));
      if (isAdmin) {
        assertThat(createdTask).isNotNull();
        assertThat(createdTask.getUuid()).isNotNull();
      } else {
        fail("Expected an Exception");
      }
    } catch (Exception expectedException) {
      if (isAdmin) {
        fail("Unexpected Exception", expectedException);
      }
    }
  }

  @Test
  void shouldBeSearchableViaCustomFields() {
    final var searchText = "RED";
    final var query = TaskSearchQueryInput.builder().withText(searchText).build();
    final var searchObjects =
        withCredentials(adminUser, t -> queryExecutor.taskList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getTotalCount()).isOne();
    assertThat(searchObjects.getList()).allSatisfy(
        searchResult -> assertThat(searchResult.getCustomFields()).contains(searchText));
  }

  @Test
  void testTopLevelTasksSearch() {
    final TaskSearchQueryInput query = TaskSearchQueryInput.builder()
        .withParentTaskUuid(List.of(mil.dds.anet.beans.Task.DUMMY_TASK_UUID)).build();
    final AnetBeanList_Task searchObjects =
        withCredentials(jackUser, t -> queryExecutor.taskList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    assertThat(searchObjects.getList()).allMatch(t -> t.getParentTask() == null);
  }

  private void failCreateTask(final String username, final TaskInput taskInput) {
    try {
      withCredentials(username, t -> mutationExecutor.createTask(FIELDS, taskInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Task succeedCreateTask(final String username, final TaskInput taskInput) {
    final Task createdTask =
        withCredentials(username, t -> mutationExecutor.createTask(FIELDS, taskInput));
    assertThat(createdTask).isNotNull();
    assertThat(createdTask.getUuid()).isNotNull();
    return createdTask;
  }

  private void failUpdateTask(final String username, final TaskInput taskInput) {
    try {
      withCredentials(username, t -> mutationExecutor.updateTask("", taskInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void succeedUpdateTask(final String username, final TaskInput taskInput) {
    final Integer numTask =
        withCredentials(username, t -> mutationExecutor.updateTask("", taskInput));
    assertThat(numTask).isOne();
  }
}
