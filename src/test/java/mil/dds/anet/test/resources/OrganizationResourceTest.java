package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.ImmutableList;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.time.Instant;
import java.util.List;
import javax.ws.rs.ClientErrorException;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.ApprovalStep;
import mil.dds.anet.test.client.ApprovalStepInput;
import mil.dds.anet.test.client.ApprovalStepType;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.OrganizationType;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.client.util.MutationExecutor;
import org.junit.jupiter.api.Test;

public class OrganizationResourceTest extends AbstractResourceTest {

  protected static final String FIELDS = "{ uuid shortName longName status identificationCode type"
      + " customFields tasks { uuid } parentOrg { uuid }"
      + " approvalSteps { uuid name approvers { uuid } } }";
  private static final String POSITION_FIELDS =
      "{ uuid name code type status organization { uuid } location { uuid } }";

  @Test
  public void createAO()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a new AO
    final OrganizationInput aoInput = TestData.createAdvisorOrganizationInput(true);
    final Organization created = adminMutationExecutor.createOrganization(FIELDS, aoInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(aoInput.getShortName()).isEqualTo(created.getShortName());
    assertThat(aoInput.getLongName()).isEqualTo(created.getLongName());
    assertThat(aoInput.getIdentificationCode()).isEqualTo(created.getIdentificationCode());

    // update name of the AO
    created.setLongName("Ao McAoFace");
    Integer nrUpdated = adminMutationExecutor.updateOrganization("", getOrganizationInput(created));
    assertThat(nrUpdated).isEqualTo(1);

    // Verify the AO name is updated.
    Organization updated = adminQueryExecutor.organization(FIELDS, created.getUuid());
    assertThat(updated.getLongName()).isEqualTo(created.getLongName());

    // Create a position and put it in this AO
    final PositionInput b1Input = getPositionInput(TestData.getTestAdvisor());
    b1Input.setOrganization(getOrganizationInput(updated));
    b1Input.setLocation(getLocationInput(getGeneralHospital()));
    b1Input.setCode(b1Input.getCode() + "_" + Instant.now().toEpochMilli());
    final Position createdPos = adminMutationExecutor.createPosition(POSITION_FIELDS, b1Input);
    assertThat(createdPos).isNotNull();
    assertThat(createdPos.getUuid()).isNotNull();
    final Position b1 = adminQueryExecutor.position(POSITION_FIELDS, createdPos.getUuid());
    assertThat(b1.getUuid()).isNotNull();
    assertThat(b1.getOrganization().getUuid()).isEqualTo(updated.getUuid());

    b1.setOrganization(updated);
    nrUpdated = adminMutationExecutor.updatePosition("", getPositionInput(b1));
    assertThat(nrUpdated).isEqualTo(1);

    final Position ret = adminQueryExecutor.position(POSITION_FIELDS, createdPos.getUuid());
    assertThat(ret.getOrganization()).isNotNull();
    assertThat(ret.getOrganization().getUuid()).isEqualTo(updated.getUuid());

    // Create a child organizations
    final OrganizationInput childInput =
        OrganizationInput.builder().withParentOrg(getOrganizationInput(created))
            .withShortName("AO McChild").withLongName("Child McAo").withStatus(Status.ACTIVE)
            .withType(OrganizationType.ADVISOR_ORG).build();
    final Organization child = adminMutationExecutor.createOrganization(FIELDS, childInput);
    assertThat(child).isNotNull();
    assertThat(child.getUuid()).isNotNull();

    final OrganizationSearchQueryInput query = OrganizationSearchQueryInput.builder()
        .withParentOrgUuid(ImmutableList.of(created.getUuid())).build();
    final AnetBeanList_Organization children =
        adminQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(children.getList()).hasSize(1);
    assertThat(children.getList().get(0).getUuid()).isEqualTo(child.getUuid());

    // Give this Org some Approval Steps
    final ApprovalStepInput step1Input = ApprovalStepInput.builder().withName("First Approvers")
        .withType(ApprovalStepType.REPORT_APPROVAL)
        .withApprovers(getPositionsInput(ImmutableList.of(b1))).build();
    final OrganizationInput childInput1 = getOrganizationInput(child);
    childInput1.setApprovalSteps(ImmutableList.of(step1Input));
    nrUpdated = adminMutationExecutor.updateOrganization("", childInput1);
    assertThat(nrUpdated).isEqualTo(1);

    // Verify approval step was saved.
    updated = adminQueryExecutor.organization(FIELDS, childInput1.getUuid());
    List<ApprovalStep> returnedSteps = updated.getApprovalSteps();
    assertThat(returnedSteps.size()).isEqualTo(1);
    assertThat(returnedSteps.get(0).getApprovers()).anyMatch(a -> a.getUuid().equals(b1.getUuid()));

    // Give this org a Task
    final TaskInput taskInput = TaskInput.builder().withShortName("TST POM1")
        .withLongName("Verify that you can update Tasks on a Organization")
        .withStatus(Status.ACTIVE).build();
    final Task createdTask = adminMutationExecutor.createTask("{ uuid }", taskInput);
    assertThat(createdTask).isNotNull();
    assertThat(createdTask.getUuid()).isNotNull();
    final Task task =
        adminQueryExecutor.task("{ uuid shortName longName status }", createdTask.getUuid());
    assertThat(task).isNotNull();
    assertThat(task.getUuid()).isNotNull();

    final OrganizationInput childInput2 = getOrganizationInput(updated);
    childInput2.setTasks(ImmutableList.of(getTaskInput(task)));
    childInput2.setApprovalSteps(null);
    nrUpdated = adminMutationExecutor.updateOrganization("", childInput2);
    assertThat(nrUpdated).isEqualTo(1);

    // Verify task was saved.
    updated = jackQueryExecutor.organization(FIELDS, childInput2.getUuid());
    final List<Task> tasks = updated.getTasks();
    assertThat(tasks).isNotNull();
    assertThat(tasks.size()).isEqualTo(1);
    assertThat(tasks.get(0).getUuid()).isEqualTo(task.getUuid());

    // Change the approval steps.
    step1Input.setApprovers(ImmutableList.of(getPositionInput(admin.getPosition())));
    final ApprovalStepInput step2Input = ApprovalStepInput.builder().withName("Final Reviewers")
        .withType(ApprovalStepType.REPORT_APPROVAL)
        .withApprovers(ImmutableList.of(getPositionInput(b1))).build();
    childInput2.setApprovalSteps(ImmutableList.of(step1Input, step2Input));
    childInput2.setTasks(null);
    nrUpdated = adminMutationExecutor.updateOrganization("", childInput2);
    assertThat(nrUpdated).isEqualTo(1);

    // Verify approval steps updated correct.
    updated = jackQueryExecutor.organization(FIELDS, childInput2.getUuid());
    returnedSteps = updated.getApprovalSteps();
    assertThat(returnedSteps.size()).isEqualTo(2);
    assertThat(returnedSteps.get(0).getName()).isEqualTo(step1Input.getName());
    assertThat(returnedSteps.get(0).getApprovers())
        .allMatch(a -> a.getUuid().equals(admin.getPosition().getUuid()));
    assertThat(returnedSteps.get(1).getApprovers()).allMatch(a -> a.getUuid().equals(b1.getUuid()));
  }

