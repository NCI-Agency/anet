package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.ImmutableList;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
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
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.utils.UtilsTest;
import org.assertj.core.util.Lists;
import org.junit.jupiter.api.Test;

public class OrganizationResourceTest extends AbstractResourceTest {

  protected static final String FIELDS =
      "{ uuid shortName longName status identificationCode profile type location"
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
    assertThat(aoInput.getLocation()).isEqualTo(created.getLocation());
    assertThat(aoInput.getProfile()).isEqualTo(created.getProfile());
    // update name of the AO
    created.setLongName("Ao McAoFace");
    Integer nrUpdated = adminMutationExecutor.updateOrganization("", getOrganizationInput(created));
    assertThat(nrUpdated).isEqualTo(1);

    // update profile
    created.setProfile(UtilsTest.getCombinedHtmlTestCase().getInput());
    nrUpdated = adminMutationExecutor.updateOrganization("", getOrganizationInput(created));
    assertThat(nrUpdated).isEqualTo(1);

    // Verify the AO name is updated.
    Organization updated = adminQueryExecutor.organization(FIELDS, created.getUuid());
    assertThat(updated.getLongName()).isEqualTo(created.getLongName());
    // check that HTML of profile is sanitized after update
    assertThat(updated.getProfile()).isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());

    // Add HTML to profile and ensure it gets stripped out.
    created.setProfile(
        "<b>Hello world</b>.  I like script tags! <script>window.alert('hello world')</script>");
    nrUpdated = adminMutationExecutor.updateOrganization("", getOrganizationInput(created));
    assertThat(nrUpdated).isEqualTo(1);

    updated = adminQueryExecutor.organization(FIELDS, created.getUuid());
    assertThat(updated.getProfile()).contains("<b>Hello world</b>");
    assertThat(updated.getProfile()).doesNotContain("<script>window.alert");

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
            .withLocation(getLocationInput(getGeneralHospital()))
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
    assertThat(aoInput.getLocation()).isEqualTo(created.getLocation());
    assertThat(aoInput.getProfile()).isEqualTo(created.getProfile());

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
    assertThat(ao1Input.getLocation()).isEqualTo(created1.getLocation());
    assertThat(ao1Input.getProfile()).isEqualTo(created1.getProfile());

    // Create another new AO
    final OrganizationInput ao2Input = TestData.createAdvisorOrganizationInput(true);
    final Organization created2 = adminMutationExecutor.createOrganization(FIELDS, ao2Input);
    assertThat(created2).isNotNull();
    assertThat(created2.getUuid()).isNotNull();
    assertThat(ao2Input.getShortName()).isEqualTo(created2.getShortName());
    assertThat(ao2Input.getLongName()).isEqualTo(created2.getLongName());
    assertThat(ao2Input.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());
    assertThat(ao2Input.getLocation()).isEqualTo(created2.getLocation());
    assertThat(ao2Input.getProfile()).isEqualTo(created2.getProfile());

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
    assertThat(ao1Input.getLocation()).isEqualTo(created1.getLocation());
    assertThat(ao1Input.getProfile()).isEqualTo(created1.getProfile());

    // Creating another AO with NULL identificationCode should succeed
    final Organization created2 = adminMutationExecutor.createOrganization(FIELDS, ao1Input);
    assertThat(created2).isNotNull();
    assertThat(created2.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created2.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created2.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());
    assertThat(ao1Input.getLocation()).isEqualTo(created2.getLocation());
    assertThat(ao1Input.getProfile()).isEqualTo(created2.getProfile());

    // Creating an AO with empty identificationCode should succeed
    ao1Input.setIdentificationCode("");
    final Organization created3 = adminMutationExecutor.createOrganization(FIELDS, ao1Input);
    assertThat(created3).isNotNull();
    assertThat(created3.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created3.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created3.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created3.getIdentificationCode());
    assertThat(ao1Input.getLocation()).isEqualTo(created3.getLocation());
    assertThat(ao1Input.getProfile()).isEqualTo(created3.getProfile());

    // Creating another AO with empty identificationCode should succeed
    final Organization created4 = adminMutationExecutor.createOrganization(FIELDS, ao1Input);
    assertThat(created4).isNotNull();
    assertThat(created4.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created4.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created4.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created4.getIdentificationCode());
    assertThat(ao1Input.getLocation()).isEqualTo(created4.getLocation());
    assertThat(ao1Input.getProfile()).isEqualTo(created4.getProfile());

    // Create a new AO with non-NULL identificationCode
    final OrganizationInput ao5Input = TestData.createAdvisorOrganizationInput(true);
    final Organization created5 = adminMutationExecutor.createOrganization(FIELDS, ao5Input);
    assertThat(created5).isNotNull();
    assertThat(created5.getUuid()).isNotNull();
    assertThat(ao5Input.getShortName()).isEqualTo(created5.getShortName());
    assertThat(ao5Input.getLongName()).isEqualTo(created5.getLongName());
    assertThat(ao5Input.getIdentificationCode()).isEqualTo(created5.getIdentificationCode());
    assertThat(ao5Input.getLocation()).isEqualTo(created5.getLocation());
    assertThat(ao1Input.getProfile()).isEqualTo(created5.getProfile());

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

    // Search for organizations with profile filled
    query.setHasProfile(true);
    orgs = jackQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(orgs.getList()).isEmpty(); // Should be empty

    // Search for organizations with empty profile
    query.setHasProfile(false);
    orgs = jackQueryExecutor.organizationList(getListFields(FIELDS), query);
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

    // Search by location
    query.setLocationUuid(getGeneralHospital().getUuid());
    orgs = jackQueryExecutor.organizationList(getListFields(FIELDS), query);
    assertThat(orgs.getList()).isEmpty(); // Should be empty!
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
  public void organizationUpdateTypePermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person superUser = getBobBobtown();
    final Person regularUser = getRegularUser();
    final MutationExecutor superUserMutationExecutor =
        getMutationExecutor(superUser.getDomainUsername());
    final MutationExecutor regularUserMutationExecutor =
        getMutationExecutor(regularUser.getDomainUsername());

    final OrganizationInput orgInput = OrganizationInput.builder().withShortName("Type Test")
        .withLongName("Advisor Organization for Type Update Test").withStatus(Status.ACTIVE)
        .withIdentificationCode(UUID.randomUUID().toString()).withType(OrganizationType.ADVISOR_ORG)
        .withLocation(getLocationInput(getGeneralHospital())).build();
    final Organization org = succeedCreateOrganization(adminMutationExecutor, orgInput);

    org.setType(OrganizationType.PRINCIPAL_ORG);
    succeedUpdateOrganization(adminMutationExecutor, getOrganizationInput(org));
    org.setType(OrganizationType.ADVISOR_ORG);
    failUpdateOrganization(superUserMutationExecutor, getOrganizationInput(org));
    failUpdateOrganization(regularUserMutationExecutor, getOrganizationInput(org));
  }

  @Test
  public void organizationSuperUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Person superUser = getBobBobtown();
    final Position superUserPosition = superUser.getPosition();
    final MutationExecutor superUserMutationExecutor =
        getMutationExecutor(superUser.getDomainUsername());

    final OrganizationInput orgInput = OrganizationInput.builder()
        .withShortName("Parent Organization")
        .withLongName("Advisor Organization for Testing Super Users").withStatus(Status.ACTIVE)
        .withIdentificationCode(UUID.randomUUID().toString()).withType(OrganizationType.ADVISOR_ORG)
        .withLocation(getLocationInput(getGeneralHospital())).build();
    failCreateOrganization(superUserMutationExecutor, orgInput);
    final Organization parentOrg = succeedCreateOrganization(adminMutationExecutor, orgInput);

    final OrganizationInput childOrgInput = OrganizationInput.builder()
        .withShortName("Child Organization").withLongName("Child Organization of Test Organization")
        .withStatus(Status.ACTIVE).withIdentificationCode(UUID.randomUUID().toString())
        .withParentOrg(getOrganizationInput(parentOrg)).withType(OrganizationType.ADVISOR_ORG)
        .withLocation(getLocationInput(getGeneralHospital())).build();
    failCreateOrganization(superUserMutationExecutor, childOrgInput);

    // Set super-user as responsible for the parent organization
    parentOrg.setAdministratingPositions(Lists.newArrayList(superUserPosition));
    succeedUpdateOrganization(adminMutationExecutor, getOrganizationInput(parentOrg));

    final Organization createdChildOrg =
        succeedCreateOrganization(superUserMutationExecutor, childOrgInput);

    // Can edit the child of their responsible organization
    createdChildOrg.setShortName("Updated Child Organization");
    succeedUpdateOrganization(superUserMutationExecutor, getOrganizationInput(createdChildOrg));

    // Super-users cannot change the type of the organization
    createdChildOrg.setType(OrganizationType.PRINCIPAL_ORG);
    failUpdateOrganization(superUserMutationExecutor, getOrganizationInput(createdChildOrg));

    // Super-users cannot update their own organizations if they're not responsible
    final Organization superUserOrg =
        adminQueryExecutor.organization(FIELDS, superUserPosition.getOrganization().getUuid());
    failUpdateOrganization(superUserMutationExecutor, getOrganizationInput(superUserOrg));

    // Given responsibility now they can edit their organization
    superUserOrg.setAdministratingPositions(Lists.newArrayList(superUserPosition));
    succeedUpdateOrganization(adminMutationExecutor, getOrganizationInput(superUserOrg));
    succeedUpdateOrganization(superUserMutationExecutor, getOrganizationInput(superUserOrg));

    // Remove position
    superUserOrg.setAdministratingPositions(new ArrayList<>());
    succeedUpdateOrganization(adminMutationExecutor, getOrganizationInput(superUserOrg));
  }

  @Test
  public void changeParentOrganizationAsSuperUserTest()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final Person superUser = getBobBobtown();
    final Position superUserPosition = superUser.getPosition();
    final MutationExecutor superUserMutationExecutor =
        getMutationExecutor(superUser.getDomainUsername());

    final OrganizationInput orgInput = OrganizationInput.builder()
        .withShortName("Parent Organization")
        .withLongName("Advisor Organization for Testing Super Users").withStatus(Status.ACTIVE)
        .withIdentificationCode(UUID.randomUUID().toString()).withType(OrganizationType.ADVISOR_ORG)
        .withLocation(getLocationInput(getGeneralHospital())).build();
    final Organization createdParentOrg =
        succeedCreateOrganization(adminMutationExecutor, orgInput);

    final OrganizationInput childOrgInput = OrganizationInput.builder()
        .withShortName("Child Organization").withLongName("Child Organization of Test Organization")
        .withStatus(Status.ACTIVE).withIdentificationCode(UUID.randomUUID().toString())
        .withParentOrg(getOrganizationInput(createdParentOrg))
        .withType(OrganizationType.ADVISOR_ORG).withLocation(getLocationInput(getGeneralHospital()))
        .build();
    final Organization createdChildOrg =
        succeedCreateOrganization(adminMutationExecutor, childOrgInput);

    createdChildOrg.setParentOrg(null);
    failUpdateOrganization(superUserMutationExecutor, getOrganizationInput(createdChildOrg));
    createdChildOrg.setParentOrg(createdParentOrg);

    // Set super-user as responsible for the child organization
    createdChildOrg.setAdministratingPositions(Lists.newArrayList(superUserPosition));
    succeedUpdateOrganization(adminMutationExecutor, getOrganizationInput(createdChildOrg));

    // Cannot set parent as null because they're not responsible for the parent organization
    createdChildOrg.setParentOrg(null);
    failUpdateOrganization(superUserMutationExecutor, getOrganizationInput(createdChildOrg));
    createdChildOrg.setParentOrg(createdParentOrg);
    // Set super-user as responsible for the parent organization
    createdParentOrg.setAdministratingPositions(Lists.newArrayList(superUserPosition));
    succeedUpdateOrganization(adminMutationExecutor, getOrganizationInput(createdParentOrg));
    // Now super-user can set the parent organization as null
    createdChildOrg.setParentOrg(null);
    succeedUpdateOrganization(superUserMutationExecutor, getOrganizationInput(createdChildOrg));

    final OrganizationInput newParentOrg = OrganizationInput.builder()
        .withShortName("New Parent Organization")
        .withLongName("New Parent Organization for Testing Super Users").withStatus(Status.ACTIVE)
        .withIdentificationCode(UUID.randomUUID().toString()).withType(OrganizationType.ADVISOR_ORG)
        .withLocation(getLocationInput(getGeneralHospital())).build();

    final Organization createdNewParentOrg =
        succeedCreateOrganization(adminMutationExecutor, newParentOrg);

    // Cannot assign the new organization as the child's parent because they're not responsible for
    // the new organization
    createdChildOrg.setParentOrg(createdNewParentOrg);
    failUpdateOrganization(superUserMutationExecutor, getOrganizationInput(createdChildOrg));
    // Revert previous change
    createdChildOrg.setParentOrg(createdParentOrg);

    // Update responsible position
    createdNewParentOrg.setAdministratingPositions(Lists.newArrayList(superUserPosition));
    succeedUpdateOrganization(adminMutationExecutor, getOrganizationInput(createdNewParentOrg));

    // Now they can assign the new parent
    createdChildOrg.setParentOrg(createdNewParentOrg);
    succeedUpdateOrganization(superUserMutationExecutor, getOrganizationInput(createdChildOrg));

    // Test for changing the parent to a different type of organization
    createdParentOrg.setType(OrganizationType.PRINCIPAL_ORG);
    succeedUpdateOrganization(adminMutationExecutor, getOrganizationInput(createdParentOrg));
    createdChildOrg.setParentOrg(createdParentOrg);
    failUpdateOrganization(superUserMutationExecutor, getOrganizationInput(createdChildOrg));
  }

  @Test
  public void organizationCreateRegularUserPermissionTest()
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final MutationExecutor regularUserExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    final OrganizationInput orgInput = OrganizationInput.builder()
        .withShortName("Regular User Test")
        .withLongName("Advisor Organization for Regular User Test").withStatus(Status.ACTIVE)
        .withIdentificationCode(UUID.randomUUID().toString()).withType(OrganizationType.ADVISOR_ORG)
        .withLocation(getLocationInput(getGeneralHospital())).build();
    failCreateOrganization(regularUserExecutor, orgInput);
    failUpdateOrganization(regularUserExecutor, orgInput);
  }

  private void failCreateOrganization(final MutationExecutor mutationExecutor,
      final OrganizationInput orgInput)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    try {
      mutationExecutor.createOrganization(FIELDS, orgInput);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

  private Organization succeedCreateOrganization(final MutationExecutor mutationExecutor,
      final OrganizationInput orgInput)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Organization createdOrg = mutationExecutor.createOrganization(FIELDS, orgInput);
    assertThat(createdOrg).isNotNull();
    assertThat(createdOrg.getUuid()).isNotNull();
    return createdOrg;
  }

  private void failUpdateOrganization(final MutationExecutor mutationExecutor,
      final OrganizationInput orgInput)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    try {
      mutationExecutor.updateOrganization("", orgInput);
      fail("Expected ForbiddenException");
    } catch (ForbiddenException expectedException) {
    }
  }

  private void succeedUpdateOrganization(final MutationExecutor mutationExecutor,
      final OrganizationInput orgInput)
      throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    final Integer numOrg = mutationExecutor.updateOrganization("", orgInput);
    assertThat(numOrg).isOne();
  }

}
