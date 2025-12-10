package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mil.dds.anet.test.TestData;
import mil.dds.anet.test.client.AnetBeanList_Organization;
import mil.dds.anet.test.client.ApprovalStep;
import mil.dds.anet.test.client.ApprovalStepInput;
import mil.dds.anet.test.client.ApprovalStepType;
import mil.dds.anet.test.client.AssessmentSearchQueryInput;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.client.OrganizationSearchQueryInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.utils.UtilsTest;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClientResponseException;

public class OrganizationResourceTest extends AbstractResourceTest {

  private static final String _EMAIL_ADDRESSES_FIELDS = "emailAddresses { network address }";
  public static final String FIELDS =
      String.format("{ uuid updatedAt shortName longName status identificationCode profile location"
          + " app6context app6standardIdentity app6symbolSet app6hq app6amplifier app6entity"
          + " app6entityType app6entitySubtype app6sectorOneModifier app6sectorTwoModifier"
          + " customFields tasks { uuid } parentOrg { uuid }"
          + " approvalSteps { uuid name approvers { uuid } } %1$s }", _EMAIL_ADDRESSES_FIELDS);
  private static final String POSITION_FIELDS = String.format(
      "{ uuid updatedAt name code type role status organization { uuid } location { uuid } %1$s }",
      _EMAIL_ADDRESSES_FIELDS);

  private static final Map<String, String> APP6_MAP = Map.ofEntries(Map.entry("app6context", "0"),
      Map.entry("app6standardIdentity", "3"), Map.entry("app6symbolSet", "10"),
      Map.entry("app6hq", "1"), Map.entry("app6amplifier", "11"), Map.entry("app6entity", "11"),
      Map.entry("app6entityType", "10"), Map.entry("app6entitySubtype", "01"),
      Map.entry("app6sectorOneModifier", "01"), Map.entry("app6sectorTwoModifier", "01"));