  @Test
  public void createDuplicateAO()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a new AO
    final OrganizationInput aoInput = TestData.createAdvisorOrganizationInput(true);
    final Organization created = adminMutationExecutor.createOrganization(FIELDS, aoInput);
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(aoInput.getShortName()).isEqualTo(created.getShortName());
    assertThat(aoInput.getLongName()).isEqualTo(created.getLongName());
    assertThat(aoInput.getIdentificationCode()).isEqualTo(created.getIdentificationCode());

    // Trying to create another AO with the same identificationCode should fail
    try {
      adminMutationExecutor.createOrganization(FIELDS, aoInput);
      fail("Expected ClientErrorException");
    } catch (ClientErrorException expectedException) {
    }
  }

  @Test
  public void updateDuplicateAO()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a new AO
    final OrganizationInput ao1Input = TestData.createAdvisorOrganizationInput(true);
    final Organization created1 = adminMutationExecutor.createOrganization(FIELDS, ao1Input);
    assertThat(created1).isNotNull();
    assertThat(created1.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created1.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created1.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());

    // Create another new AO
    final OrganizationInput ao2Input = TestData.createAdvisorOrganizationInput(true);
    final Organization created2 = adminMutationExecutor.createOrganization(FIELDS, ao2Input);
    assertThat(created2).isNotNull();
    assertThat(created2.getUuid()).isNotNull();
    assertThat(ao2Input.getShortName()).isEqualTo(created2.getShortName());
    assertThat(ao2Input.getLongName()).isEqualTo(created2.getLongName());
    assertThat(ao2Input.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());

    // Trying to update AO2 with the same identificationCode as AO1 should fail
    created2.setIdentificationCode(created1.getIdentificationCode());
    try {
      adminMutationExecutor.updateOrganization("", getOrganizationInput(created2));
      fail("Expected ClientErrorException");
    } catch (ClientErrorException expectedException) {
    }
  }

  @Test
  public void createEmptyDuplicateAO()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a new AO with NULL identificationCode
    final OrganizationInput ao1Input = TestData.createAdvisorOrganizationInput(false);
    final Organization created1 = adminMutationExecutor.createOrganization(FIELDS, ao1Input);
    assertThat(created1).isNotNull();
    assertThat(created1.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created1.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created1.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());

    // Creating another AO with NULL identificationCode should succeed
    final Organization created2 = adminMutationExecutor.createOrganization(FIELDS, ao1Input);
    assertThat(created2).isNotNull();
    assertThat(created2.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created2.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created2.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());

    // Creating an AO with empty identificationCode should succeed
    ao1Input.setIdentificationCode("");
    final Organization created3 = adminMutationExecutor.createOrganization(FIELDS, ao1Input);
    assertThat(created3).isNotNull();
    assertThat(created3.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created3.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created3.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created3.getIdentificationCode());

    // Creating another AO with empty identificationCode should succeed
    final Organization created4 = adminMutationExecutor.createOrganization(FIELDS, ao1Input);
    assertThat(created4).isNotNull();
    assertThat(created4.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created4.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created4.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created4.getIdentificationCode());

    // Create a new AO with non-NULL identificationCode
    final OrganizationInput ao5Input = TestData.createAdvisorOrganizationInput(true);
    final Organization created5 = adminMutationExecutor.createOrganization(FIELDS, ao5Input);
    assertThat(created5).isNotNull();
    assertThat(created5.getUuid()).isNotNull();
    assertThat(ao5Input.getShortName()).isEqualTo(created5.getShortName());
    assertThat(ao5Input.getLongName()).isEqualTo(created5.getLongName());
    assertThat(ao5Input.getIdentificationCode()).isEqualTo(created5.getIdentificationCode());

    // Updating this AO with empty identificationCode should succeed
    created5.setIdentificationCode("");
    Integer nrUpdated =
        adminMutationExecutor.updateOrganization("", getOrganizationInput(created5));
    assertThat(nrUpdated).isEqualTo(1);

    // Updating this AO with NULL identificationCode should succeed
    created5.setIdentificationCode(null);
    nrUpdated = adminMutationExecutor.updateOrganization("", getOrganizationInput(created5));
    assertThat(nrUpdated).isEqualTo(1);
  }

  @Test
  public void searchTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Search by name
    final OrganizationSearchQueryInput query =
        OrganizationSearchQueryInput.builder().withText("Ministry").build();
    AnetBeanList_Organization orgs =
        jackQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(orgs.getList()).isNotEmpty();

    // Search by name and type
    query.setType(OrganizationType.ADVISOR_ORG);
    orgs = jackQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(orgs.getList()).isEmpty(); // Should be empty!

    query.setType(OrganizationType.PRINCIPAL_ORG);
    orgs = jackQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(orgs.getList()).isNotEmpty();

    // Autocomplete puts the star in, verify that works.
    query.setText("EF 2*");
    query.setType(null);
    orgs = jackQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2")).count())
        .isEqualTo(1);

    query.setText("EF 2.2*");
    orgs = jackQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2.2")).count())
        .isEqualTo(1);

    query.setText("MOD-F");
    orgs = jackQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("MOD-F")).count())
        .isEqualTo(1);

    query.setText("MOD-F*");
    orgs = jackQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("MOD-F")).count())
        .isEqualTo(1);
  }

  @Test
  public void searchNoPaginationTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final OrganizationSearchQueryInput query =
        OrganizationSearchQueryInput.builder().withText("EF").withPageSize(1).build();
    final AnetBeanList_Organization list1 =
        adminQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(list1).isNotNull();
    assertThat(list1.getTotalCount()).isGreaterThan(1);

    query.setPageSize(0);
    final AnetBeanList_Organization listAll =
        adminQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(listAll).isNotNull();
    assertThat(listAll.getTotalCount()).isEqualTo(list1.getTotalCount());
    assertThat(listAll.getTotalCount()).isEqualTo(listAll.getList().size());
  }

  @Test
  public void organizationCreateSuperUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    createOrganization(getSuperUser());
  }

  @Test
  public void organizationCreateRegularUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    createOrganization(getRegularUser());
  }

  private void createOrganization(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final MutationExecutor userMutationExecutor = getMutationExecutor(user.getDomainUsername());
    final OrganizationInput oInput = TestData.createAdvisorOrganizationInput(true);
    try {
      userMutationExecutor.createOrganization(FIELDS, oInput);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

  @Test
  public void organizationUpdateSuperUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    updateOrganization(getRegularUser());
  }

  @Test
  public void organizationUpdateRegularUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    updateOrganization(getRegularUser());
  }

  private void updateOrganization(Person user)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final MutationExecutor userMutationExecutor = getMutationExecutor(user.getDomainUsername());
    final Position position = user.getPosition();
    final boolean isSuperUser = position.getType() == PositionType.SUPER_USER;
    final OrganizationInput organizationInput = getOrganizationInput(position.getOrganization());

    // own organization
    try {
      final Integer nrUpdated = userMutationExecutor.updateOrganization("", organizationInput);
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
    final OrganizationInput oInput = TestData.createAdvisorOrganizationInput(true);
    try {
      userMutationExecutor.createOrganization(FIELDS, oInput);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

}
