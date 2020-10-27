package mil.dds.anet.test.integration.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;
import io.dropwizard.testing.junit5.DropwizardAppExtension;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportAction.ActionType;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.test.beans.PersonTest;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.test.integration.utils.TestApp;
import mil.dds.anet.test.integration.utils.TestBeans;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.FutureEngagementWorker;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(TestApp.class)
public class FutureEngagementWorkerTest extends AbstractResourceTest {
  private final static List<String> expectedIds = new ArrayList<>();
  private final static List<String> unexpectedIds = new ArrayList<>();

  private static FutureEngagementWorker futureEngagementWorker;
  private static FakeSmtpServer emailServer;
  private static AnetEmailWorker emailWorker;

  private static boolean executeEmailServerTests;
  private static String whitelistedEmail;

  @BeforeAll
  @SuppressWarnings("unchecked")
  public static void setUpClass() throws Exception {
    final DropwizardAppExtension<AnetConfiguration> app = TestApp.app;
    if (app.getConfiguration().getSmtp().isDisabled()) {
      fail("'ANET_SMTP_DISABLE' system environment variable must have value 'false' to run test.");
    }

    executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    whitelistedEmail =
        "@" + ((List<String>) app.getConfiguration().getDictionaryEntry("domainNames")).get(0);

    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    emailWorker = new AnetEmailWorker(app.getConfiguration(), engine.getEmailDao());
    futureEngagementWorker =
        new FutureEngagementWorker(app.getConfiguration(), engine.getReportDao());
    emailServer = new FakeSmtpServer(app.getConfiguration().getSmtp());

    // Flush all reports from previous tests
    futureEngagementWorker.run();
    // Flush all emails from previous tests
    emailWorker.run();
    // Clear the email server before starting testing
    emailServer.clearEmailServer();
  }

  @AfterAll
  public static void tearDownClass() throws Exception {
    // Test that all emails have been correctly sent
    testFutureEngagementWorkerEmail();

    // Clear the email server after testing
    emailServer.clearEmailServer();

    emailWorker = null;
    AnetEmailWorker.setInstance(null);
  }

  @Test
  public void testNoReports() {
    testFutureEngagementWorker(0);
  }

  @Test
  public void reportsOK() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("reportsOK_1");
    engine.getReportDao().update(report);
    final Report report2 = createTestReport("reportsOK_2");
    engine.getReportDao().update(report2);
    final Report report3 = createTestReport("reportsOK_3");
    engine.getReportDao().update(report3);

    expectedIds.add("reportsOK_1");
    expectedIds.add("reportsOK_2");
    expectedIds.add("reportsOK_3");

    testFutureEngagementWorker(3);