  @Test
  void createAO() {
    // Create a new AO
    final OrganizationInput aoInput = TestData.createAdvisorOrganizationInput(true);
    aoInput.setApp6context(getApp6Choice("app6context"));
    aoInput.setApp6standardIdentity(getApp6Choice("app6standardIdentity"));
    aoInput.setApp6symbolSet(getApp6Choice("app6symbolSet"));
    aoInput.setApp6hq(getApp6Choice("app6hq"));
    aoInput.setApp6amplifier(getApp6Choice("app6amplifier"));
    aoInput.setApp6entity(getApp6Choice("app6entity"));
    aoInput.setApp6entityType(getApp6Choice("app6entityType"));
    aoInput.setApp6entitySubtype(getApp6Choice("app6entitySubtype"));
    aoInput.setApp6sectorOneModifier(getApp6Choice("app6sectorOneModifier"));
    aoInput.setApp6sectorTwoModifier(getApp6Choice("app6sectorTwoModifier"));
    final Organization created =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, aoInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(aoInput.getShortName()).isEqualTo(created.getShortName());
    assertThat(aoInput.getLongName()).isEqualTo(created.getLongName());
    assertThat(aoInput.getIdentificationCode()).isEqualTo(created.getIdentificationCode());
    assertThat(aoInput.getProfile()).isEqualTo(created.getProfile());
    assertThat(aoInput.getApp6context()).isEqualTo(created.getApp6context());
    assertThat(aoInput.getApp6standardIdentity()).isEqualTo(created.getApp6standardIdentity());
    assertThat(aoInput.getApp6symbolSet()).isEqualTo(created.getApp6symbolSet());
    assertThat(aoInput.getApp6hq()).isEqualTo(created.getApp6hq());
    assertThat(aoInput.getApp6amplifier()).isEqualTo(created.getApp6amplifier());
    assertThat(aoInput.getApp6entity()).isEqualTo(created.getApp6entity());
    assertThat(aoInput.getApp6entityType()).isEqualTo(created.getApp6entityType());
    assertThat(aoInput.getApp6entitySubtype()).isEqualTo(created.getApp6entitySubtype());
    assertThat(aoInput.getApp6sectorOneModifier()).isEqualTo(created.getApp6sectorOneModifier());
    assertThat(aoInput.getApp6sectorTwoModifier()).isEqualTo(created.getApp6sectorTwoModifier());
    // update name of the AO
    created.setLongName("Ao McAoFace");
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", false, getOrganizationInput(created)));
    assertThat(nrUpdated).isEqualTo(1);
    final Organization updated =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, created.getUuid()));

    // update profile
    updated.setProfile(UtilsTest.getCombinedHtmlTestCase().getInput());
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", false, getOrganizationInput(updated)));
    assertThat(nrUpdated).isEqualTo(1);

    // Verify the AO name is updated.
    final Organization updated2 =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, updated.getUuid()));
    assertThat(updated2.getLongName()).isEqualTo(updated.getLongName());
    // check that HTML of profile is sanitized after update
    assertThat(updated2.getProfile()).isEqualTo(UtilsTest.getCombinedHtmlTestCase().getOutput());

    // Add HTML to profile and ensure it gets stripped out.
    updated2.setProfile(
        "<b>Hello world</b>.  I like script tags! <script>window.alert('hello world')</script>");
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", false, getOrganizationInput(updated2)));
    assertThat(nrUpdated).isEqualTo(1);

    final Organization updated3 =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, updated2.getUuid()));
    assertThat(updated3.getProfile()).contains("<b>Hello world</b>");
    assertThat(updated3.getProfile()).doesNotContain("<script>window.alert");

    // Create a position and put it in this AO
    final PositionInput b1Input = getPositionInput(TestData.getTestAdvisor());
    b1Input.setOrganization(getOrganizationInput(updated3));
    b1Input.setLocation(getLocationInput(getGeneralHospital()));
    b1Input.setCode(b1Input.getCode() + "_" + Instant.now().toEpochMilli());
    final Position createdPos =
        withCredentials(adminUser, t -> mutationExecutor.createPosition(POSITION_FIELDS, b1Input));
    assertThat(createdPos).isNotNull();
    assertThat(createdPos.getUuid()).isNotNull();
    final Position b1 = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, createdPos.getUuid()));
    assertThat(b1.getUuid()).isNotNull();
    assertThat(b1.getOrganization().getUuid()).isEqualTo(updated3.getUuid());

    b1.setOrganization(updated3);
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updatePosition("", false, getPositionInput(b1)));
    assertThat(nrUpdated).isEqualTo(1);

    final Position ret = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, createdPos.getUuid()));
    assertThat(ret.getOrganization()).isNotNull();
    assertThat(ret.getOrganization().getUuid()).isEqualTo(updated3.getUuid());

    // Create a child organizations
    final OrganizationInput childInput =
        OrganizationInput.builder().withParentOrg(getOrganizationInput(created))
            .withShortName("AO McChild").withLongName("Child McAo").withStatus(Status.ACTIVE)
            .withLocation(getLocationInput(getGeneralHospital())).build();
    final Organization child =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, childInput));
    assertThat(child).isNotNull();
    assertThat(child.getUuid()).isNotNull();

    final OrganizationSearchQueryInput query = OrganizationSearchQueryInput.builder()
        .withParentOrgUuid(List.of(created.getUuid())).build();
    final AnetBeanList_Organization children = withCredentials(adminUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(children.getList()).hasSize(1);
    assertThat(children.getList().get(0).getUuid()).isEqualTo(child.getUuid());

    // Give this Org some Approval Steps
    final ApprovalStepInput step1Input = ApprovalStepInput.builder().withName("First Approvers")
        .withType(ApprovalStepType.REPORT_APPROVAL).withApprovers(getPositionsInput(List.of(b1)))
        .build();
    final OrganizationInput childInput1 = getOrganizationInput(child);
    childInput1.setApprovalSteps(List.of(step1Input));
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", false, childInput1));
    assertThat(nrUpdated).isEqualTo(1);

    // Verify approval step was saved.
    final Organization updated4 =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, childInput1.getUuid()));
    List<ApprovalStep> returnedSteps = updated4.getApprovalSteps();
    assertThat(returnedSteps).hasSize(1);
    assertThat(returnedSteps.get(0).getApprovers()).anyMatch(a -> a.getUuid().equals(b1.getUuid()));

    // Give this org a Task
    final TaskInput taskInput = TaskInput.builder().withShortName("TST POM1")
        .withLongName("Verify that you can update Tasks on a Organization")
        .withStatus(Status.ACTIVE).build();
    final Task createdTask =
        withCredentials(adminUser, t -> mutationExecutor.createTask("{ uuid }", taskInput));
    assertThat(createdTask).isNotNull();
    assertThat(createdTask.getUuid()).isNotNull();
    final Task task = withCredentials(adminUser,
        t -> queryExecutor.task("{ uuid shortName longName status }", createdTask.getUuid()));
    assertThat(task).isNotNull();
    assertThat(task.getUuid()).isNotNull();

    final OrganizationInput childInput2 = getOrganizationInput(updated4);
    childInput2.setTasks(List.of(getTaskInput(task)));
    childInput2.setApprovalSteps(null);
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", false, childInput2));
    assertThat(nrUpdated).isEqualTo(1);

    // Verify task was saved.
    final Organization updated5 =
        withCredentials(jackUser, t -> queryExecutor.organization(FIELDS, childInput2.getUuid()));
    final List<Task> tasks = updated5.getTasks();
    assertThat(tasks).isNotNull();
    assertThat(tasks).hasSize(1);
    assertThat(tasks.get(0).getUuid()).isEqualTo(task.getUuid());

    // Change the approval steps.
    step1Input.setApprovers(List.of(getPositionInput(admin.getPosition())));
    final ApprovalStepInput step2Input = ApprovalStepInput.builder().withName("Final Reviewers")
        .withType(ApprovalStepType.REPORT_APPROVAL).withApprovers(List.of(getPositionInput(b1)))
        .build();
    final OrganizationInput updatedStepsInput = getOrganizationInput(updated5);
    updatedStepsInput.setApprovalSteps(List.of(step1Input, step2Input));
    updatedStepsInput.setTasks(null);
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", false, updatedStepsInput));
    assertThat(nrUpdated).isEqualTo(1);

    // Verify approval steps updated correctly.
    final Organization updated6 = withCredentials(jackUser,
        t -> queryExecutor.organization(FIELDS, updatedStepsInput.getUuid()));
    returnedSteps = updated6.getApprovalSteps();
    assertThat(returnedSteps).hasSize(2);
    assertThat(returnedSteps.get(0).getName()).isEqualTo(step1Input.getName());
    assertThat(returnedSteps.get(0).getApprovers())
        .allMatch(a -> a.getUuid().equals(admin.getPosition().getUuid()));
    assertThat(returnedSteps.get(1).getApprovers()).allMatch(a -> a.getUuid().equals(b1.getUuid()));
  }

  private String getApp6Choice(final String app6field) {
    return APP6_MAP.get(app6field);
  }

  @Test
  void createDuplicateAO() {
    // Create a new AO
    final OrganizationInput aoInput = TestData.createAdvisorOrganizationInput(true);
    final Organization created =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, aoInput));
    assertThat(created).isNotNull();
    assertThat(created.getUuid()).isNotNull();
    assertThat(aoInput.getShortName()).isEqualTo(created.getShortName());
    assertThat(aoInput.getLongName()).isEqualTo(created.getLongName());
    assertThat(aoInput.getIdentificationCode()).isEqualTo(created.getIdentificationCode());
    assertThat(aoInput.getProfile()).isEqualTo(created.getProfile());

    // Trying to create another AO with the same identificationCode should fail
    try {
      withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, aoInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void updateDuplicateAO() {
    // Create a new AO
    final OrganizationInput ao1Input = TestData.createAdvisorOrganizationInput(true);
    final Organization created1 =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, ao1Input));
    assertThat(created1).isNotNull();
    assertThat(created1.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created1.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created1.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());
    assertThat(ao1Input.getProfile()).isEqualTo(created1.getProfile());

    // Create another new AO
    final OrganizationInput ao2Input = TestData.createAdvisorOrganizationInput(true);
    final Organization created2 =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, ao2Input));
    assertThat(created2).isNotNull();
    assertThat(created2.getUuid()).isNotNull();
    assertThat(ao2Input.getShortName()).isEqualTo(created2.getShortName());
    assertThat(ao2Input.getLongName()).isEqualTo(created2.getLongName());
    assertThat(ao2Input.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());
    assertThat(ao2Input.getProfile()).isEqualTo(created2.getProfile());

    // Trying to update AO2 with the same identificationCode as AO1 should fail
    created2.setIdentificationCode(created1.getIdentificationCode());
    try {
      withCredentials(adminUser,
          t -> mutationExecutor.updateOrganization("", false, getOrganizationInput(created2)));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void createEmptyDuplicateAO() {
    // Create a new AO with NULL identificationCode
    final OrganizationInput ao1Input = TestData.createAdvisorOrganizationInput(false);
    final Organization created1 =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, ao1Input));
    assertThat(created1).isNotNull();
    assertThat(created1.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created1.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created1.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created1.getIdentificationCode());
    assertThat(ao1Input.getProfile()).isEqualTo(created1.getProfile());

    // Creating another AO with NULL identificationCode should succeed
    final Organization created2 =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, ao1Input));
    assertThat(created2).isNotNull();
    assertThat(created2.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created2.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created2.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created2.getIdentificationCode());
    assertThat(ao1Input.getProfile()).isEqualTo(created2.getProfile());

    // Creating an AO with empty identificationCode should succeed
    ao1Input.setIdentificationCode("");
    final Organization created3 =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, ao1Input));
    assertThat(created3).isNotNull();
    assertThat(created3.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created3.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created3.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created3.getIdentificationCode());
    assertThat(ao1Input.getProfile()).isEqualTo(created3.getProfile());

    // Creating another AO with empty identificationCode should succeed
    final Organization created4 =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, ao1Input));
    assertThat(created4).isNotNull();
    assertThat(created4.getUuid()).isNotNull();
    assertThat(ao1Input.getShortName()).isEqualTo(created4.getShortName());
    assertThat(ao1Input.getLongName()).isEqualTo(created4.getLongName());
    assertThat(ao1Input.getIdentificationCode()).isEqualTo(created4.getIdentificationCode());
    assertThat(ao1Input.getProfile()).isEqualTo(created4.getProfile());

    // Create a new AO with non-NULL identificationCode
    final OrganizationInput ao5Input = TestData.createAdvisorOrganizationInput(true);
    final Organization created5 =
        withCredentials(adminUser, t -> mutationExecutor.createOrganization(FIELDS, ao5Input));
    assertThat(created5).isNotNull();
    assertThat(created5.getUuid()).isNotNull();
    assertThat(ao5Input.getShortName()).isEqualTo(created5.getShortName());
    assertThat(ao5Input.getLongName()).isEqualTo(created5.getLongName());
    assertThat(ao5Input.getIdentificationCode()).isEqualTo(created5.getIdentificationCode());
    assertThat(ao1Input.getProfile()).isEqualTo(created5.getProfile());

    // Updating this AO with empty identificationCode should succeed
    created5.setIdentificationCode("");
    Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", false, getOrganizationInput(created5)));
    assertThat(nrUpdated).isEqualTo(1);
    final Organization updated5 =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, created5.getUuid()));

    // Updating this AO with NULL identificationCode should succeed
    created5.setIdentificationCode(null);
    nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", false, getOrganizationInput(updated5)));
    assertThat(nrUpdated).isEqualTo(1);
  }

  @Test
  void searchTest() {
    // Search by name
    final OrganizationSearchQueryInput query =
        OrganizationSearchQueryInput.builder().withText("Ministry").build();
    AnetBeanList_Organization orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(orgs.getList()).isNotEmpty();

    // Search for organizations with profile filled
    query.setHasProfile(true);
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(orgs.getList()).isEmpty(); // Should be empty

    // Search for organizations with empty profile
    query.setHasProfile(false);
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(orgs.getList()).isNotEmpty();

    // Search by name
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(orgs.getList()).isNotEmpty();

    // Autocomplete puts the star in, verify that works.
    query.setText("EF 2*");
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2")).count())
        .isEqualTo(1);

    query.setText("EF 2.2*");
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("EF 2.2")).count())
        .isEqualTo(1);

    query.setText("MOD-F");
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("MOD-F")).count())
        .isEqualTo(1);

    query.setText("MOD-F*");
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(orgs.getList().stream().filter(o -> o.getShortName().equals("MOD-F")).count())
        .isEqualTo(1);

    // Search by location
    query.setLocationUuid(List.of(getGeneralHospital().getUuid()));
    orgs = withCredentials(jackUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(orgs.getList()).isEmpty(); // Should be empty!
  }

  @Test
  void searchNoPaginationTest() {
    final OrganizationSearchQueryInput query =
        OrganizationSearchQueryInput.builder().withText("EF").withPageSize(1).build();
    final AnetBeanList_Organization list1 = withCredentials(adminUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(list1).isNotNull();
    assertThat(list1.getTotalCount()).isGreaterThan(1);

    query.setPageSize(0);
    final AnetBeanList_Organization listAll = withCredentials(adminUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(listAll).isNotNull();
    assertThat(listAll.getTotalCount()).isEqualTo(list1.getTotalCount());
    assertThat(listAll.getTotalCount()).isEqualTo(listAll.getList().size());
  }

  @Test
  void searchAssessmentsTestForInteractionPlan() {
    final String assessmentKey = "interactionPlan";
    final List<String> matchingShortNames = List.of("EF 6.2", "MOD-F");
    searchForAssessments(assessmentKey, null, matchingShortNames);
    searchForAssessments(assessmentKey, Map.of("priority", List.of("t2")), matchingShortNames);
    searchForAssessments(assessmentKey, Map.of("priority", List.of("t1", "t2", "t3", "t4", "t5")),
        matchingShortNames);
    searchForAssessments(assessmentKey, Map.of("priority", List.of("t4")), List.of());
    searchForAssessments(assessmentKey,
        Map.of("priority", List.of("t1"), "relation", List.of("maintain")), List.of());
  }

  @Test
  void searchAssessmentsTestForOrganizationOndemand() {
    final String assessmentKey = "organizationOndemand";
    final List<String> matchingShortNames = List.of("EF 6.2", "MOD-F");
    searchForAssessments(assessmentKey, null, matchingShortNames);
    searchForAssessments(assessmentKey, Map.of("enumset", List.of("t2")), matchingShortNames);
    searchForAssessments(assessmentKey, Map.of("enumset", List.of("t1", "t2", "t3", "t4", "t5")),
        matchingShortNames);
    searchForAssessments(assessmentKey, Map.of("enumset", List.of("t4")), List.of());
  }

  private void searchForAssessments(final String key, final Map<?, ?> filters,
      final List<String> matchingShortNames) {
    final AssessmentSearchQueryInput aq = AssessmentSearchQueryInput.builder().withKey(key)
        .withFilters(filters == null ? null : new HashMap<>(filters)).build();
    final OrganizationSearchQueryInput q =
        OrganizationSearchQueryInput.builder().withAssessment(aq).build();
    final AnetBeanList_Organization result =
        withCredentials(jackUser, t -> queryExecutor.organizationList(getListFields(FIELDS), q));
    assertThat(result.getList()).map(Organization::getShortName)
        .hasSameElementsAs(matchingShortNames);
  }

  @Test
  void organizationUpdateTypePermissionTest() {
    final Person superuser = getBobBobtown();
    final Person regularUser = getRegularUser();

    final OrganizationInput orgInput = OrganizationInput.builder().withShortName("Type Test")
        .withLongName("Advisor Organization for Type Update Test").withStatus(Status.ACTIVE)
        .withIdentificationCode(UUID.randomUUID().toString())
        .withLocation(getLocationInput(getGeneralHospital())).build();
    final Organization org = succeedCreateOrganization(adminUser, orgInput);

    final Organization updatedOrg = succeedUpdateOrganization(adminUser, getOrganizationInput(org));
    failUpdateOrganization(getDomainUsername(superuser), getOrganizationInput(updatedOrg));
    failUpdateOrganization(getDomainUsername(regularUser), getOrganizationInput(updatedOrg));
  }

  @Test
  void organizationSuperuserPermissionTest() {
    // Bob is a regular superuser
    final Person superuser = getBobBobtown();
    final Position superuserPosition = superuser.getPosition();

    final OrganizationInput orgInput =
        OrganizationInput.builder().withShortName("Parent Organization 1")
            .withLongName("Advisor Organization 1 for Testing Superusers").withStatus(Status.ACTIVE)
            .withIdentificationCode(UUID.randomUUID().toString())
            .withLocation(getLocationInput(getGeneralHospital())).build();
    failCreateOrganization(getDomainUsername(superuser), orgInput);
    final Organization parentOrg = succeedCreateOrganization(adminUser, orgInput);

    final OrganizationInput childOrgInput =
        OrganizationInput.builder().withShortName("Child Organization 1")
            .withLongName("Child Organization of Parent Organization 1").withStatus(Status.ACTIVE)
            .withIdentificationCode(UUID.randomUUID().toString())
            .withParentOrg(getOrganizationInput(parentOrg))
            .withLocation(getLocationInput(getGeneralHospital())).build();
    failCreateOrganization(getDomainUsername(superuser), childOrgInput);

    // Set superuser as responsible for the parent organization
    parentOrg.setAdministratingPositions(List.of(superuserPosition));
    succeedUpdateOrganization(adminUser, getOrganizationInput(parentOrg));

    final Organization createdChildOrg =
        succeedCreateOrganization(getDomainUsername(superuser), childOrgInput);

    // Can edit the child of their responsible organization
    createdChildOrg.setShortName("Updated Child Organization 1");
    succeedUpdateOrganization(getDomainUsername(superuser), getOrganizationInput(createdChildOrg));

    // Superusers cannot update their own organizations if they're not responsible
    final Organization superuserOrg = withCredentials(adminUser,
        t -> queryExecutor.organization(FIELDS, superuserPosition.getOrganization().getUuid()));
    failUpdateOrganization(getDomainUsername(superuser), getOrganizationInput(superuserOrg));

    // Given responsibility now they can edit their organization
    superuserOrg.setAdministratingPositions(List.of(superuserPosition));
    final Organization updatedSuperuserOrg =
        succeedUpdateOrganization(adminUser, getOrganizationInput(superuserOrg));
    succeedUpdateOrganization(getDomainUsername(superuser),
        getOrganizationInput(updatedSuperuserOrg));
    final Organization updatedSuperuserOrg2 = withCredentials(adminUser,
        t -> queryExecutor.organization(FIELDS, updatedSuperuserOrg.getUuid()));

    // Remove position
    superuserOrg.setAdministratingPositions(new ArrayList<>());
    succeedUpdateOrganization(adminUser, getOrganizationInput(updatedSuperuserOrg2));
  }

  @Test
  void organizationCanCreateTopLevelOrganizationsSuperuserPermissionTest() {
    // Jim is a superuser that can create top level organizations

    // Can create top level organization
    final OrganizationInput orgInput =
        OrganizationInput.builder().withShortName("Parent Organization 2")
            .withLongName("Advisor Organization 2 for Testing Superusers").withStatus(Status.ACTIVE)
            .withIdentificationCode(UUID.randomUUID().toString())
            .withLocation(getLocationInput(getGeneralHospital())).build();
    final Organization newTopLevelOrganization = succeedCreateOrganization("jim", orgInput);
    // and edit it and created sub-organizations of the top level organization he created
    succeedUpdateOrganization("jim", getOrganizationInput(newTopLevelOrganization));
    final OrganizationInput childOrgInput =
        OrganizationInput.builder().withShortName("Child Organization 2")
            .withLongName("Child Organization f Parent Organization 2").withStatus(Status.ACTIVE)
            .withIdentificationCode(UUID.randomUUID().toString())
            .withParentOrg(getOrganizationInput(newTopLevelOrganization))
            .withLocation(getLocationInput(getGeneralHospital())).build();
    succeedCreateOrganization("jim", childOrgInput);

    // Can NOT edit and create sub-organizations of an existing organization: EF 1
    final Organization ef1 = withCredentials(jackUser,
        t -> queryExecutor.organization("{ uuid }", "9a35caa7-a095-4963-ac7b-b784fde4d583"));
    // Can NOT edit EF 1
    failUpdateOrganization("jim", getOrganizationInput(ef1));
    // Can NOT create a sub organization of EF 1
    final OrganizationInput childOrgInput2 = OrganizationInput.builder()
        .withShortName("EF 1 new child").withLongName("New Child Organization of EF 1")
        .withStatus(Status.ACTIVE).withIdentificationCode(UUID.randomUUID().toString())
        .withParentOrg(getOrganizationInput(ef1))
        .withLocation(getLocationInput(getGeneralHospital())).build();
    failCreateOrganization("jim", childOrgInput2);
  }

  @Test
  void organizationCanCreateEditAnyOrganizationSuperuserPermissionTest() {
    // Billie is a superuser that can create or edit any organization

    // Can create top level organization
    final OrganizationInput orgInput =
        OrganizationInput.builder().withShortName("Parent Organization 3")
            .withLongName("Advisor Organization 3 for Testing Superusers").withStatus(Status.ACTIVE)
            .withIdentificationCode(UUID.randomUUID().toString())
            .withLocation(getLocationInput(getGeneralHospital())).build();
    final Organization newTopLevelOrganization = succeedCreateOrganization("billie", orgInput);
    // and edit it and created sub-organizations of the top level organization he created
    succeedUpdateOrganization("billie", getOrganizationInput(newTopLevelOrganization));
    final OrganizationInput childOrgInput =
        OrganizationInput.builder().withShortName("Child Organization 3")
            .withLongName("Child Organization of Parent Organization 3").withStatus(Status.ACTIVE)
            .withIdentificationCode(UUID.randomUUID().toString())
            .withParentOrg(getOrganizationInput(newTopLevelOrganization))
            .withLocation(getLocationInput(getGeneralHospital())).build();
    succeedCreateOrganization("billie", childOrgInput);

    // Can edit and create sub-organizations of an existing organization: EF 1
    final Organization ef1 = withCredentials(jackUser,
        t -> queryExecutor.organization(FIELDS, "9a35caa7-a095-4963-ac7b-b784fde4d583"));
    // Can edit EF 1
    succeedUpdateOrganization("billie", getOrganizationInput(ef1));
    // Can create a sub organization of EF 1
    final OrganizationInput childOrgInput2 = OrganizationInput.builder()
        .withShortName("EF 1 new child").withLongName("New Child Organization of EF 1")
        .withStatus(Status.ACTIVE).withIdentificationCode(UUID.randomUUID().toString())
        .withParentOrg(getOrganizationInput(ef1))
        .withLocation(getLocationInput(getGeneralHospital())).build();
    succeedCreateOrganization("billie", childOrgInput2);
  }

  @Test
  void changeParentOrganizationAsSuperuserTest() {
    final Person superuser = getBobBobtown();
    final Position superuserPosition = superuser.getPosition();

    final OrganizationInput orgInput =
        OrganizationInput.builder().withShortName("Parent Organization 4")
            .withLongName("Advisor Organization 4 for Testing Superusers").withStatus(Status.ACTIVE)
            .withIdentificationCode(UUID.randomUUID().toString())
            .withLocation(getLocationInput(getGeneralHospital())).build();
    final Organization createdParentOrg = succeedCreateOrganization(adminUser, orgInput);

    final OrganizationInput childOrgInput =
        OrganizationInput.builder().withShortName("Child Organization 4")
            .withLongName("Child Organization of Parent Organization 4").withStatus(Status.ACTIVE)
            .withIdentificationCode(UUID.randomUUID().toString())
            .withParentOrg(getOrganizationInput(createdParentOrg))
            .withLocation(getLocationInput(getGeneralHospital())).build();
    final Organization createdChildOrg = succeedCreateOrganization(adminUser, childOrgInput);

    createdChildOrg.setParentOrg(null);
    failUpdateOrganization(getDomainUsername(superuser), getOrganizationInput(createdChildOrg));
    createdChildOrg.setParentOrg(createdParentOrg);

    // Set superuser as responsible for the child organization
    createdChildOrg.setAdministratingPositions(List.of(superuserPosition));
    final Organization updatedChildOrg =
        succeedUpdateOrganization(adminUser, getOrganizationInput(createdChildOrg));

    // Cannot set parent as null because they're not responsible for the parent organization
    updatedChildOrg.setParentOrg(null);
    failUpdateOrganization(getDomainUsername(superuser), getOrganizationInput(updatedChildOrg));
    updatedChildOrg.setParentOrg(createdParentOrg);
    // Set superuser as responsible for the parent organization
    createdParentOrg.setAdministratingPositions(List.of(superuserPosition));
    final Organization updatedChildOrgWithParent =
        succeedUpdateOrganization(adminUser, getOrganizationInput(createdParentOrg));
    // Now superuser can set the parent organization as null
    updatedChildOrgWithParent.setParentOrg(null);
    final Organization updatedChildOrg2 = succeedUpdateOrganization(getDomainUsername(superuser),
        getOrganizationInput(updatedChildOrgWithParent));

    final OrganizationInput newParentOrg =
        OrganizationInput.builder().withShortName("New Parent Organization 4")
            .withLongName("New Parent Organization 4 for Testing Superusers")
            .withStatus(Status.ACTIVE).withIdentificationCode(UUID.randomUUID().toString())
            .withLocation(getLocationInput(getGeneralHospital())).build();

    final Organization createdNewParentOrg = succeedCreateOrganization(adminUser, newParentOrg);

    // Cannot assign the new organization as the child's parent because they're not responsible for
    // the new organization
    updatedChildOrg2.setParentOrg(createdNewParentOrg);
    failUpdateOrganization(getDomainUsername(superuser), getOrganizationInput(updatedChildOrg2));
    // Revert previous change
    updatedChildOrg2.setParentOrg(createdParentOrg);

    // Update responsible position
    createdNewParentOrg.setAdministratingPositions(List.of(superuserPosition));
    succeedUpdateOrganization(adminUser, getOrganizationInput(createdNewParentOrg));

    // Now they can assign the new parent
    updatedChildOrg2.setParentOrg(createdNewParentOrg);
    succeedUpdateOrganization(getDomainUsername(superuser), getOrganizationInput(updatedChildOrg2));
  }

  @Test
  void illegalParentOrganizationTest() {
    final String testTopOrgUuid = "9a35caa7-a095-4963-ac7b-b784fde4d583"; // EF 1
    final Organization topOrg =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, testTopOrgUuid));
    assertThat(topOrg).isNotNull();
    assertThat(topOrg.getUuid()).isEqualTo(testTopOrgUuid);

    final String testSubOrgUuid = "04614b0f-7e8e-4bf1-8bc5-13abaffeab8a"; // EF 1.1
    final Organization subOrg =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, testSubOrgUuid));
    assertThat(subOrg).isNotNull();
    assertThat(subOrg.getUuid()).isEqualTo(testSubOrgUuid);

    // Set self as parent
    final OrganizationInput topOrgInput = getOrganizationInput(topOrg);
    final OrganizationInput parentTopOrgInput = getOrganizationInput(topOrg);
    topOrgInput.setParentOrg(parentTopOrgInput);
    try {
      // Should fail, as it would create a loop
      withCredentials(adminUser, t -> mutationExecutor.updateOrganization("", false, topOrgInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }

    // Set subOrg as parent
    final OrganizationInput parentSubOrgInput = getOrganizationInput(subOrg);
    topOrgInput.setParentOrg(parentSubOrgInput);
    try {
      // Should fail, as it would create a loop
      withCredentials(adminUser, t -> mutationExecutor.updateOrganization("", false, topOrgInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void organizationCreateRegularUserPermissionTest() {
    final OrganizationInput orgInput =
        OrganizationInput.builder().withShortName("Regular User Test")
            .withLongName("Advisor Organization for Regular User Test").withStatus(Status.ACTIVE)
            .withIdentificationCode(UUID.randomUUID().toString())
            .withLocation(getLocationInput(getGeneralHospital())).build();
    failCreateOrganization(getDomainUsername(getRegularUser()), orgInput);
    failUpdateOrganization(getDomainUsername(getRegularUser()), orgInput);
  }

  @Test
  void shouldBeSearchableViaCustomFields() {
    final var searchText = "exercitation";
    final var query = OrganizationSearchQueryInput.builder().withText(searchText).build();
    final var searchObjects = withCredentials(adminUser,
        t -> queryExecutor.organizationList(getListFields(FIELDS), query));
    assertThat(searchObjects).isNotNull();
    assertThat(searchObjects.getTotalCount()).isOne();
    assertThat(searchObjects.getList()).allSatisfy(
        searchResult -> assertThat(searchResult.getCustomFields()).contains(searchText));
  }

  @Test
  void testUpdateConflict() {
    final String testUuid = "70193ee9-05b4-4aac-80b5-75609825db9f";
    final Organization test =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, testUuid));

    // Update it
    final OrganizationInput updatedInput = getOrganizationInput(test);
    final String updatedProfile = UUID.randomUUID().toString();
    updatedInput.setProfile(updatedProfile);
    final Integer nrUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", false, updatedInput));
    assertThat(nrUpdated).isOne();
    final Organization updated =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, testUuid));
    assertThat(updated.getUpdatedAt()).isAfter(test.getUpdatedAt());
    assertThat(updated.getProfile()).isEqualTo(updatedProfile);

    // Try to update it again, with the input that is now outdated
    final OrganizationInput outdatedInput = getOrganizationInput(test);
    try {
      withCredentials(adminUser,
          t -> mutationExecutor.updateOrganization("", false, outdatedInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      final Throwable rootCause = ExceptionUtils.getRootCause(expectedException);
      if (!(rootCause instanceof WebClientResponseException.Conflict)) {
        fail("Expected WebClientResponseException.Conflict");
      }
    }

    // Now do a force-update
    final Integer nrForceUpdated = withCredentials(adminUser,
        t -> mutationExecutor.updateOrganization("", true, outdatedInput));
    assertThat(nrForceUpdated).isOne();
    final Organization forceUpdated =
        withCredentials(adminUser, t -> queryExecutor.organization(FIELDS, testUuid));
    assertThat(forceUpdated.getUpdatedAt()).isAfter(updated.getUpdatedAt());
    assertThat(forceUpdated.getProfile()).isEqualTo(test.getProfile());
  }

  private void failCreateOrganization(final String username, final OrganizationInput orgInput) {
    try {
      withCredentials(username, t -> mutationExecutor.createOrganization(FIELDS, orgInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Organization succeedCreateOrganization(final String username,
      final OrganizationInput orgInput) {
    final Organization createdOrg =
        withCredentials(username, t -> mutationExecutor.createOrganization(FIELDS, orgInput));
    assertThat(createdOrg).isNotNull();
    assertThat(createdOrg.getUuid()).isNotNull();
    return createdOrg;
  }

  private void failUpdateOrganization(final String username, final OrganizationInput orgInput) {
    try {
      withCredentials(username, t -> mutationExecutor.updateOrganization("", false, orgInput));
      fail("Expected an Exception");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Organization succeedUpdateOrganization(final String username,
      final OrganizationInput orgInput) {
    final Integer numOrg =
        withCredentials(username, t -> mutationExecutor.updateOrganization("", false, orgInput));
    assertThat(numOrg).isOne();
    return withCredentials(username, t -> queryExecutor.organization(FIELDS, orgInput.getUuid()));
  }
}
