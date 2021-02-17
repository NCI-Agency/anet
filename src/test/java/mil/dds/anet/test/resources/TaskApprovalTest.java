package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.collect.Lists;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.test.beans.PersonTest;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.test.integration.utils.TestApp;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import mil.dds.anet.threads.AnetEmailWorker;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class TaskApprovalTest extends AbstractResourceTest {

  private static final String ORGANIZATION_FIELDS =
      "uuid shortName longName status identificationCode type";
  private static final String POSITION_FIELDS =
      "uuid name code type status organization { " + ORGANIZATION_FIELDS + " }";
  private static final String PERSON_FIELDS =
      "uuid name status role rank domainUsername emailAddress position { " + POSITION_FIELDS + " }";
  private static final String APPROVAL_STEP_FIELDS =
      "uuid name restrictedApproval relatedObjectUuid nextStepUuid approvers"
          + " { uuid name person { uuid name rank role } }";
  private static final String REPORT_FIELDS =
      "uuid state workflow { type createdAt person { uuid } step { " + APPROVAL_STEP_FIELDS
          + " } } reportPeople { uuid role primary author attendee }";
  private static final String TASK_FIELDS = "uuid shortName longName status"
      + " customField customFieldEnum1 customFieldEnum2 plannedCompletion projectedCompletion"
      + " taskedOrganizations { uuid shortName longName identificationCode }"
      + " customFieldRef1 { uuid } responsiblePositions { uuid } planningApprovalSteps { "
      + APPROVAL_STEP_FIELDS + " } approvalSteps { " + APPROVAL_STEP_FIELDS + " } customFields";

  // Test report approval scenarios for tasks mostly use the following data:
  // - report task 2.A (which has tasked org EF 2)
  // - task 2.A has approver for planning OF-9 JACKSON, Jack (from org EF 2.1)
  // - task 2.A has approver for publication BGen HENDERSON, Henry (from org EF 2.1)
  // - report primary advisor CIV REINTON, Reina (from org EF 2.2)

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

  @BeforeAll
  public static void setUpEmailServer() throws Exception {
    final AnetConfiguration config = TestApp.app.getConfiguration();
    if (config.getSmtp().isDisabled()) {
      fail("'ANET_SMTP_DISABLE' system environment variable must have value 'false' to run test.");
    }
    final Map<String, Object> dict = new HashMap<>(config.getDictionary());
    @SuppressWarnings("unchecked")
    final List<String> activeDomainNames = (List<String>) dict.get("activeDomainNames");
    activeDomainNames.add("example.com");
    config.setDictionary(dict);
    emailWorker = new AnetEmailWorker(config, AnetObjectEngine.getInstance().getEmailDao());
    emailServer = new FakeSmtpServer(config.getSmtp());
  }

  @BeforeEach
  @AfterEach
  public void clearEmailServer() {
    // Clear the email server before and after each test
    clearEmailsOnServer();
  }

  @BeforeAll
  public static void saveTaskApprovalSteps() throws Exception {
    final Task task = getTaskFromDb(TEST_TASK_UUID);
    savedPlanningApprovalSteps = Lists.newArrayList(task.getPlanningApprovalSteps());
    savedPlanningApprovalSteps.stream().findFirst()
        .ifPresent(as -> savedPlanningApprovers = as.getApprovers());
    savedApprovalSteps = Lists.newArrayList(task.getApprovalSteps());
    savedApprovalSteps.stream().findFirst().ifPresent(as -> savedApprovers = as.getApprovers());
    savedOrganizations = Lists.newArrayList(task.getTaskedOrganizations());
  }

  @AfterAll
  public static void restoreTaskApprovalSteps() {
    final Task task = getTaskFromDb(TEST_TASK_UUID);
    savedPlanningApprovalSteps.stream().findFirst()
        .ifPresent(as -> as.setApprovers(savedPlanningApprovers));
    task.setPlanningApprovalSteps(savedPlanningApprovalSteps);
    savedApprovalSteps.stream().findFirst().ifPresent(as -> as.setApprovers(savedApprovers));
    task.setApprovalSteps(savedApprovalSteps);
    task.setTaskedOrganizations(savedOrganizations);
    updateTask(task);
  }

  // submitted report, no approval step for effort
  // => there should be no approval step for the effort on the report workflow
  @Test
  public void testNoSteps() {
    final Task task = clearTaskApprovalSteps(TEST_TASK_UUID);

    final Report report = submitReport("testNoSteps", getPersonFromDb("ERINSON, Erin"), null, task,
        false, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, task.getUuid(), 0);

    // Go through organization approval
    organizationalApproval(report, false);
  }

  // submitted report, unrestricted approval step for effort has matching org
  // => there should be an approval step for the effort
  // => approver should see the report as pending approval
  // => approver should be able to approve the report
  @Test
  public void testUnrestrictedStepMatchingOrgReportPublication() {
    testUnrestrictedStepMatchingOrg("testUnrestrictedStepMatchingOrgReportPublication", false);
  }

  @Test
  public void testUnrestrictedStepMatchingOrgPlannedEngagement() {
    testUnrestrictedStepMatchingOrg("testUnrestrictedStepMatchingOrgPlannedEngagement", true);
  }

  private void testUnrestrictedStepMatchingOrg(String text, boolean isPlanned) {
    final Task task = clearTaskApprovalSteps(TEST_TASK_UUID);

    final Person approver = getApprover(isPlanned);
    final Task updatedTask = updateTaskApprovalSteps(task, approver, isPlanned, false);

    final Report report = submitReport(text, getPersonFromDb("ERINSON, Erin"), null, updatedTask,
        isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTask.getUuid(), 1);

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
  public void testUnrestrictedStepNoMatchingOrgReportPublication() {
    testUnrestrictedStepNoMatchingOrg("testUnrestrictedStepNoMatchingOrgReportPublication", false);
  }

  @Test
  public void testUnrestrictedStepNoMatchingOrgPlannedEngagement() {
    testUnrestrictedStepNoMatchingOrg("testUnrestrictedStepNoMatchingOrgPlannedEngagement", true);
  }

  private void testUnrestrictedStepNoMatchingOrg(String text, boolean isPlanned) {
    final Task task = clearTaskApprovalSteps(TEST_TASK_UUID);

    // Someone from EF 1.1
    final Person approver = getPersonFromDb("ELIZAWELL, Elizabeth");
    final Task updatedTask = updateTaskApprovalSteps(task, approver, isPlanned, false);

    final Report report = submitReport(text, getPersonFromDb("ERINSON, Erin"), null, updatedTask,
        isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTask.getUuid(), 1);

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
  public void testRestrictedStepNoMatchingOrgReportPublication() {
    testRestrictedStepNoMatchingOrg("testRestrictedStepNoMatchingOrgReportPublication", false);
  }

  @Test
  public void testRestrictedStepNoMatchingOrgPlannedEngagement() {
    testRestrictedStepNoMatchingOrg("testRestrictedStepNoMatchingOrgPlannedEngagement", true);
  }

  private void testRestrictedStepNoMatchingOrg(String text, boolean isPlanned) {
    final Task task = clearTaskApprovalSteps(TEST_TASK_UUID);

    // Someone from EF 1.1
    final Person approver = getPersonFromDb("ELIZAWELL, Elizabeth");
    final Task updatedTask = updateTaskApprovalSteps(task, approver, isPlanned, true);

    final Person author = getPersonFromDb("ERINSON, Erin");
    final Report report = submitReport(text, author, null, updatedTask, isPlanned,
        isPlanned ? ReportState.APPROVED : ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTask.getUuid(), 0);

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
  public void testRestrictedStepMatchingOrgReportPublication() {
    testRestrictedStepMatchingOrg("testRestrictedStepMatchingOrgReportPublication", false);
  }

  @Test
  public void testRestrictedStepMatchingOrgPlannedEngagement() {
    testRestrictedStepMatchingOrg("testRestrictedStepMatchingOrgPlannedEngagement", true);
  }

  private void testRestrictedStepMatchingOrg(String text, boolean isPlanned) {
    final Task task = clearTaskApprovalSteps(TEST_TASK_UUID);

    final Person approver = getApprover(isPlanned);
    final Task updatedTask = updateTaskApprovalSteps(task, approver, isPlanned, true);

    final Report report = submitReport(text, getPersonFromDb("ERINSON, Erin"), null, updatedTask,
        isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTask.getUuid(), 1);

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
  public void testRestrictedStepEditedMatchingOrgReportPublication() {
    testRestrictedStepEditedMatchingOrg("testRestrictedStepEditedMatchingOrgReportPublication",
        false);
  }

  @Test
  public void testRestrictedStepEditedMatchingOrgPlannedEngagement() {
    testRestrictedStepEditedMatchingOrg("testRestrictedStepEditedMatchingOrgPlannedEngagement",
        true);
  }

  private void testRestrictedStepEditedMatchingOrg(String text, boolean isPlanned) {
    final Task task = clearTaskApprovalSteps(TEST_TASK_UUID);

    final Person approver = getApprover(isPlanned);
    final Task updatedTask = updateTaskApprovalSteps(task, approver, isPlanned, true);

    final Person author = getPersonFromDb("ERINSON, Erin");
    final Report report =
        submitReport(text, author, null, updatedTask, isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTask.getUuid(), 1);

    // Go through organization approval first
    organizationalApproval(report, isPlanned);

    // Check reports pending approval
    checkPendingApproval(approver, report, 1, true, null);

    // Replace the approver from the approval step
    final Task replacedTask = replaceApproversFromTaskApprovalSteps(updatedTask,
        getPersonFromDb("ELIZAWELL, Elizabeth"), isPlanned);

    // Check that approval step has no approvers
    final Report report2 = getReport(author, report);
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
  public void testMultipleStepsReportPublication() {
    testMultipleSteps("testMultipleStepsReportPublication", false);
  }

  @Test
  public void testMultipleStepsPlannedEngagement() {
    testMultipleSteps("testMultipleStepsPlannedEngagement", false);
  }

  private void testMultipleSteps(String text, boolean isPlanned) {
    final Task task = clearTaskApprovalSteps(TEST_TASK_UUID);

    // An unrestricted step
    final Person approverStep1 = getApprover(isPlanned);
    final ApprovalStep as1 = getApprovalStep(approverStep1, isPlanned, false);

    // A restricted step from a non-matching org
    // Someone from EF 1.1
    final Person approverStep2 = getPersonFromDb("ELIZAWELL, Elizabeth");
    final ApprovalStep as2 = getApprovalStep(approverStep2, isPlanned, true);

    // A restricted step from a matching org
    final Person approverStep3 = getApprover(isPlanned);
    final ApprovalStep as3 = getApprovalStep(approverStep3, isPlanned, true);

    if (isPlanned) {
      task.setPlanningApprovalSteps(Lists.newArrayList(as1, as2, as3));
    } else {
      task.setApprovalSteps(Lists.newArrayList(as1, as2, as3));
    }
    final Task updatedTask = updateTask(task);

    final Report report = submitReport(text, getPersonFromDb("ERINSON, Erin"), null, updatedTask,
        isPlanned, ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report, updatedTask.getUuid(), 2);

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
  public void testGH3442() {
    final boolean isPlanned = false;
    final String text = "testTwoReports";
    final Task task = clearTaskApprovalSteps(TEST_TASK_UUID);
    final Person author = getPersonFromDb("ERINSON, Erin");

    final Person approver1 = getApprover(isPlanned);
    final Task updatedTask = updateTaskApprovalSteps(task, approver1, isPlanned, true);

    final Report report1 = submitReport(text + "1", author, null, updatedTask, isPlanned,
        ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report1, updatedTask.getUuid(), 1);
    organizationalApproval(report1, isPlanned);
    checkPendingApproval(approver1, report1, 1, true, null);

    final Report report2 = submitReport(text + "2", author, null, updatedTask, isPlanned,
        ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report2, updatedTask.getUuid(), 1);
    organizationalApproval(report2, isPlanned);
    checkPendingApproval(approver1, report2, 1, true, null);

    // Someone from EF 1.1
    final Person approver2 = getPersonFromDb("ELIZAWELL, Elizabeth");
    updatedTask.getApprovalSteps().add(getApprovalStep(approver2, isPlanned, true));
    updatedTask.getTaskedOrganizations().add(approver2.getPosition().getOrganization());
    final Task updatedTask2 = updateTask(updatedTask);
    final Report report3 = submitReport(text + "3", author, approver2, updatedTask2, isPlanned,
        ReportState.PENDING_APPROVAL);
    assertWorkflowSize(report3, updatedTask2.getUuid(), 1);
    final Person org2Approver = getPersonFromDb("BOBTOWN, Bob");
    assertEmails(1, org2Approver);
    approveReport(report3, org2Approver, false);
    checkPendingApproval(approver2, report3, 1, true, null);

    final ReportSearchQuery pendingQuery = new ReportSearchQuery();
    // Check reports pending approval (without pagination)
    pendingQuery.setPageSize(0);
    final AnetBeanList<Report> allResults1 =
        checkPendingApproval(approver1, report1, 1, false, pendingQuery);
    assertThat(allResults1.getTotalCount()).isEqualTo(2);
    checkPendingApproval(approver1, report2, 1, false, pendingQuery);
    checkPendingApproval(approver1, report3, 0, false, pendingQuery);
    final AnetBeanList<Report> allResults2 =
        checkPendingApproval(approver2, report1, 0, false, pendingQuery);
    assertThat(allResults2.getTotalCount()).isEqualTo(1);
    checkPendingApproval(approver2, report2, 0, false, pendingQuery);
    checkPendingApproval(approver2, report3, 1, false, pendingQuery);

    // Now try with a pageSize of 1
    pendingQuery.setPageSize(1);
    // Due to sorting, report2 is the first one returned
    final AnetBeanList<Report> results1p1 =
        checkPendingApproval(approver1, report2, 1, false, pendingQuery);
    assertPendingReports(allResults1, results1p1, pendingQuery, pendingQuery.getPageSize());
    // Here, report3 should be returned
    final AnetBeanList<Report> results2p1 =
        checkPendingApproval(approver2, report3, 1, false, pendingQuery);
    assertPendingReports(allResults2, results2p1, pendingQuery, pendingQuery.getPageSize());
    // Retrieve the next page
    pendingQuery.setPageNum(pendingQuery.getPageNum() + 1);
    // Should return report1
    final AnetBeanList<Report> results1p2 =
        checkPendingApproval(approver1, report1, 1, false, pendingQuery);
    assertPendingReports(allResults1, results1p2, pendingQuery, pendingQuery.getPageSize());
    // Should return an empty page as there are no more results
    final AnetBeanList<Report> results2p2 =
        checkPendingApproval(approver2, report3, 0, false, pendingQuery);
    assertPendingReports(allResults2, results2p2, pendingQuery, 0);

    // Delete the reports
    deleteReport(author, report1);
    deleteReport(author, report2);
    deleteReport(author, report3);
  }

  // Helper methods below

  protected void assertPendingReports(final AnetBeanList<Report> allResults,
      final AnetBeanList<Report> paginatedResults, final ReportSearchQuery pendingQuery, int size) {
    assertThat(paginatedResults.getTotalCount()).isEqualTo(allResults.getTotalCount());
    assertThat(paginatedResults.getPageNum()).isEqualTo(pendingQuery.getPageNum());
    assertThat(paginatedResults.getPageSize()).isEqualTo(pendingQuery.getPageSize());
    assertThat(paginatedResults.getList().size()).isEqualTo(size);
  }

  private Task clearTaskApprovalSteps(String uuid) {
    final Task task = getTaskFromDb(uuid);
    task.setPlanningApprovalSteps(Collections.emptyList());
    task.setApprovalSteps(Collections.emptyList());
    return updateTask(task);
  }

  private Task updateTaskApprovalSteps(Task task, Person approver, boolean isPlanned,
      boolean restrictedApproval) {
    final ApprovalStep as = getApprovalStep(approver, isPlanned, restrictedApproval);
    if (isPlanned) {
      task.setPlanningApprovalSteps(Lists.newArrayList(as));
    } else {
      task.setApprovalSteps(Lists.newArrayList(as));
    }
    return updateTask(task);
  }

  private ApprovalStep getApprovalStep(Person approver, boolean isPlanned,
      boolean restrictedApproval) {
    final ApprovalStep as = new ApprovalStep();
    as.setName("Task approval by " + approver.getName());
    as.setType(isPlanned ? ApprovalStepType.PLANNING_APPROVAL : ApprovalStepType.REPORT_APPROVAL);
    as.setRestrictedApproval(restrictedApproval);
    final Person unrelatedApprover = getPersonFromDb("ANDERSON, Andrew");
    as.setApprovers(Lists.newArrayList(approver.getPosition(), unrelatedApprover.getPosition()));
    return as;
  }

  private Person getApprover(boolean isPlanned) {
    // Both from EF 2.1
    return getPersonFromDb(isPlanned ? "JACKSON, Jack" : "HENDERSON, Henry");
  }

  private Task replaceApproversFromTaskApprovalSteps(Task task, Person approver,
      boolean isPlanned) {
    if (isPlanned) {
      task.getPlanningApprovalSteps().get(0)
          .setApprovers(Lists.newArrayList(approver.getPosition()));
    } else {
      task.getApprovalSteps().get(0).setApprovers(Lists.newArrayList(approver.getPosition()));
    }
    return updateTask(task);
  }

  private void organizationalApproval(Report report, boolean isPlanned) {
    // No organizational workflow for planned engagements
    if (!isPlanned) {
      final Person jacob = getPersonFromDb("JACOBSON, Jacob");
      // jacob should have received email
      assertEmails(1, jacob);
      approveReport(report, jacob, false);
      final Person rebecca = getPersonFromDb("BECCABON, Rebecca");
      // rebecca should have received email
      assertEmails(1, rebecca);
      approveReport(report, rebecca, false);
    }
  }

  private void approveReport(Report report, Person person, boolean expectedToFail) {
    try {
      final Report approved =
          graphQLHelper.updateObject(person, "approveReport", "uuid", REPORT_FIELDS, "String",
              report.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
      if (expectedToFail) {
        fail("Expected an exception");
      }
      assertThat(approved).isNotNull();
    } catch (BadRequestException | ForbiddenException e) {
      if (!expectedToFail) {
        fail("Unexpected exception");
      }
    }

    sendEmailsToServer();
  }

  private AnetBeanList<Report> checkPendingApproval(Person approver, Report report, int size,
      boolean checkEmails, ReportSearchQuery pendingQuery) {
    if (pendingQuery == null) {
      pendingQuery = new ReportSearchQuery();
    }
    pendingQuery.setPendingApprovalOf(approver.getUuid());
    final AnetBeanList<Report> pendingApproval = graphQLHelper.searchObjects(approver, "reportList",
        "query", "ReportSearchQueryInput", REPORT_FIELDS, pendingQuery,
        new TypeReference<GraphQlResponse<AnetBeanList<Report>>>() {});
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

  private Report submitReport(String text, Person author, Person reportAdvisor, Task task,
      boolean isPlanned, ReportState expectedState) {
    final Report r = new Report();
    final Instant engagementDate = Instant.now().plus(isPlanned ? 14 : -14, ChronoUnit.DAYS);
    r.setEngagementDate(engagementDate);
    r.setDuration(120);
    if (reportAdvisor == null) {
      reportAdvisor = getPersonFromDb("REINTON, Reina");
    }
    final ReportPerson advisor = PersonTest.personToPrimaryReportPerson(reportAdvisor);
    final Person steve = getPersonFromDb("STEVESON, Steve");
    final ReportPerson principal = PersonTest.personToPrimaryReportPerson(steve);
    r.setReportPeople(
        Lists.newArrayList(advisor, principal, PersonTest.personToReportAuthor(author)));
    r.setTasks(Lists.newArrayList(task));
    final Location testLocation = new Location();
    testLocation.setUuid(TEST_LOCATION_UUID);
    r.setLocation(testLocation);
    r.setAtmosphere(Atmosphere.POSITIVE);
    final String testText = String.format("Test report for task approval workflow — %1$s", text);
    r.setIntent(testText);
    r.setReportText(testText);
    r.setNextSteps(testText);
    r.setKeyOutcomes(testText);

    // Create the report
    final String createdUuid = graphQLHelper.createObject(author, "createReport", "report",
        "ReportInput", r, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(createdUuid).isNotNull();

    // Retrieve the created report
    final Report created =
        graphQLHelper.getObjectById(author, "report", "uuid state advisorOrg { uuid }", createdUuid,
            new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(created.getUuid()).isNotNull();
    assertThat(created.getState()).isEqualTo(ReportState.DRAFT);
    assertThat(created.getAdvisorOrgUuid())
        .isEqualTo(reportAdvisor.getPosition().getOrganizationUuid());

    // Have the author submit the report
    final Report submitted = graphQLHelper.updateObject(author, "submitReport", "uuid", "uuid",
        "String", created.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(submitted).isNotNull();
    assertThat(submitted.getUuid()).isEqualTo(created.getUuid());

    sendEmailsToServer();

    // Retrieve the submitted report
    final Report returned = getReport(author, submitted);
    assertThat(returned.getUuid()).isEqualTo(submitted.getUuid());
    assertThat(returned.getState()).isEqualTo(expectedState);

    return returned;
  }

  private Report getReport(Person author, Report report) {
    final Report returned = graphQLHelper.getObjectById(author, "report", REPORT_FIELDS,
        report.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(returned).isNotNull();
    return returned;
  }

  private void deleteReport(Person author, Report report) {
    final Report updated = graphQLHelper.updateObject(author, "updateReport", "report",
        REPORT_FIELDS, "ReportInput", report, new TypeReference<GraphQlResponse<Report>>() {});
    assertThat(updated).isNotNull();
    assertThat(updated.getState()).isEqualTo(ReportState.DRAFT);
    graphQLHelper.deleteObject(author, "deleteReport", report.getUuid());
  }

  private void assertWorkflowSize(Report report, String taskUuid, int expectedSize) {
    assertThat(report.getWorkflow()).isNotNull();
    assertThat(report.getWorkflow())
        .filteredOn(
            wfs -> wfs.getStep() != null && taskUuid.equals(wfs.getStep().getRelatedObjectUuid()))
        .hasSize(expectedSize);
  }

  private void assertEmails(int expectedNrOfEmails, Person... expectedRecipients) {
    final List<EmailResponse> emails = getEmailsFromServer();
    // Check the number of email messages
    assertThat(emails.size()).isEqualTo(expectedNrOfEmails);
    // Check that each message has one of the intended recipients
    emails.forEach(e -> assertThat(expectedRecipients)
        .anyMatch(r -> emailMatchesRecipient(e, r.getEmailAddress())));
    // Check that each recipient received a message
    Arrays.asList(expectedRecipients).forEach(
        r -> assertThat(emails).anyMatch(e -> emailMatchesRecipient(e, r.getEmailAddress())));
    // Clean up
    clearEmailsOnServer();
  }

  private boolean emailMatchesRecipient(EmailResponse email, String expectedRecipientAddress) {
    return email.to.values.stream().anyMatch(v -> v.address.equals(expectedRecipientAddress));
  }

  private void sendEmailsToServer() {
    // Make sure all messages have been (asynchronously) sent
    emailWorker.run();
  }

  private List<EmailResponse> getEmailsFromServer() {
    try {
      return emailServer.requestAllEmailsFromServer();
    } catch (Exception e) {
      fail("Error checking emails", e);
    }
    return null;
  }

  private void clearEmailsOnServer() {
    try {
      emailServer.clearEmailServer();
    } catch (Exception e) {
      fail("Error clearing emails", e);
    }
  }

  private static Person getPersonFromDb(String name) {
    final PersonSearchQuery personQuery = new PersonSearchQuery();
    personQuery.setText(name);
    final AnetBeanList<Person> searchResults = graphQLHelper.searchObjects(admin, "personList",
        "query", "PersonSearchQueryInput", PERSON_FIELDS, personQuery,
        new TypeReference<GraphQlResponse<AnetBeanList<Person>>>() {});
    assertThat(searchResults.getTotalCount()).isGreaterThan(0);
    final Optional<Person> personResult =
        searchResults.getList().stream().filter(p -> p.getName().equals(name)).findFirst();
    assertThat(personResult).isNotEmpty();
    return personResult.get();
  }

  private static Task getTaskFromDb(String uuid) {
    final Task task = graphQLHelper.getObjectById(admin, "task", TASK_FIELDS, uuid,
        new TypeReference<GraphQlResponse<Task>>() {});
    assertThat(task).isNotNull();
    assertThat(task.getUuid()).isEqualTo(uuid);
    return task;
  }

  private static Task updateTask(Task task) {
    final Integer nrUpdated =
        graphQLHelper.updateObject(admin, "updateTask", "task", "TaskInput", task);
    assertThat(nrUpdated).isEqualTo(1);
    return getTaskFromDb(task.getUuid());
  }

}
