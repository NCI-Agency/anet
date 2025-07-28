package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.Lists;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.test.client.AnetBeanList_Person;
import mil.dds.anet.test.client.AnetBeanList_Report;
import mil.dds.anet.test.client.ApprovalStep;
import mil.dds.anet.test.client.ApprovalStepInput;
import mil.dds.anet.test.client.ApprovalStepType;
import mil.dds.anet.test.client.Atmosphere;
import mil.dds.anet.test.client.EmailAddress;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.OrganizationInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.PersonSearchQueryInput;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportAction;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportPerson;
import mil.dds.anet.test.client.ReportSearchQueryInput;
import mil.dds.anet.test.client.ReportState;
import mil.dds.anet.test.client.Task;
import mil.dds.anet.test.client.TaskInput;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.threads.AnetEmailWorker;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TaskApprovalTest extends AbstractResourceTest {

  private static final String EMAIL_ADDRESS_FIELDS = "{ network address }";
  private static final String ORGANIZATION_FIELDS =
      "{ uuid shortName longName status identificationCode }";
  private static final String POSITION_FIELDS =
      "{ uuid name code type status organization " + ORGANIZATION_FIELDS + " }";
  private static final String PERSON_FIELDS =
      "{ uuid name status user rank users { uuid domainUsername } emailAddresses "
          + EMAIL_ADDRESS_FIELDS + " position " + POSITION_FIELDS + " }";
  private static final String APPROVAL_STEP_FIELDS =
      "{ uuid name restrictedApproval relatedObjectUuid nextStepUuid approvers"
          + " { uuid name person { uuid name rank } } }";
  private static final String REPORT_FIELDS =
      "{ uuid state workflow { type createdAt person { uuid } step " + APPROVAL_STEP_FIELDS
          + " } reportPeople { uuid primary author attendee interlocutor } }";
  private static final String TASK_FIELDS =
      "{ uuid shortName longName status" + " plannedCompletion projectedCompletion"
          + " taskedOrganizations { uuid shortName longName identificationCode }"
          + " parentTask { uuid } responsiblePositions { uuid } planningApprovalSteps "
          + APPROVAL_STEP_FIELDS + " approvalSteps " + APPROVAL_STEP_FIELDS + " customFields }";

  // Test report approval scenarios for tasks mostly use the following data:
  // - report task 2.A (which has tasked org EF 2)
  // - task 2.A has approver for planning OF-9 Jackson, Jack (from org EF 2.1)
  // - task 2.A has approver for publication OF-6 Henderson, Henry (from org EF 2.1)
  // - report primary advisor CIV Reinton, Reina (from org EF 2.2)

  // Task 2.A
  private static final String TEST_TASK_UUID = "75d4009d-7c79-42e0-aa2f-d79d158ec8d6";
  // Location Fort Amherst
  private static final String TEST_LOCATION_UUID = "c7a9f420-457a-490c-a810-b504c022cf1e";

  private static FakeSmtpServer emailServer;
  private static AnetEmailWorker emailWorker;

  private static List<ApprovalStep> savedPlanningApprovalSteps;
  private static List<Position> savedPlanningApprovers;
  private static List<ApprovalStep> savedApprovalSteps;
  private static List<Position> savedApprovers;
  private static List<Organization> savedOrganizations;

  @Autowired
  protected AnetConfig config;

  @Autowired
  protected AnetDictionary dict;

  @BeforeAll
  void beforeAll() throws Exception {
    setUpEmailServer();
  }

  @BeforeEach
  @AfterEach
  void clearEmailServer() {
    // Clear the email server before and after each test
    clearEmailsOnServer();
  }

  @BeforeAll
  void saveTaskApprovalSteps() {
    final Task task = getTaskFromDb(TEST_TASK_UUID);
    savedPlanningApprovalSteps = Lists.newArrayList(task.getPlanningApprovalSteps());
    savedPlanningApprovalSteps.stream().findFirst()
        .ifPresent(as -> savedPlanningApprovers = as.getApprovers());
    savedApprovalSteps = Lists.newArrayList(task.getApprovalSteps());
    savedApprovalSteps.stream().findFirst().ifPresent(as -> savedApprovers = as.getApprovers());
    savedOrganizations = Lists.newArrayList(task.getTaskedOrganizations());
  }

  @AfterAll
  void restoreTaskApprovalSteps() {
    final TaskInput taskInput = getTaskInput(getTaskFromDb(TEST_TASK_UUID));
    final List<ApprovalStepInput> pasInput = getApprovalStepsInput(savedPlanningApprovalSteps);
    pasInput.stream().findFirst()
        .ifPresent(as -> as.setApprovers(getPositionsInput(savedPlanningApprovers)));
    taskInput.setPlanningApprovalSteps(pasInput);
    final List<ApprovalStepInput> asInput = getApprovalStepsInput(savedApprovalSteps);
    asInput.stream().findFirst()
        .ifPresent(as -> as.setApprovers(getPositionsInput(savedApprovers)));
    taskInput.setApprovalSteps(asInput);
    taskInput.setTaskedOrganizations(getOrganizationsInput(savedOrganizations));
    updateTask(taskInput);
  }

  // submitted report, no approval step for effort
  // => there should be no approval step for the effort on the report workflow
  @Test
  void testNoSteps() {
    final TaskInput taskInput = getTaskInput(clearTaskApprovalSteps(TEST_TASK_UUID));

    final Report report = submitReport("testNoSteps", getPersonFromDb("Erinson, Erin"), null,
        taskInput, false, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, taskInput.getUuid(), 0);

    // Go through organization approval
    organizationalApproval(report, false);
  }

  // submitted report, unrestricted approval step for effort has matching org
  // => there should be an approval step for the effort
  // => approver should see the report as pending approval
  // => approver should be able to approve the report
  @Test
  void testUnrestrictedStepMatchingOrgReportPublication() {
    testUnrestrictedStepMatchingOrg("testUnrestrictedStepMatchingOrgReportPublication", false);
  }

  @Test
  void testUnrestrictedStepMatchingOrgPlannedEngagement() {
    testUnrestrictedStepMatchingOrg("testUnrestrictedStepMatchingOrgPlannedEngagement", true);
  }

  private void testUnrestrictedStepMatchingOrg(String text, boolean isPlanned) {
    final TaskInput taskInput = getTaskInput(clearTaskApprovalSteps(TEST_TASK_UUID));

    final Person approver = getApprover(isPlanned);
    final TaskInput updatedTaskInput =
        getTaskInput(updateTaskApprovalSteps(taskInput, approver, isPlanned, false));

    final Report report = submitReport(text, getPersonFromDb("Erinson, Erin"), null,
        updatedTaskInput, isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTaskInput.getUuid(), 1);

    // Go through organization approval first
    organizationalApproval(report, isPlanned);

    // Check reports pending approval; approver should have received email
    checkPendingApproval(approver, report, 1, true, null);

    // Approve the report
    approveReport(report, approver, false);
    // Mail queue should be empty
    assertEmails(0);
  }

  // submitted report, unrestricted approval step for effort has no matching org
  // => there should be an approval step for the effort
  // => approver should see the report as pending approval
  // => approver should be able to approve the report
  @Test
  void testUnrestrictedStepNoMatchingOrgReportPublication() {
    testUnrestrictedStepNoMatchingOrg("testUnrestrictedStepNoMatchingOrgReportPublication", false);
  }

  @Test
  void testUnrestrictedStepNoMatchingOrgPlannedEngagement() {
    testUnrestrictedStepNoMatchingOrg("testUnrestrictedStepNoMatchingOrgPlannedEngagement", true);
  }

  private void testUnrestrictedStepNoMatchingOrg(String text, boolean isPlanned) {
    final TaskInput taskInput = getTaskInput(clearTaskApprovalSteps(TEST_TASK_UUID));

    // Someone from EF 1.1
    final Person approver = getPersonFromDb("Elizawell, Elizabeth");
    final TaskInput updatedTaskInput =
        getTaskInput(updateTaskApprovalSteps(taskInput, approver, isPlanned, false));

    final Report report = submitReport(text, getPersonFromDb("Erinson, Erin"), null,
        updatedTaskInput, isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTaskInput.getUuid(), 1);

    // Go through organization approval first
    organizationalApproval(report, isPlanned);

    // Check reports pending approval; approver should have received email
    checkPendingApproval(approver, report, 1, true, null);

    // Approve the report
    approveReport(report, approver, false);
    // Mail queue should be empty
    assertEmails(0);
  }

  // submitted report, restricted approval step for effort has no matching org
  // => there should be no approval step for the effort
  // => approver should not see the report as pending approval
  // => approver should not be able to approve the report
  @Test
  void testRestrictedStepNoMatchingOrgReportPublication() {
    testRestrictedStepNoMatchingOrg("testRestrictedStepNoMatchingOrgReportPublication", false);
  }

  @Test
  void testRestrictedStepNoMatchingOrgPlannedEngagement() {
    testRestrictedStepNoMatchingOrg("testRestrictedStepNoMatchingOrgPlannedEngagement", true);
  }

  private void testRestrictedStepNoMatchingOrg(String text, boolean isPlanned) {
    final TaskInput taskInput = getTaskInput(clearTaskApprovalSteps(TEST_TASK_UUID));

    // Someone from EF 1.1
    final Person approver = getPersonFromDb("Elizawell, Elizabeth");
    final TaskInput updatedTaskInput =
        getTaskInput(updateTaskApprovalSteps(taskInput, approver, isPlanned, true));

    final Person author = getPersonFromDb("Erinson, Erin");
    final Report report = submitReport(text, author, null, updatedTaskInput, isPlanned,
        isPlanned ? ReportState.APPROVED : ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTaskInput.getUuid(), 0);

    // Go through organization approval first
    organizationalApproval(report, isPlanned);

    // Check reports pending approval; approver should not have received email
    checkPendingApproval(approver, report, 0, true, null);

    // Try to approve the report
    approveReport(report, approver, true);

    // Delete the report
    deleteReport(author, report);
  }

  // submitted report, restricted approval step for effort has matching org
  // => there should be an approval step for the effort
  // => approver should see the report as pending approval
  // => approver should be able to approve the report
  @Test
  void testRestrictedStepMatchingOrgReportPublication() {
    testRestrictedStepMatchingOrg("testRestrictedStepMatchingOrgReportPublication", false);
  }

  @Test
  void testRestrictedStepMatchingOrgPlannedEngagement() {
    testRestrictedStepMatchingOrg("testRestrictedStepMatchingOrgPlannedEngagement", true);
  }

  private void testRestrictedStepMatchingOrg(String text, boolean isPlanned) {
    final TaskInput taskInput = getTaskInput(clearTaskApprovalSteps(TEST_TASK_UUID));

    final Person approver = getApprover(isPlanned);
    final TaskInput updatedTaskInput =
        getTaskInput(updateTaskApprovalSteps(taskInput, approver, isPlanned, true));

    final Report report = submitReport(text, getPersonFromDb("Erinson, Erin"), null,
        updatedTaskInput, isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTaskInput.getUuid(), 1);

    // Go through organization approval first
    organizationalApproval(report, isPlanned);

    // Check reports pending approval
    checkPendingApproval(approver, report, 1, true, null);

    // Approve the report
    approveReport(report, approver, false);
    // Mail queue should be empty
    assertEmails(0);
  }

  // submitted report, restricted approval step for effort has matching org,
  // but then task is edited to remove approver from matching org
  // => first, there should be an approval step for the effort,
  // after the edit the step should still be there but have no approvers
  // => first, approver should see the report as pending approval,
  // after the edit approver should not see the report as pending approval
  // and approver should not be able to approve the report
  @Test
  void testRestrictedStepEditedMatchingOrgReportPublication() {
    testRestrictedStepEditedMatchingOrg("testRestrictedStepEditedMatchingOrgReportPublication",
        false);
  }

  @Test
  void testRestrictedStepEditedMatchingOrgPlannedEngagement() {
    testRestrictedStepEditedMatchingOrg("testRestrictedStepEditedMatchingOrgPlannedEngagement",
        true);
  }

  private void testRestrictedStepEditedMatchingOrg(String text, boolean isPlanned) {
    final TaskInput taskInput = getTaskInput(clearTaskApprovalSteps(TEST_TASK_UUID));

    final Person approver = getApprover(isPlanned);
    final TaskInput updatedTaskInput =
        getTaskInput(updateTaskApprovalSteps(taskInput, approver, isPlanned, true));

    final Person author = getPersonFromDb("Erinson, Erin");
    final Report report =
        submitReport(text, author, null, updatedTaskInput, isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTaskInput.getUuid(), 1);

    // Go through organization approval first
    organizationalApproval(report, isPlanned);

    // Check reports pending approval
    checkPendingApproval(approver, report, 1, true, null);

    // Replace the approver from the approval step
    final Task replacedTask = replaceApproversFromTaskApprovalSteps(updatedTaskInput,
        getPersonFromDb("Elizawell, Elizabeth"), isPlanned);

    // Check that approval step has no approvers
    final Report report2 = getReport(author, report.getUuid());
    assertWorkflowSize(report2, replacedTask.getUuid(), 1);
    final Optional<ReportAction> taskStep =
        report2.getWorkflow().stream().filter(wfs -> wfs.getStep() != null
            && replacedTask.getUuid().equals(wfs.getStep().getRelatedObjectUuid())).findFirst();
    assertThat(taskStep).isPresent();
    assertThat(taskStep.get().getStep().getApprovers()).isEmpty();

    // Check reports pending approval; approver should not have received email
    checkPendingApproval(approver, report2, 0, true, null);

    // Try to approve the report
    approveReport(report2, approver, true);

    // Delete the report
    deleteReport(author, report2);
  }

  // submitted report, three approval steps for the effort:
  // 1. unrestricted approval step
  // 2. restricted approval step with no matching org
  // 3. restricted approval step with matching org
  //
  // => there should be two approval steps for the effort (middle one should be filtered out)
  // => approver 1 should see the report as pending approval
  // => approver 1 should be able to approve the report
  // => approver 2 should not see the report as pending approval
  // => approver 2 should not be able to approve the report
  // => approver 3 should see the report as pending approval
  // => approver 3 should be able to approve the report
  @Test
  void testMultipleStepsReportPublication() {
    testMultipleSteps("testMultipleStepsReportPublication", false);
  }

  @Test
  void testMultipleStepsPlannedEngagement() {
    testMultipleSteps("testMultipleStepsPlannedEngagement", false);
  }

  private void testMultipleSteps(String text, boolean isPlanned) {
    final TaskInput taskInput = getTaskInput(clearTaskApprovalSteps(TEST_TASK_UUID));

    // An unrestricted step
    final Person approverStep1 = getApprover(isPlanned);
    final ApprovalStepInput as1Input = getApprovalStepInput(approverStep1, isPlanned, false);

    // A restricted step from a non-matching org
    // Someone from EF 1.1
    final Person approverStep2 = getPersonFromDb("Elizawell, Elizabeth");
    final ApprovalStepInput as2Input = getApprovalStepInput(approverStep2, isPlanned, true);

    // A restricted step from a matching org
    final Person approverStep3 = getApprover(isPlanned);
    final ApprovalStepInput as3Input = getApprovalStepInput(approverStep3, isPlanned, true);

    if (isPlanned) {
      taskInput.setPlanningApprovalSteps(Lists.newArrayList(as1Input, as2Input, as3Input));
    } else {
      taskInput.setApprovalSteps(Lists.newArrayList(as1Input, as2Input, as3Input));
    }
    final TaskInput updatedTaskInput = getTaskInput(updateTask(taskInput));

    final Report report = submitReport(text, getPersonFromDb("Erinson, Erin"), null,
        updatedTaskInput, isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTaskInput.getUuid(), 2);

    // Go through organization approval first
    organizationalApproval(report, isPlanned);

    // Check reports pending approval; approverStep1 should have received email
    checkPendingApproval(approverStep1, report, 1, true, null);

    // Approve the report
    approveReport(report, approverStep1, false);

    // Check reports pending approval; email will be checked for approverStep3
    checkPendingApproval(approverStep2, report, 0, false, null);

    // Try to approve the report
    approveReport(report, approverStep2, true);

    // Check reports pending approval; approverStep3 should have received email
    checkPendingApproval(approverStep3, report, 1, true, null);

    // Approve the report
    approveReport(report, approverStep3, false);
    // Mail queue should be empty
    assertEmails(0);
  }

  // task T has approvers from org A and B
  // report1 submitted with advisorOrg A and task T
  // report2 submitted with advisorOrg A and task T
  // report3 submitted with advisorOrg B and task T
  // => approver from A should see reports 1 and 2
  // => approver from B should see report 3
  @Test
  void testGH3442() {
    final boolean isPlanned = false;
    final String text = "testTwoReports";
    final TaskInput taskInput = getTaskInput(clearTaskApprovalSteps(TEST_TASK_UUID));
    final Person author = getPersonFromDb("Erinson, Erin");

    final Person approver1 = getApprover(isPlanned);
    final TaskInput updatedTaskInput =
        getTaskInput(updateTaskApprovalSteps(taskInput, approver1, isPlanned, true));

    final Report report1 = submitReport(text + "1", author, null, updatedTaskInput, isPlanned,
        ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report1, updatedTaskInput.getUuid(), 1);
    organizationalApproval(report1, isPlanned);
    checkPendingApproval(approver1, report1, 1, true, null);

    final Report report2 = submitReport(text + "2", author, null, updatedTaskInput, isPlanned,
        ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report2, updatedTaskInput.getUuid(), 1);
    organizationalApproval(report2, isPlanned);
    checkPendingApproval(approver1, report2, 1, true, null);

    // Someone from EF 1.1
    final Person approver2 = getPersonFromDb("Elizawell, Elizabeth");
    final List<ApprovalStepInput> approvalStepsInput =
        new ArrayList<>(updatedTaskInput.getApprovalSteps());
    approvalStepsInput.add(getApprovalStepInput(approver2, isPlanned, true));
    updatedTaskInput.setApprovalSteps(approvalStepsInput);
    final List<OrganizationInput> taskedOrganizationsInput =
        new ArrayList<>(updatedTaskInput.getTaskedOrganizations());
    taskedOrganizationsInput.add(getOrganizationInput(approver2.getPosition().getOrganization()));
    updatedTaskInput.setTaskedOrganizations(taskedOrganizationsInput);
    final TaskInput updatedTask2Input = getTaskInput(updateTask(updatedTaskInput));
    final Report report3 = submitReport(text + "3", author, approver2, updatedTask2Input, isPlanned,
        ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report3, updatedTask2Input.getUuid(), 1);
    final Person org2Approver = getPersonFromDb("Bobtown, Bob");
    assertEmails(1, org2Approver);
    approveReport(report3, org2Approver, false);
    checkPendingApproval(approver2, report3, 1, true, null);

    // Check reports pending approval without pagination
    final ReportSearchQueryInput pendingQuery =
        ReportSearchQueryInput.builder().withPageNum(0).withPageSize(0).build();
    final AnetBeanList_Report allResults1 =
        checkPendingApproval(approver1, report1, 1, false, pendingQuery);
    assertThat(allResults1.getTotalCount()).isEqualTo(2);
    checkPendingApproval(approver1, report2, 1, false, pendingQuery);
    checkPendingApproval(approver1, report3, 0, false, pendingQuery);
    final AnetBeanList_Report allResults2 =
        checkPendingApproval(approver2, report1, 0, false, pendingQuery);
    assertThat(allResults2.getTotalCount()).isEqualTo(1);
    checkPendingApproval(approver2, report2, 0, false, pendingQuery);
    checkPendingApproval(approver2, report3, 1, false, pendingQuery);

    // Now try with a pageSize of 1
    pendingQuery.setPageSize(1);
    // Due to sorting, report2 is the first one returned
    final AnetBeanList_Report results1p1 =
        checkPendingApproval(approver1, report2, 1, false, pendingQuery);
    assertPendingReports(allResults1, results1p1, pendingQuery, pendingQuery.getPageSize());
    // Here, report3 should be returned
    final AnetBeanList_Report results2p1 =
        checkPendingApproval(approver2, report3, 1, false, pendingQuery);
    assertPendingReports(allResults2, results2p1, pendingQuery, pendingQuery.getPageSize());
    // Retrieve the next page
    pendingQuery.setPageNum(pendingQuery.getPageNum() + 1);
    // Should return report1
    final AnetBeanList_Report results1p2 =
        checkPendingApproval(approver1, report1, 1, false, pendingQuery);
    assertPendingReports(allResults1, results1p2, pendingQuery, pendingQuery.getPageSize());
    // Should return an empty page as there are no more results
    final AnetBeanList_Report results2p2 =
        checkPendingApproval(approver2, report3, 0, false, pendingQuery);
    assertPendingReports(allResults2, results2p2, pendingQuery, 0);

    // Delete the reports
    deleteReport(author, report1);
    deleteReport(author, report2);
    deleteReport(author, report3);
  }

  // Helper methods below

  protected void assertPendingReports(final AnetBeanList_Report allResults,
      final AnetBeanList_Report paginatedResults, final ReportSearchQueryInput pendingQuery,
      int size) {
    assertThat(paginatedResults.getTotalCount()).isEqualTo(allResults.getTotalCount());
    assertThat(paginatedResults.getPageNum()).isEqualTo(pendingQuery.getPageNum());
    assertThat(paginatedResults.getPageSize()).isEqualTo(pendingQuery.getPageSize());
    assertThat(paginatedResults.getList()).hasSize(size);
  }

  private Task clearTaskApprovalSteps(String uuid) {
    final TaskInput taskInput = getTaskInput(getTaskFromDb(uuid));
    taskInput.setPlanningApprovalSteps(Collections.emptyList());
    taskInput.setApprovalSteps(Collections.emptyList());
    return updateTask(taskInput);
  }

  private Task updateTaskApprovalSteps(TaskInput taskInput, Person approver, boolean isPlanned,
      boolean restrictedApproval) {
    final ApprovalStepInput asInput = getApprovalStepInput(approver, isPlanned, restrictedApproval);
    if (isPlanned) {
      taskInput.setPlanningApprovalSteps(Lists.newArrayList(asInput));
    } else {
      taskInput.setApprovalSteps(Lists.newArrayList(asInput));
    }
    return updateTask(taskInput);
  }

  private ApprovalStepInput getApprovalStepInput(Person approver, boolean isPlanned,
      boolean restrictedApproval) {
    final Person unrelatedApprover = getPersonFromDb("Anderson, Andrew");
    return ApprovalStepInput.builder().withName("Task approval by " + approver.getName())
        .withType(isPlanned ? ApprovalStepType.PLANNING_APPROVAL : ApprovalStepType.REPORT_APPROVAL)
        .withRestrictedApproval(restrictedApproval).withApprovers(getPositionsInput(
            Lists.newArrayList(approver.getPosition(), unrelatedApprover.getPosition())))
        .build();
  }

  private Person getApprover(boolean isPlanned) {
    // Both from EF 2.1
    return getPersonFromDb(isPlanned ? "Jackson, Jack" : "Henderson, Henry");
  }

  private Task replaceApproversFromTaskApprovalSteps(TaskInput taskInput, Person approver,
      boolean isPlanned) {
    if (isPlanned) {
      taskInput.getPlanningApprovalSteps().get(0)
          .setApprovers(getPositionsInput(Lists.newArrayList(approver.getPosition())));
    } else {
      taskInput.getApprovalSteps().get(0)
          .setApprovers(getPositionsInput(Lists.newArrayList(approver.getPosition())));
    }
    return updateTask(taskInput);
  }

  private void organizationalApproval(Report report, boolean isPlanned) {
    // No organizational workflow for planned engagements
    if (!isPlanned) {
      final Person jacob = getPersonFromDb("Jacobson, Jacob");
      // jacob should have received email
      assertEmails(1, jacob);
      approveReport(report, jacob, false);
      final Person rebecca = getPersonFromDb("Beccabon, Rebecca");
      // rebecca should have received email
      assertEmails(1, rebecca);
      approveReport(report, rebecca, false);
    }
  }

  private void approveReport(Report report, Person person, boolean expectedToFail) {
    try {
      final int numRows = withCredentials(getDomainUsername(person),
          t -> mutationExecutor.approveReport("", null, report.getUuid()));
      if (expectedToFail) {
        fail("Expected an exception");
      }
      assertThat(numRows).isOne();
    } catch (Exception e) {
      if (!expectedToFail) {
        fail("Unexpected exception", e);
      }
    }

    sendEmailsToServer();
  }

  private AnetBeanList_Report checkPendingApproval(Person approver, Report report, int size,
      boolean checkEmails, ReportSearchQueryInput pendingQuery) {
    final ReportSearchQueryInput query =
        Objects.requireNonNullElseGet(pendingQuery, ReportSearchQueryInput::new);
    query.setPendingApprovalOf(approver.getUuid());
    final AnetBeanList_Report pendingApproval = withCredentials(getDomainUsername(approver),
        t -> queryExecutor.reportList(getListFields(REPORT_FIELDS), query));
    assertThat(pendingApproval.getList()).filteredOn(rpt -> rpt.getUuid().equals(report.getUuid()))
        .hasSize(size);
    if (checkEmails) {
      if (size > 0) {
        // approver should have received email
        assertEmails(size, approver);
      } else {
        // approver should not have received email
        assertEmails(0);
      }
    }
    return pendingApproval;
  }

  private Report submitReport(String text, Person author, Person reportAdvisor, TaskInput taskInput,
      boolean isPlanned, ReportState expectedState) {
    if (reportAdvisor == null) {
      reportAdvisor = getPersonFromDb("Reinton, Reina");
    }
    final ReportPerson advisor = personToPrimaryReportPerson(reportAdvisor, false);
    final ReportPerson interlocutor =
        personToPrimaryReportPerson(getPersonFromDb("Steveson, Steve"), true);
    final String testText = String.format("Test report for task approval workflow — %1$s", text);
    final ReportInput reportInput = ReportInput.builder()
        .withEngagementDate(Instant.now().plus(isPlanned ? 14 : -14, ChronoUnit.DAYS))
        .withDuration(120)
        .withReportPeople(getReportPeopleInput(
            Lists.newArrayList(advisor, interlocutor, personToReportAuthor(author))))
        .withTasks(Lists.newArrayList(taskInput))
        .withLocation(LocationInput.builder().withUuid(TEST_LOCATION_UUID).build())
        .withAtmosphere(Atmosphere.POSITIVE).withIntent(testText).withReportText(testText)
        .withNextSteps(testText).withKeyOutcomes(testText).build();

    // Create the report
    final Report createdReport = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.createReport("{ uuid }", reportInput));
    assertThat(createdReport).isNotNull();
    assertThat(createdReport.getUuid()).isNotNull();

    // Retrieve the created report
    final Report created = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report("{ uuid state advisorOrg { uuid } }", createdReport.getUuid()));
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(created.getAdvisorOrg().getUuid())
        .isEqualTo(reportAdvisor.getPosition().getOrganization().getUuid());

    // Have the author submit the report
    final int numRows = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.submitReport("", created.getUuid()));
    assertThat(numRows).isOne();

    sendEmailsToServer();

    // Retrieve the submitted report
    final Report submitted = getReport(author, created.getUuid());
    assertThat(submitted.getUuid()).isEqualTo(created.getUuid());
    assertThat(submitted.getState()).isEqualTo(expectedState);

    return submitted;
  }

  private Report getReport(Person author, String reportUuid) {
    final Report returned = withCredentials(getDomainUsername(author),
        t -> queryExecutor.report(REPORT_FIELDS, reportUuid));
    assertThat(returned).isNotNull();
    return returned;
  }

  private void deleteReport(Person author, Report report) {
    final Report updated = withCredentials(getDomainUsername(author),
        t -> mutationExecutor.updateReport(REPORT_FIELDS, getReportInput(report), true));
    assertThat(updated).isNotNull();
    assertThat(updated.getState()).isEqualTo(ReportState.DRAFT);
    withCredentials(getDomainUsername(author),
        t -> mutationExecutor.deleteReport("", report.getUuid()));
  }

  private void assertWorkflowSize(Report report, String taskUuid, int expectedSize) {
    assertThat(report.getWorkflow()).isNotNull();
    assertThat(report.getWorkflow())
        .filteredOn(
            wfs -> wfs.getStep() != null && taskUuid.equals(wfs.getStep().getRelatedObjectUuid()))
        .hasSize(expectedSize);
  }

  private Person getPersonFromDb(String name) {
    final PersonSearchQueryInput personQuery =
        PersonSearchQueryInput.builder().withText(name).build();
    final AnetBeanList_Person searchResults = withCredentials(adminUser,
        t -> queryExecutor.personList(getListFields(PERSON_FIELDS), personQuery));
    assertThat(searchResults.getTotalCount()).isPositive();
    final Optional<Person> personResult =
        searchResults.getList().stream().filter(p -> p.getName().equals(name)).findFirst();
    assertThat(personResult).isNotEmpty();
    return personResult.get();
  }

  private Task getTaskFromDb(String uuid) {
    final Task task = withCredentials(adminUser, t -> queryExecutor.task(TASK_FIELDS, uuid));
    assertThat(task).isNotNull();
    assertThat(task.getUuid()).isEqualTo(uuid);
    return task;
  }

  private Task updateTask(TaskInput task) {
    final Integer nrUpdated =
        withCredentials(adminUser, t -> mutationExecutor.updateTask("", task));
    assertThat(nrUpdated).isEqualTo(1);
    return getTaskFromDb(task.getUuid());
  }

}
