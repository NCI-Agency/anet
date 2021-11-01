package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.ws.rs.ClientErrorException;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.AnetBeanList_Task;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.OrganizationType;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.client.TaskSearchQueryInput;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import mil.dds.anet.test.utils.UtilsTest;
import org.junit.jupiter.api.Test;

public class TaskResourceTest extends AbstractResourceTest {

  protected static final String FIELDS =
      "{ uuid shortName longName category customFieldRef1 { uuid } taskedOrganizations { uuid }"
          + " status customFields }";

  @Test
  public void taskTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Task taskA = adminMutationExecutor.createTask(FIELDS,
        TestData.createTaskInput("TestF1", "Do a thing with a person", "Test-EF",
            // set JSON of customFields
            UtilsTest.getCombinedJsonTestCase().getInput()));
    assertThat(taskA).isNotNull();
    assertThat(taskA.getUuid()).isNotNull();
    // check that JSON of customFields is sanitized after create
    assertThat(taskA.getCustomFields()).isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    final TaskInput taskAInput = getTaskInput(taskA);

    final Task createdB =
        adminMutationExecutor.createTask(FIELDS, TestData.createTaskInput("TestM1",
            "Teach a person how to fish", "Test-Milestone", taskAInput, null, Status.ACTIVE));
    assertThat(createdB).isNotNull();
    assertThat(createdB.getUuid()).isNotNull();

    final Task createdC =
        adminMutationExecutor.createTask(FIELDS, TestData.createTaskInput("TestM2",
            "Watch the person fishing", "Test-Milestone", taskAInput, null, Status.ACTIVE));
    assertThat(createdC).isNotNull();
    assertThat(createdC.getUuid()).isNotNull();

    final Task createdD = adminMutationExecutor.createTask(FIELDS,
        TestData.createTaskInput("TestM3", "Have the person go fishing without you",
            "Test-Milestone", taskAInput, null, Status.ACTIVE));
    assertThat(createdD).isNotNull();
    assertThat(createdD.getUuid()).isNotNull();

    final Task createdE =
        adminMutationExecutor.createTask(FIELDS, TestData.createTaskInput("TestF2",
            "Be a thing in a test case", "Test-EF", null, null, Status.ACTIVE));
    assertThat(createdE).isNotNull();
    assertThat(createdE.getUuid()).isNotNull();

    // modify a task.
    taskAInput.setLongName("Do a thing with a person modified");
    // update JSON of customFields
    taskAInput.setCustomFields(UtilsTest.getCombinedJsonTestCase().getInput());
    final Integer nrUpdated = adminMutationExecutor.updateTask("", taskAInput);
    assertThat(nrUpdated).isEqualTo(1);
    final Task returnedA = adminQueryExecutor.task(FIELDS, taskA.getUuid());
    assertThat(returnedA.getLongName()).isEqualTo(taskAInput.getLongName());
    // check that JSON of customFields is sanitized after update
    assertThat(returnedA.getCustomFields())
        .isEqualTo(UtilsTest.getCombinedJsonTestCase().getOutput());

    // Assign the Task to the AO
    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("EF8").build();
    final AnetBeanList_Organization orgs =
        jackQueryExecutor.organizationList(getListFields("{ uuid shortName }"), queryOrgs);
    final Organization ef8 =
        orgs.getList().stream().filter(o -> o.getShortName().equals("EF8")).findFirst().get();
    assertThat(ef8).isNotNull();

    taskAInput.setTaskedOrganizations(Collections.singletonList(getOrganizationInput(ef8)));
    final Integer nrUpdated2 = adminMutationExecutor.updateTask("", taskAInput);
    assertThat(nrUpdated2).isEqualTo(1);
    final Task returnedA2 = jackQueryExecutor.task(FIELDS, taskA.getUuid());
    assertThat(returnedA2.getTaskedOrganizations().iterator().next().getUuid())
        .isEqualTo(ef8.getUuid());

    // Fetch the tasks of the organization
    final TaskSearchQueryInput queryTasks =
        TaskSearchQueryInput.builder().withTaskedOrgUuid(ef8.getUuid()).build();
    final AnetBeanList_Task tasks = jackQueryExecutor.taskList(getListFields(FIELDS), queryTasks);
    assertThat(tasks.getList()).anyMatch(t -> t.getUuid().equals(returnedA.getUuid()));