    // Reports should be draft now
    testReportDraft(report.getUuid());
    testReportDraft(report2.getUuid());
    testReportDraft(report3.getUuid());
  }

  @Test
  public void testReportDueInFuture() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("testReportDueInFuture_1");
    report.setEngagementDate(Instant.now().plus(Duration.ofDays(2L)));
    engine.getReportDao().update(report);

    unexpectedIds.add("testReportDueInFuture_1");

    testFutureEngagementWorker(0);
  }

  @Test
  public void testReportDueEndToday() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("testReportDueEndToday_1");
    report.setEngagementDate(Instant.now());
    engine.getReportDao().update(report);

    expectedIds.add("testReportDueEndToday_1");

    testFutureEngagementWorker(1);

    // Report should be draft now
    testReportDraft(report.getUuid());
  }

  @Test
  public void testGH3304() {
    // Create a draft report
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Person author = getRegularUser();
    final ReportPerson advisor = PersonTest.personToPrimaryReportAuthor(author);
    final ReportPerson principal = PersonTest.personToPrimaryReportPerson(getSteveSteveson());
    final Report report = TestBeans.getTestReport(null, Lists.newArrayList(advisor, principal));
    report.setState(ReportState.DRAFT);
    report.setEngagementDate(Instant.now().plus(1, ChronoUnit.HOURS));
    final Report draftReport = engine.getReportDao().insert(report);

    // Submit the report
    graphQLHelper.updateObject(author, "submitReport", "uuid", "uuid", "String",
        draftReport.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    // This planned report gets approved automatically
    final Report submittedReport = testReportState(draftReport.getUuid(), ReportState.APPROVED);

    // Nothing should happen
    testFutureEngagementWorker(0);

    // Move the engagementDate from future to past to simulate time passing
    submittedReport.setEngagementDate(Instant.now().minus(1, ChronoUnit.HOURS));
    engine.getReportDao().update(submittedReport);
    // State shouldn't have changed
    final Report updatedReport = testReportState(submittedReport.getUuid(), ReportState.APPROVED);

    // Report is no longer planned, so this should update it
    testFutureEngagementWorker(1);
    // This should send an email to the author
    expectedIds.add("hunter+erin");
    // State should be DRAFT now
    final Report redraftedReport = testReportDraft(updatedReport.getUuid());

    // Submit the report
    graphQLHelper.updateObject(author, "submitReport", "uuid", "uuid", "String",
        redraftedReport.getUuid(), new TypeReference<GraphQlResponse<Report>>() {});
    // This should send an email to the approver
    expectedIds.add("hunter+jacob");
    // State should be PENDING_APPROVAL
    final Report resubmittedReport =
        testReportState(redraftedReport.getUuid(), ReportState.PENDING_APPROVAL);

    // Prior to the fix for GH-3304, it changed the report back to DRAFT and sent an email
    testFutureEngagementWorker(0);
    // State shouldn't have changed
    testReportState(resubmittedReport.getUuid(), ReportState.PENDING_APPROVAL);
  }

  @Test
  public void testReportApprovalStates() {
    checkApprovalStepType(ApprovalStepType.PLANNING_APPROVAL, true, "1");
    checkApprovalStepType(ApprovalStepType.REPORT_APPROVAL, false, "2");
  }

  private void checkApprovalStepType(final ApprovalStepType type, final boolean isExpected,
      final String id) {
    final String fullId = "checkApprovalStepType_" + id;
    if (isExpected) {
      expectedIds.add(fullId);
    } else {
      unexpectedIds.add(fullId);
    }

    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport(fullId);
    final ApprovalStep as = report.getApprovalStep();
    as.setType(type);
    engine.getApprovalStepDao().insert(as);
    report.setApprovalStep(as);
    engine.getReportDao().update(report);

    testFutureEngagementWorker(isExpected ? 1 : 0);

    if (isExpected) {
      // Report should be draft now
      testReportDraft(report.getUuid());
    }
  }

  @Test
  public void testReportStates() {
    checkReportState(ReportState.APPROVED, true, "APPROVED");
    checkReportState(ReportState.CANCELLED, false, "CANCELLED");
    checkReportState(ReportState.DRAFT, false, "DRAFT");
    checkReportState(ReportState.PENDING_APPROVAL, true, "PENDING_APPROVAL");
    checkReportState(ReportState.PUBLISHED, true, "PUBLISHED");
    checkReportState(ReportState.REJECTED, true, "REJECTED");
  }

  private void checkReportState(final ReportState state, final boolean isExpected,
      final String id) {
    final String fullId = "checkApprovalStepType_" + id;
    if (isExpected) {
      expectedIds.add(fullId);
    } else {
      unexpectedIds.add(fullId);
    }

    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport(fullId);
    report.setState(state);
    engine.getReportDao().update(report);

    testFutureEngagementWorker(isExpected ? 1 : 0);

    if (isExpected) {
      // Report should be draft now
      testReportDraft(report.getUuid());
    }
  }

  @Test
  public void testApprovalStepReport() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("testApprovalStepReport_1");
    final ApprovalStep step = report.getApprovalStep();
    step.setType(ApprovalStepType.REPORT_APPROVAL);
    engine.getApprovalStepDao().insert(step);
    report.setApprovalStep(step);
    engine.getReportDao().update(report);

    // Report in approve step
    final ReportAction ra = new ReportAction();
    ra.setReport(report);
    ra.setStep(step);
    ra.setType(ActionType.APPROVE);
    ra.setCreatedAt(Instant.now());
    engine.getReportActionDao().insert(ra);

    unexpectedIds.add("testApprovalStepReport_1");

    testFutureEngagementWorker(0);
  }

  @Test
  public void testPlanningApprovalStepReport() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("testPlanningApprovalStepReport_1");
    final ApprovalStep step = report.getApprovalStep();
    step.setType(ApprovalStepType.PLANNING_APPROVAL);
    engine.getApprovalStepDao().insert(step);
    report.setApprovalStep(step);
    engine.getReportDao().update(report);

    // Report in planning approve step
    final ReportAction ra = new ReportAction();
    ra.setReport(report);
    ra.setStep(step);
    ra.setType(ActionType.APPROVE);
    ra.setCreatedAt(Instant.now());
    engine.getReportActionDao().insert(ra);

    expectedIds.add("testPlanningApprovalStepReport_1");

    testFutureEngagementWorker(1);

    // Report should be draft now
    testReportDraft(report.getUuid());
  }

  @Test
  public void testAutomaticallyApprovedReport() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("testAutomaticallyApprovedReport_1");
    report.setApprovalStep(null);
    engine.getReportDao().update(report);

    // Report in automatic approve step (no planning workflow)
    final ReportAction ra = new ReportAction();
    ra.setReport(report);
    ra.setType(ActionType.APPROVE);
    ra.setPlanned(true);
    ra.setCreatedAt(Instant.now());
    engine.getReportActionDao().insert(ra);

    expectedIds.add("testAutomaticallyApprovedReport_1");

    testFutureEngagementWorker(1);

    // Report should be draft now
    testReportDraft(report.getUuid());
  }

  private Report testReportDraft(final String uuid) {
    return testReportState(uuid, ReportState.DRAFT);
  }

  private Report testReportState(final String uuid, final ReportState state) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report updatedReport = engine.getReportDao().getByUuid(uuid);
    assertThat(updatedReport.getState()).isEqualTo(state);
    return updatedReport;
  }

  // DB integration
  private void testFutureEngagementWorker(final int expectedCount) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final int emailSize = engine.getEmailDao().getAll().size();
    futureEngagementWorker.run();
    assertThat(engine.getEmailDao().getAll().size()).isEqualTo(emailSize + expectedCount);
  }

  // Email integration
  private static void testFutureEngagementWorkerEmail() throws IOException, InterruptedException {
    assumeTrue(executeEmailServerTests, "Email server tests configured to be skipped.");

    // Make sure all messages have been (asynchronously) sent
    emailWorker.run();

    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();
    assertThat(emails.size()).isEqualTo(expectedIds.size());
    emails.forEach(e -> assertThat(expectedIds).contains(e.to.text.split("@")[0]));
    emails.forEach(e -> assertThat(unexpectedIds).doesNotContain(e.to.text.split("@")[0]));
  }

  private Report createTestReport(final String toAdressId) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final ReportPerson author = PersonTest.personToReportAuthor(TestBeans.getTestPerson());
    author.setEmailAddress(toAdressId + whitelistedEmail);
    engine.getPersonDao().insert(author);

    final Organization organization = TestBeans.getTestOrganization();
    engine.getOrganizationDao().insert(organization);

    final ApprovalStep approvalStep = TestBeans.getTestApprovalStep(organization);
    approvalStep.setType(ApprovalStepType.PLANNING_APPROVAL);
    engine.getApprovalStepDao().insertAtEnd(approvalStep);

    final Report report = TestBeans.getTestReport(approvalStep, ImmutableList.of(author));
    return engine.getReportDao().insert(report);
  }

}
