package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.collect.ImmutableList;
import java.io.UnsupportedEncodingException;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ExecutionException;
import javax.ws.rs.ClientErrorException;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Task.TaskStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.test.beans.OrganizationTest;
import mil.dds.anet.test.beans.PositionTest;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import org.junit.Test;

public class OrganizationResourceTest extends AbstractResourceTest {

  private static final String FIELDS = "uuid shortName longName status identificationCode type";
  private static final String POSITION_FIELDS =
      "uuid name code type status organization { uuid } location { uuid }";

  @Test
  public void createAO() throws InterruptedException, ExecutionException {
    final Organization ao = OrganizationTest.getTestAO(true);
    final Person jack = getJackJackson();

    // Create a new AO
    final String aoUuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", ao, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(aoUuid).isNotNull();
    final Organization created = graphQLHelper.getObjectById(admin, "organization", FIELDS, aoUuid,
        new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao.getShortName()).isEqualTo(created.getShortName());
    assertThat(ao.getLongName()).isEqualTo(created.getLongName());
    assertThat(ao.getIdentificationCode()).isEqualTo(created.getIdentificationCode());

    // update name of the AO
    created.setLongName("Ao McAoFace");
    Integer nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization",
        "OrganizationInput", created);
    assertThat(nrUpdated).isEqualTo(1);

