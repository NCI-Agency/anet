package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.type.TypeReference;
import java.io.UnsupportedEncodingException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.ws.rs.ClientErrorException;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Task.TaskStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import org.junit.Test;

public class TaskResourceTest extends AbstractResourceTest {

  private static final String FIELDS =
      "uuid shortName longName category customFieldRef1 { uuid } taskedOrganizations { uuid } status";

  @Test
  public void taskTest() {
    final Person jack = getJackJackson();

    final String aUuid = graphQLHelper.createObject(admin, "createTask", "task", "TaskInput",
        TestData.createTask("TestF1", "Do a thing with a person", "Test-EF"),
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(aUuid).isNotNull();
    final Task a = graphQLHelper.getObjectById(admin, "task", FIELDS, aUuid,
        new TypeReference<GraphQlResponse<Task>>() {});

    final String bUuid = graphQLHelper.createObject(
        admin, "createTask", "task", "TaskInput", TestData.createTask("TestM1",
            "Teach a person how to fish", "Test-Milestone", a, null, TaskStatus.ACTIVE),
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(bUuid).isNotNull();

    final String cUuid = graphQLHelper.createObject(
        admin, "createTask", "task", "TaskInput", TestData.createTask("TestM2",
            "Watch the person fishing", "Test-Milestone", a, null, TaskStatus.ACTIVE),
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(cUuid).isNotNull();

    final String dUuid = graphQLHelper.createObject(
        admin, "createTask", "task", "TaskInput", TestData.createTask("TestM3",
            "Have the person go fishing without you", "Test-Milestone", a, null, TaskStatus.ACTIVE),
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(dUuid).isNotNull();

    final String eUuid = graphQLHelper.createObject(
        admin, "createTask", "task", "TaskInput", TestData.createTask("TestF2",
            "Be a thing in a test case", "Test-EF", null, null, TaskStatus.ACTIVE),
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(eUuid).isNotNull();

    // modify a task.
    a.setLongName("Do a thing with a person modified");
    final Integer nrUpdated =
        graphQLHelper.updateObject(admin, "updateTask", "task", "TaskInput", a);
    assertThat(nrUpdated).isEqualTo(1);
    final Task returned = graphQLHelper.getObjectById(jack, "task", FIELDS, aUuid,
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(returned.getLongName()).isEqualTo(a.getLongName());

    // Assign the Task to the AO
    final OrganizationSearchQuery queryOrgs = new OrganizationSearchQuery();
    queryOrgs.setText("EF8");
    final AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(jack, "organizationList",
        "query", "OrganizationSearchQueryInput", "uuid shortName", queryOrgs,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    Organization ef8 =
        orgs.getList().stream().filter(o -> o.getShortName().equals("EF8")).findFirst().get();
    assertThat(ef8).isNotNull();

    a.setTaskedOrganizations(Collections.singletonList(ef8));
    final Integer nrUpdated2 =
        graphQLHelper.updateObject(admin, "updateTask", "task", "TaskInput", a);
    assertThat(nrUpdated2).isEqualTo(1);
    final Task returned2 = graphQLHelper.getObjectById(jack, "task", FIELDS, aUuid,
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(returned2.getTaskedOrganizations().iterator().next().getUuid())
        .isEqualTo(ef8.getUuid());

    // Fetch the tasks off the organization
    final TaskSearchQuery queryTasks = new TaskSearchQuery();
    queryTasks.setTaskedOrgUuid(ef8.getUuid());
    final AnetBeanList<Task> tasks =
        graphQLHelper.searchObjects(jack, "taskList", "query", "TaskSearchQueryInput", FIELDS,
            queryTasks, new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
    assertThat(tasks.getList()).contains(a);

    // Search for the task:

    // set task to inactive
    a.setStatus(TaskStatus.INACTIVE);
    final Integer nrUpdated3 =
        graphQLHelper.updateObject(admin, "updateTask", "task", "TaskInput", a);
    assertThat(nrUpdated3).isEqualTo(1);
    final Task returned3 = graphQLHelper.getObjectById(jack, "task", FIELDS, aUuid,
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(returned3.getStatus()).isEqualTo(TaskStatus.INACTIVE);
  }

  @Test
  public void searchTest() {
    Person jack = getJackJackson();

    TaskSearchQuery query = new TaskSearchQuery();
    query.setText("Budget");
    final AnetBeanList<Task> searchObjects =
        graphQLHelper.searchObjects(jack, "taskList", "query", "TaskSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getList()).isNotEmpty();
    final List<Task> searchResults = searchObjects.getList();
    assertThat(searchResults).isNotEmpty();
    assertThat(searchResults.stream().filter(p -> p.getLongName().toLowerCase().contains("budget"))
        .count()).isEqualTo(searchResults.size());

    // Search for a task by the organization
    final OrganizationSearchQuery queryOrgs = new OrganizationSearchQuery();
    queryOrgs.setText("EF 2");
    final AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(jack, "organizationList",
        "query", "OrganizationSearchQueryInput", "uuid shortName", queryOrgs,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    Organization ef2 =
        orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2")).findFirst().get();
    assertThat(ef2).isNotNull();

    query.setText(null);
    query.setTaskedOrgUuid(ef2.getUuid());
    final AnetBeanList<Task> searchObjects2 =
        graphQLHelper.searchObjects(jack, "taskList", "query", "TaskSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
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
    final AnetBeanList<Task> searchObjects3 =
        graphQLHelper.searchObjects(jack, "taskList", "query", "TaskSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
    assertThat(searchObjects3).isNotNull();
    assertThat(searchObjects3.getList()).isNotEmpty();
    final List<Task> searchResults3 = searchObjects3.getList();
    assertThat(searchResults3).isNotEmpty();

    // Autocomplete
    query = new TaskSearchQuery();
    query.setText("1.1*");
    final AnetBeanList<Task> searchObjects4 =
        graphQLHelper.searchObjects(jack, "taskList", "query", "TaskSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
    assertThat(searchObjects4).isNotNull();
    assertThat(searchObjects4.getList()).isNotEmpty();
    final List<Task> searchResults4 = searchObjects4.getList();
    assertThat(searchResults4.stream().filter(p -> p.getShortName().equals("1.1")).count())
        .isEqualTo(1);
    assertThat(searchResults4.stream().filter(p -> p.getShortName().equals("1.1.A")).count())
        .isEqualTo(1);
    assertThat(searchResults4.stream().filter(p -> p.getShortName().equals("1.1.B")).count())
        .isEqualTo(1);

    query.setText("1.1.A*");
    final AnetBeanList<Task> searchObjects5 =
        graphQLHelper.searchObjects(jack, "taskList", "query", "TaskSearchQueryInput", FIELDS,
            query, new TypeReference<GraphQlResponse<AnetBeanList<Task>>>() {});
    assertThat(searchObjects5).isNotNull();
    assertThat(searchObjects5.getList()).isNotEmpty();
    final List<Task> searchResults5 = searchObjects5.getList();
    assertThat(searchResults5.stream().filter(p -> p.getShortName().equals("1.1.A")).count())
        .isEqualTo(1);
  }

  @Test
  public void duplicateTaskTest() {
    final String aUuid = graphQLHelper.createObject(admin, "createTask", "task", "TaskInput",
        TestData.createTask("DupTest", "Test dups", "Test-EF"),
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(aUuid).isNotNull();

    // Trying to create another task with the same shortName should fail
    try {
      graphQLHelper.createObject(admin, "createTask", "task", "TaskInput",
          TestData.createTask("DupTest", "Test dups", "Test-EF"),
          new TypeReference<GraphQlResponse<Task>>() {});
      fail("Expected ClientErrorException");
    } catch (ClientErrorException expectedException) {
    }
  }

  @Test
  public void taskCreateAdminPermissionTest() throws UnsupportedEncodingException {
    createTask(admin);
  }

  @Test
  public void taskCreateSuperUserPermissionTest() throws UnsupportedEncodingException {
    createTask(getSuperUser());
  }

  @Test
  public void taskCreateRegularUserPermissionTest() throws UnsupportedEncodingException {
    createTask(getRegularUser());
  }

  private void createTask(Person user) {
    final String orgFields = "uuid shortName longName status identificationCode type";
    final Position position = user.getPosition();
    final boolean isAdmin = position.getType() == PositionType.ADMINISTRATOR;
    final Organization organization = position.getOrganization();

    // principal organization
    final OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setType(OrganizationType.PRINCIPAL_ORG);
    final AnetBeanList<Organization> principalOrgs = graphQLHelper.searchObjects(user,
        "organizationList", "query", "OrganizationSearchQueryInput", orgFields, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(principalOrgs).isNotNull();
    assertThat(principalOrgs.getList()).isNotEmpty();
    final Organization principalOrg = principalOrgs.getList().get(0);
    final Task taskPrincipal =
        TestData.createTask("Test task principal " + UUID.randomUUID().toString(),
            "Test permissions principal org", "Test-PT-Principal");
    taskPrincipal.setTaskedOrganizations(Collections.singletonList(principalOrg));
    try {
      final String tPrincipalUuid = graphQLHelper.createObject(user, "createTask", "task",
          "TaskInput", taskPrincipal, new TypeReference<GraphQlResponse<Task>>() {});
      if (isAdmin) {
        assertThat(tPrincipalUuid).isNotNull();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }

    // own organization
    final Task taskOwn = TestData.createTask("Test task own " + UUID.randomUUID().toString(),
        "Test permissions own org", "Test-PT-Own");
    taskOwn.setTaskedOrganizations(Collections.singletonList(organization));
    try {
      final String tOwnUuid = graphQLHelper.createObject(user, "createTask", "task", "TaskInput",
          taskOwn, new TypeReference<GraphQlResponse<Task>>() {});
      if (isAdmin) {
        assertThat(tOwnUuid).isNotNull();
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }

    // other advisor organization
    final OrganizationSearchQuery query2 = new OrganizationSearchQuery();
    query2.setType(OrganizationType.ADVISOR_ORG);
    final AnetBeanList<Organization> advisorOrgs = graphQLHelper.searchObjects(user,
        "organizationList", "query", "OrganizationSearchQueryInput", orgFields, query2,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(advisorOrgs).isNotNull();
    assertThat(advisorOrgs.getList()).isNotEmpty();
    final Optional<Organization> foundOrg = advisorOrgs.getList().stream()
        .filter(o -> !organization.getUuid().equals(o.getUuid())).findFirst();
    assertThat(foundOrg.isPresent()).isTrue();
    final Organization advisorOrg = foundOrg.get();
    final Task taskOther = TestData.createTask("Test task other " + UUID.randomUUID().toString(),
        "Test permissions other org", "Test-PT-Other");
    taskOther.setTaskedOrganizations(Collections.singletonList(advisorOrg));
    try {
      graphQLHelper.createObject(user, "createTask", "task", "TaskInput", taskOther,
          new TypeReference<GraphQlResponse<Task>>() {});
    } catch (ForbiddenException expectedException) {
    }
  }

}
