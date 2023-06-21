package mil.dds.anet.test.integration.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;
import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
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
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.test.integration.utils.TestApp;
import mil.dds.anet.test.integration.utils.TestBeans;
import mil.dds.anet.test.resources.AbstractResourceTest;
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
  private static String allowedEmail;

  @BeforeAll
  @SuppressWarnings("unchecked")
  public static void setUpClass() throws Exception {
    final DropwizardAppExtension<AnetConfiguration> app = TestApp.app;
    if (app.getConfiguration().getSmtp().isDisabled()) {
      fail("'ANET_SMTP_DISABLE' system environment variable must have value 'false' to run test.");
    }

    executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    allowedEmail =
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
  void testNoReports() {
    testFutureEngagementWorker(0);
  }

  @Test
  void reportsOK() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("reportsOK_1", true, true, true);
    engine.getReportDao().update(report);
    final Report report2 = createTestReport("reportsOK_2", true, true, true);
    engine.getReportDao().update(report2);
    final Report report3 = createTestReport("reportsOK_3", true, true, true);
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
  void testReportDueInFuture() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("testReportDueInFuture_1", true, true, true);
    report.setEngagementDate(Instant.now().plus(Duration.ofDays(2L)));
    engine.getReportDao().update(report);

    unexpectedIds.add("testReportDueInFuture_1");

    testFutureEngagementWorker(0);
  }

  @Test
  void testReportDueEndToday() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("testReportDueEndToday_1", true, true, true);
    report.setEngagementDate(Instant.now());
    engine.getReportDao().update(report);

    expectedIds.add("testReportDueEndToday_1");

    testFutureEngagementWorker(1);

    // Report should be draft now
    testReportDraft(report.getUuid());
  }

  @Test
  void testGH3304() throws GraphQLRequestExecutionException, GraphQLRequestPreparationException {
    // Create a draft report
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final ReportDao reportDao = engine.getReportDao();
    final Person author = getRegularUserBean();
    final MutationExecutor authorMutationExecutor = getMutationExecutor(author.getDomainUsername());
    final ReportPerson advisor = personToPrimaryReportAuthor(author);
    final ReportPerson interlocutor = personToPrimaryReportPerson(getSteveStevesonBean(), true);
    final Report draftReport = reportDao.insert(TestBeans.getTestReport("testGH3304",
        getFutureDate(), null, Lists.newArrayList(advisor, interlocutor)));

    // Submit the report
    authorMutationExecutor.submitReport("", draftReport.getUuid());
    // This planned report gets approved automatically
    final Report submittedReport = testReportState(draftReport.getUuid(), ReportState.APPROVED);

    // Nothing should happen
    testFutureEngagementWorker(0);

    // Move the engagementDate from future to past to simulate time passing
    submittedReport.setEngagementDate(getPastDate());
    reportDao.update(submittedReport);
    // State shouldn't have changed
    final Report updatedReport = testReportState(submittedReport.getUuid(), ReportState.APPROVED);

    // Report is no longer planned, so this should update it
    testFutureEngagementWorker(1);
    // This should send an email to the author
    expectedIds.add("hunter+erin");
    // State should be DRAFT now
    final Report redraftedReport = testReportDraft(updatedReport.getUuid());

    // Submit the report
    authorMutationExecutor.submitReport("", redraftedReport.getUuid());
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
  void testReportApprovalStates() {
    checkApprovalStepType(ApprovalStepType.PLANNING_APPROVAL, true, "1");
    checkApprovalStepType(ApprovalStepType.REPORT_APPROVAL, false, "2");
  }

  private void checkApprovalStepType(final ApprovalStepType type, final boolean isFuture,
      final String id) {
    final String fullId = "checkApprovalStepType_" + id;
    if (isFuture) {
      expectedIds.add(fullId);
    } else {
      unexpectedIds.add(fullId);
    }

    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport(fullId, false, false, isFuture);
    final ApprovalStep as = createApprovalStep(type);
    report.setApprovalStep(as);
    report.setAdvisorOrgUuid(as.getRelatedObjectUuid());
    engine.getReportDao().update(report);

    testFutureEngagementWorker(isFuture ? 1 : 0);

    if (isFuture) {
      // Report should be draft now
      testReportDraft(report.getUuid());
    }
  }

  @Test
  void testReportStates() {
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
    final Report report = createTestReport(fullId, true, true, true);
    report.setState(state);
    engine.getReportDao().update(report);

    testFutureEngagementWorker(isExpected ? 1 : 0);

    if (isExpected) {
      // Report should be draft now
      testReportDraft(report.getUuid());
    }
  }

  @Test
  void testApprovalStepReport() {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report report = createTestReport("testApprovalStepReport_1", true, true, true);

    expectedIds.add("testApprovalStepReport_1");

    testFutureEngagementWorker(1);

    // Report should be draft now
    testReportDraft(report.getUuid());
    // Edit it & submit
    final ApprovalStep step = createApprovalStep(ApprovalStepType.REPORT_APPROVAL);
    report.setApprovalStep(step);
    report.setAdvisorOrgUuid(step.getRelatedObjectUuid());
    engine.getReportDao().update(report);
    engine.getReportDao().submit(report, report.loadAuthors(engine.getContext()).join().get(0));
    testReportState(report.getUuid(), ReportState.PENDING_APPROVAL);

    testFutureEngagementWorker(0);
    testReportState(report.getUuid(), ReportState.PENDING_APPROVAL);
  }

  @Test
  void testPlanningApprovalStepReport() {
    final Report report = createTestReport("testPlanningApprovalStepReport_1", true, false, true);

    expectedIds.add("testPlanningApprovalStepReport_1");

    testFutureEngagementWorker(1);

    // Report should be draft now
    testReportDraft(report.getUuid());
  }

  @Test
  void testAutomaticallyApprovedReport() {
    // Report in automatic approve step (no planning workflow)
    final Report report = createTestReport("testAutomaticallyApprovedReport_1", false, true, true);

    expectedIds.add("testAutomaticallyApprovedReport_1");

    testFutureEngagementWorker(1);

    // Report should be draft now
    testReportDraft(report.getUuid());
  }

  @Test
  void testPublishedReport() {
    final Report report = createPublishedTestReport("testPublishedReport_1");
    expectedIds.add("testPublishedReport_1");
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
    assertThat(engine.getEmailDao().getAll()).hasSize(emailSize + expectedCount);
  }

  // Email integration
  private static void testFutureEngagementWorkerEmail() throws IOException, InterruptedException {
    assumeTrue(executeEmailServerTests, "Email server tests configured to be skipped.");

    // Make sure all messages have been (asynchronously) sent
    emailWorker.run();

    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();
    assertThat(emails).hasSameSizeAs(expectedIds);
    emails.forEach(e -> assertThat(expectedIds).contains(e.to.text.split("@")[0]));
    emails.forEach(e -> assertThat(unexpectedIds).doesNotContain(e.to.text.split("@")[0]));
  }

  private void setPastDate(final Report report) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final ReportDao reportDao = engine.getReportDao();
    report.setEngagementDate(getPastDate());
    reportDao.update(report);
  }

  private Report createTestReport(final String toAddressId, final boolean addApprovalStep,
      final boolean approve, final boolean setPastDate) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final ReportDao reportDao = engine.getReportDao();

    final ReportPerson author = personToReportAuthor(TestBeans.getTestPerson());
    author.setEmailAddress(toAddressId + allowedEmail);
    engine.getPersonDao().insert(author);

    ApprovalStep approvalStep = null;
    if (addApprovalStep) {
      approvalStep = createApprovalStep(ApprovalStepType.PLANNING_APPROVAL);
    }

    final Report report = reportDao.insert(TestBeans.getTestReport(toAddressId, getFutureDate(),
        approvalStep, ImmutableList.of(author)));
    // Submit this report
    reportDao.submit(report, author);

    if (approvalStep != null && approve) {
      // Approve this report
      reportDao.approve(report, null, approvalStep);
    }

    if (setPastDate) {
      setPastDate(report);
    }
    return report;
  }

  private ApprovalStep createApprovalStep(final ApprovalStepType type) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Organization organization = TestBeans.getTestOrganization();
    engine.getOrganizationDao().insert(organization);
    final ApprovalStep approvalStep = TestBeans.getTestApprovalStep(organization);
    approvalStep.setType(type);
    engine.getApprovalStepDao().insertAtEnd(approvalStep);
    return approvalStep;
  }

  private Report createPublishedTestReport(final String toAddressId) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final ReportDao reportDao = engine.getReportDao();
    final EmailDao emailDao = engine.getEmailDao();

    final Report report = createTestReport(toAddressId, true, true, false);

    // Publish this report
    final int emailSize = emailDao.getAll().size();
    reportDao.publish(report, null);
    // Should have sent email for publication
    assertThat(emailDao.getAll()).hasSize(emailSize + 1);
    expectedIds.add(toAddressId);

    setPastDate(report);
    return report;
  }

  private Instant getFutureDate() {
    return Instant.now().plus(1, ChronoUnit.HOURS);
  }

  private Instant getPastDate() {
    return Instant.now().minus(1, ChronoUnit.HOURS);
  }

}