    // Verify the AO name is updated.
    Organization updated = graphQLHelper.getObjectById(jack, "organization", FIELDS,
        created.getUuid(), new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(updated.getLongName()).isEqualTo(created.getLongName());

    // Create a position and put it in this AO
    Position b1 = PositionTest.getTestAdvisor();
    b1.setOrganization(updated);
    b1.setCode(b1.getCode() + "_" + Instant.now().toEpochMilli());
    final String b1Uuid = graphQLHelper.createObject(admin, "createPosition", "position",
        "PositionInput", b1, new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(b1Uuid).isNotNull();
    b1 = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, b1Uuid,
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(b1.getUuid()).isNotNull();
    assertThat(b1.getOrganizationUuid()).isEqualTo(updated.getUuid());

    b1.setOrganization(updated);
    nrUpdated =
        graphQLHelper.updateObject(admin, "updatePosition", "position", "PositionInput", b1);
    assertThat(nrUpdated).isEqualTo(1);

    Position ret = graphQLHelper.getObjectById(admin, "position", POSITION_FIELDS, b1.getUuid(),
        new TypeReference<GraphQlResponse<Position>>() {});
    assertThat(ret.getOrganization()).isNotNull();
    assertThat(ret.getOrganizationUuid()).isEqualTo(updated.getUuid());

    // Create a child organizations
    Organization child = new Organization();
    child.setParentOrg(createOrganizationWithUuid(created.getUuid()));
    child.setShortName("AO McChild");
    child.setLongName("Child McAo");
    child.setStatus(OrganizationStatus.ACTIVE);
    child.setType(OrganizationType.ADVISOR_ORG);
    final String childUuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", child, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(childUuid).isNotNull();
    child = graphQLHelper.getObjectById(admin, "organization", FIELDS, childUuid,
        new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(child.getUuid()).isNotNull();

    OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setParentOrgUuid(created.getUuid());
    final AnetBeanList<Organization> children = graphQLHelper.searchObjects(admin,
        "organizationList", "query", "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(children.getList()).hasSize(1).contains(child);

    // Give this Org some Approval Steps
    ApprovalStep step1 = new ApprovalStep();
    step1.setName("First Approvers");
    step1.setApprovers(ImmutableList.of(b1));
    child.setApprovalSteps(ImmutableList.of(step1));
    nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization",
        "OrganizationInput", child);
    assertThat(nrUpdated).isEqualTo(1);

    // Verify approval step was saved.
    updated = graphQLHelper.getObjectById(jack, "organization", FIELDS, child.getUuid(),
        new TypeReference<GraphQlResponse<Organization>>() {});
    List<ApprovalStep> returnedSteps = updated.loadApprovalSteps(context).get();
    assertThat(returnedSteps.size()).isEqualTo(1);
    assertThat(returnedSteps.get(0).loadApprovers(context).get()).contains(b1);

    // Give this org a Task
    Task task = new Task();
    task.setShortName("TST POM1");
    task.setLongName("Verify that you can update Tasks on a Organization");
    task.setStatus(TaskStatus.ACTIVE);
    final String taskUuid = graphQLHelper.createObject(admin, "createTask", "task", "TaskInput",
        task, new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(taskUuid).isNotNull();
    task = graphQLHelper.getObjectById(admin, "task", "uuid shortName longName status", taskUuid,
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(task.getUuid()).isNotNull();

    child.setTasks(ImmutableList.of(task));
    child.setApprovalSteps(null);
    nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization",
        "OrganizationInput", child);
    assertThat(nrUpdated).isEqualTo(1);

    // Verify task was saved.
    updated = graphQLHelper.getObjectById(jack, "organization", FIELDS, child.getUuid(),
        new TypeReference<GraphQlResponse<Organization>>() {});
    final List<Task> tasks = updated.loadTasks(context).get();
    assertThat(tasks).isNotNull();
    assertThat(tasks.size()).isEqualTo(1);
    assertThat(tasks.get(0).getUuid()).isEqualTo(task.getUuid());

    // Change the approval steps.
    step1.setApprovers(ImmutableList.of(admin.loadPosition()));
    ApprovalStep step2 = new ApprovalStep();
    step2.setName("Final Reviewers");
    step2.setApprovers(ImmutableList.of(b1));
    child.setApprovalSteps(ImmutableList.of(step1, step2));
    child.setTasks(null);
    nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization",
        "OrganizationInput", child);
    assertThat(nrUpdated).isEqualTo(1);

    // Verify approval steps updated correct.
    updated = graphQLHelper.getObjectById(jack, "organization", FIELDS, child.getUuid(),
        new TypeReference<GraphQlResponse<Organization>>() {});
    returnedSteps = updated.loadApprovalSteps(context).get();
    assertThat(returnedSteps.size()).isEqualTo(2);
    assertThat(returnedSteps.get(0).getName()).isEqualTo(step1.getName());
    assertThat(returnedSteps.get(0).loadApprovers(context).get())
        .containsExactly(admin.loadPosition());
    assertThat(returnedSteps.get(1).loadApprovers(context).get()).containsExactly(b1);

  }

  @Test
  public void createDuplicateAO() {
    // Create a new AO
    final Organization ao = OrganizationTest.getTestAO(true);
    final String aoUuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", ao, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(aoUuid).isNotNull();
    final Organization created = graphQLHelper.getObjectById(admin, "organization", FIELDS, aoUuid,
        new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao.getShortName()).isEqualTo(created.getShortName());
    assertThat(ao.getLongName()).isEqualTo(created.getLongName());
    assertThat(ao.getIdentificationCode()).isEqualTo(created.getIdentificationCode());

    // Trying to create another AO with the same identificationCode should fail
    try {
      graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
          ao, new TypeReference<GraphQlResponse<Organization>>() {});
      fail("Expected ClientErrorException");
    } catch (ClientErrorException expectedException) {
    }
  }

  @Test
  public void updateDuplicateAO() {
    // Create a new AO
    final Organization ao1 = OrganizationTest.getTestAO(true);
    final String ao1Uuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", ao1, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao1Uuid).isNotNull();
    final Organization created1 = graphQLHelper.getObjectById(admin, "organization", FIELDS,
        ao1Uuid, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao1.getShortName()).isEqualTo(created1.getShortName());
    assertThat(ao1.getLongName()).isEqualTo(created1.getLongName());
    assertThat(ao1.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());

    // Create another new AO
    final Organization ao2 = OrganizationTest.getTestAO(true);
    final String ao2Uuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", ao2, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao2Uuid).isNotNull();
    final Organization created2 = graphQLHelper.getObjectById(admin, "organization", FIELDS,
        ao2Uuid, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao2.getShortName()).isEqualTo(created2.getShortName());
    assertThat(ao2.getLongName()).isEqualTo(created2.getLongName());
    assertThat(ao2.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());

    // Trying to update AO2 with the same identificationCode as AO1 should fail
    created2.setIdentificationCode(ao1.getIdentificationCode());
    try {
      graphQLHelper.updateObject(admin, "updateOrganization", "organization", "OrganizationInput",
          created2);
      fail("Expected ClientErrorException");
    } catch (ClientErrorException expectedException) {
    }
  }

  @Test
  public void createEmptyDuplicateAO() {
    // Create a new AO with NULL identificationCode
    final Organization ao1 = OrganizationTest.getTestAO(false);
    final String ao1Uuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", ao1, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao1Uuid).isNotNull();
    final Organization created1 = graphQLHelper.getObjectById(admin, "organization", FIELDS,
        ao1Uuid, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao1.getShortName()).isEqualTo(created1.getShortName());
    assertThat(ao1.getLongName()).isEqualTo(created1.getLongName());
    assertThat(ao1.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());

    // Creating another AO with NULL identificationCode should succeed
    final String ao2Uuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", ao1, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao2Uuid).isNotNull();
    final Organization created2 = graphQLHelper.getObjectById(admin, "organization", FIELDS,
        ao2Uuid, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao1.getShortName()).isEqualTo(created2.getShortName());
    assertThat(ao1.getLongName()).isEqualTo(created2.getLongName());
    assertThat(ao1.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());

    // Creating an AO with empty identificationCode should succeed
    ao1.setIdentificationCode("");
    final String ao3Uuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", ao1, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao3Uuid).isNotNull();
    final Organization created3 = graphQLHelper.getObjectById(admin, "organization", FIELDS,
        ao3Uuid, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao1.getShortName()).isEqualTo(created3.getShortName());
    assertThat(ao1.getLongName()).isEqualTo(created3.getLongName());
    assertThat(ao1.getIdentificationCode()).isEqualTo(created3.getIdentificationCode());

    // Creating another AO with empty identificationCode should succeed
    final String ao4Uuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", ao1, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao4Uuid).isNotNull();
    final Organization created4 = graphQLHelper.getObjectById(admin, "organization", FIELDS,
        ao4Uuid, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao1.getShortName()).isEqualTo(created4.getShortName());
    assertThat(ao1.getLongName()).isEqualTo(created4.getLongName());
    assertThat(ao1.getIdentificationCode()).isEqualTo(created4.getIdentificationCode());

    // Create a new AO with non-NULL identificationCode
    final Organization ao2 = OrganizationTest.getTestAO(true);
    final String ao5Uuid = graphQLHelper.createObject(admin, "createOrganization", "organization",
        "OrganizationInput", ao2, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao5Uuid).isNotNull();
    final Organization created5 = graphQLHelper.getObjectById(admin, "organization", FIELDS,
        ao5Uuid, new TypeReference<GraphQlResponse<Organization>>() {});
    assertThat(ao2.getShortName()).isEqualTo(created5.getShortName());
    assertThat(ao2.getLongName()).isEqualTo(created5.getLongName());
    assertThat(ao2.getIdentificationCode()).isEqualTo(created5.getIdentificationCode());

    // Updating this AO with empty identificationCode should succeed
    created5.setIdentificationCode("");
    Integer nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization",
        "OrganizationInput", created5);
    assertThat(nrUpdated).isEqualTo(1);

    // Updating this AO with NULL identificationCode should succeed
    created5.setIdentificationCode(null);
    nrUpdated = graphQLHelper.updateObject(admin, "updateOrganization", "organization",
        "OrganizationInput", created5);
    assertThat(nrUpdated).isEqualTo(1);
  }