    // set task to inactive
    taskAInput.setStatus(Status.INACTIVE);
    final Integer nrUpdated3 = adminMutationExecutor.updateTask("", taskAInput);
    assertThat(nrUpdated3).isEqualTo(1);
    final Task returnedA3 = jackQueryExecutor.task(FIELDS, taskA.getUuid());
    assertThat(returnedA3.getStatus()).isEqualTo(Status.INACTIVE);
  }

  @Test
  public void searchTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    TaskSearchQueryInput query = TaskSearchQueryInput.builder().withText("Budget").build();
    final AnetBeanList_Task searchObjects =
        jackQueryExecutor.taskList(getListFields(FIELDS), query);
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final List<Task> searchResults = searchObjects.getList();
    assertThat(searchResults).isNotEmpty();
    assertThat(searchResults.stream().filter(p -> p.getLongName().toLowerCase().contains("budget"))
        .count()).isEqualTo(searchResults.size());

    // Search for a task by the organization
    final OrganizationSearchQueryInput queryOrgs =
        OrganizationSearchQueryInput.builder().withText("EF 2").build();
    final AnetBeanList_Organization orgs =
        jackQueryExecutor.organizationList(getListFields("{ uuid shortName }"), queryOrgs);
    final Organization ef2 =
        orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2")).findFirst().get();
    assertThat(ef2).isNotNull();

    query.setText(null);
    query.setTaskedOrgUuid(ef2.getUuid());
    final AnetBeanList_Task searchObjects2 =
        jackQueryExecutor.taskList(getListFields(FIELDS), query);
    assertThat(searchObjects2).isNotNull();
    assertThat(searchObjects2.getList()).isNotEmpty();
    final List<Task> searchResults2 = searchObjects2.getList();
    assertThat(searchResults2).isNotEmpty();
    assertThat(searchResults2.stream()
        .filter(p -> p.getTaskedOrganizations().stream()
            .anyMatch(org -> org.getUuid().equals(ef2.getUuid())))
        .count()).isEqualTo(searchResults2.size());

    // Search by category
    query.setTaskedOrgUuid(null);
    query.setText("expenses");
    query.setCategory("Milestone");
    final AnetBeanList_Task searchObjects3 =
        jackQueryExecutor.taskList(getListFields(FIELDS), query);
    assertThat(searchObjects3).isNotNull();
    assertThat(searchObjects3.getList()).isNotEmpty();
    final List<Task> searchResults3 = searchObjects3.getList();
    assertThat(searchResults3).isNotEmpty();

    // Search by responsible position
    final Position jackPosition = getJackJackson().getPosition();
    query.setResponsiblePositionUuid(jackPosition.getUuid());
    query.setText("");
    final AnetBeanList_Task searchObjects4 =
        jackQueryExecutor.taskList(getListFields(FIELDS), query);
    assertThat(searchObjects4).isNotNull();
    assertThat(searchObjects4.getList()).isNotEmpty();
    final List<Task> searchResults4 = searchObjects4.getList();
    assertThat(searchResults4).isNotEmpty();

    // Autocomplete
    query = TaskSearchQueryInput.builder().withText("1.1*").build();
    final AnetBeanList_Task searchObjects5 =
        jackQueryExecutor.taskList(getListFields(FIELDS), query);
    assertThat(searchObjects5).isNotNull();
    assertThat(searchObjects5.getList()).isNotEmpty();
    final List<Task> searchResults5 = searchObjects5.getList();
    assertThat(searchResults5.stream().filter(p -> p.getShortName().equals("1.1")).count())
        .isEqualTo(1);
    assertThat(searchResults5.stream().filter(p -> p.getShortName().equals("1.1.A")).count())
        .isEqualTo(1);
    assertThat(searchResults5.stream().filter(p -> p.getShortName().equals("1.1.B")).count())
        .isEqualTo(1);

    query.setText("1.1.A*");
    final AnetBeanList_Task searchObjects6 =
        jackQueryExecutor.taskList(getListFields(FIELDS), query);
    assertThat(searchObjects6).isNotNull();
    assertThat(searchObjects6.getList()).isNotEmpty();
    final List<Task> searchResults6 = searchObjects6.getList();
    assertThat(searchResults6.stream().filter(p -> p.getShortName().equals("1.1.A")).count())
        .isEqualTo(1);
  }

  @Test
  public void duplicateTaskTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Task created = adminMutationExecutor.createTask(FIELDS,
        TestData.createTaskInput("DupTest", "Test dups", "Test-EF"));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();

    // Trying to create another task with the same shortName should fail
    try {
      adminMutationExecutor.createTask(FIELDS,
          TestData.createTaskInput("DupTest", "Test dups", "Test-EF"));
      fail("Expected ClientErrorException");
    } catch (ClientErrorException expectedException) {
    }
  }

  @Test
  public void taskCreateAdminPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    createTask(admin);
  }

  @Test
  public void taskCreateSuperUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    createTask(getSuperUser());
  }

  @Test
  public void taskCreateRegularUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    createTask(getRegularUser());
  }

  private void createTask(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final QueryExecutor userQueryExecutor = getQueryExecutor(user.getDomainUsername());
    final MutationExecutor userMutationExecutor = getMutationExecutor(user.getDomainUsername());
    final String orgFields = "{ uuid shortName longName status identificationCode type }";
    final Position position = user.getPosition();
    final boolean isAdmin = position.getType() == PositionType.ADMINISTRATOR;
    final Organization organization = position.getOrganization();

    // principal organization
    final OrganizationSearchQueryInput query =
        OrganizationSearchQueryInput.builder().withType(OrganizationType.PRINCIPAL_ORG).build();
    final AnetBeanList_Organization principalOrgs =
        userQueryExecutor.organizationList(getListFields(orgFields), query);
    assertThat(principalOrgs).isNotNull();
    assertThat(principalOrgs.getList()).isNotEmpty();
    final Organization principalOrg = principalOrgs.getList().get(0);
    final TaskInput taskPrincipalInput =
        TestData.createTaskInput("Test task principal " + UUID.randomUUID().toString(),
            "Test permissions principal org", "Test-PT-Principal");
    taskPrincipalInput
        .setTaskedOrganizations(Collections.singletonList(getOrganizationInput(principalOrg)));
    try {
      final Task createdTask = userMutationExecutor.createTask(FIELDS, taskPrincipalInput);
      if (isAdmin) {
        assertThat(createdTask).isNotNull();
        assertThat(createdTask.getUuid()).isNotNull();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }

    // own organization
    final TaskInput taskOwnInput = TestData.createTaskInput(
        "Test task own " + UUID.randomUUID().toString(), "Test permissions own org", "Test-PT-Own");
    taskPrincipalInput
        .setTaskedOrganizations(Collections.singletonList(getOrganizationInput(organization)));
    try {
      final Task createdTask = userMutationExecutor.createTask(FIELDS, taskOwnInput);
      if (isAdmin) {
        assertThat(createdTask).isNotNull();
        assertThat(createdTask.getUuid()).isNotNull();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }

    // other advisor organization
    final OrganizationSearchQueryInput query2 =
        OrganizationSearchQueryInput.builder().withType(OrganizationType.ADVISOR_ORG).build();
    final AnetBeanList_Organization advisorOrgs =
        userQueryExecutor.organizationList(getListFields(orgFields), query2);
    assertThat(advisorOrgs).isNotNull();
    assertThat(advisorOrgs.getList()).isNotEmpty();
    final Optional<Organization> foundOrg = advisorOrgs.getList().stream()
        .filter(o -> !organization.getUuid().equals(o.getUuid())).findFirst();
    assertThat(foundOrg.isPresent()).isTrue();
    final Organization advisorOrg = foundOrg.get();
    final TaskInput taskOtherInput =
        TestData.createTaskInput("Test task other " + UUID.randomUUID().toString(),
            "Test permissions other org", "Test-PT-Other");
    taskOtherInput
        .setTaskedOrganizations(Collections.singletonList(getOrganizationInput(advisorOrg)));
    try {
      userMutationExecutor.createTask(FIELDS, taskOtherInput);
    } catch (ForbiddenException expectedException) {
    }
  }

}