  @Test
  public void searchTest() {
    Person jack = getJackJackson();

    // Search by name
    OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setText("Ministry");
    AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList()).isNotEmpty();

    // Search by name and type
    query.setType(OrganizationType.ADVISOR_ORG);
    orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList()).isEmpty(); // Should be empty!

    query.setType(OrganizationType.PRINCIPAL_ORG);
    orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList()).isNotEmpty();

    // Autocomplete puts the star in, verify that works.
    query.setText("EF 2*");
    query.setType(null);
    orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2")).count())
        .isEqualTo(1);

    query.setText("EF 2.2*");
    orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2.2")).count())
        .isEqualTo(1);

    query.setText("MOD-F");
    orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("MOD-F")).count())
        .isEqualTo(1);

    query.setText("MOD-F*");
    orgs = graphQLHelper.searchObjects(jack, "organizationList", "query",
        "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("MOD-F")).count())
        .isEqualTo(1);
  }

  @Test
  public void searchNoPaginationTest() {
    final OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setText("EF");
    query.setPageSize(1);
    final AnetBeanList<Organization> list1 = graphQLHelper.searchObjects(admin, "organizationList",
        "query", "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(list1).isNotNull();
    assertThat(list1.getTotalCount()).isGreaterThan(1);

    query.setPageSize(0);
    final AnetBeanList<Organization> listAll = graphQLHelper.searchObjects(admin,
        "organizationList", "query", "OrganizationSearchQueryInput", FIELDS, query,
        new TypeReference<GraphQlResponse<AnetBeanList<Organization>>>() {});
    assertThat(listAll).isNotNull();
    assertThat(listAll.getTotalCount()).isEqualTo(list1.getTotalCount());
    assertThat(listAll.getTotalCount()).isEqualTo(listAll.getList().size());
  }

  @Test
  public void organizationCreateSuperUserPermissionTest() throws UnsupportedEncodingException {
    createOrganization(getSuperUser());
  }

  @Test
  public void organizationCreateRegularUserPermissionTest() throws UnsupportedEncodingException {
    createOrganization(getRegularUser());
  }

  private void createOrganization(Person user) {
    final Organization o = OrganizationTest.getTestAO(true);
    try {
      graphQLHelper.createObject(user, "createOrganization", "organization", "OrganizationInput", o,
          new TypeReference<GraphQlResponse<Organization>>() {});
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

  @Test
  public void organizationUpdateSuperUserPermissionTest() throws UnsupportedEncodingException {
    updateOrganization(getRegularUser());
  }

  @Test
  public void organizationUpdateRegularUserPermissionTest() throws UnsupportedEncodingException {
    updateOrganization(getRegularUser());
  }

  private void updateOrganization(Person user) {
    final Position position = user.getPosition();
    final boolean isSuperUser = position.getType() == PositionType.SUPER_USER;
    final Organization organization = position.getOrganization();

    // own organization
    try {
      final Integer nrUpdated = graphQLHelper.updateObject(user, "updateOrganization",
          "organization", "OrganizationInput", organization);
      if (isSuperUser) {
        assertThat(nrUpdated).isEqualTo(1);
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isSuperUser) {
        fail("Unexpected ForbiddenException");
      }
    }

    // other organization
    final Organization o = OrganizationTest.getTestAO(true);
    try {
      graphQLHelper.updateObject(user, "updateOrganization", "organization", "OrganizationInput",
          o);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

}
