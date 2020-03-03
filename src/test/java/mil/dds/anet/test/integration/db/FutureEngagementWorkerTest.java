package mil.dds.anet.test.integration.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.google.common.collect.ImmutableList;
import io.dropwizard.testing.junit5.DropwizardAppExtension;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
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
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.test.integration.utils.TestApp;
import mil.dds.anet.test.integration.utils.TestBeans;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.FutureEngagementWorker;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(TestApp.class)
public class FutureEngagementWorkerTest {
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
      fail("'ANET_SMTP_DISABLE' system environment variable must have value 'true' to run test.");
    }

    executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    whitelistedEmail =
        "@" + ((List<String>) app.getConfiguration().getDictionaryEntry("domainNames")).get(0);

    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    emailWorker = new AnetEmailWorker(engine.getEmailDao(), app.getConfiguration());
    futureEngagementWorker = new FutureEngagementWorker(engine.getReportDao());
    emailServer = new FakeSmtpServer(app.getConfiguration().getSmtp());

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
    report.setEngagementDate(Utils.endOfToday());
    engine.getReportDao().update(report);

    expectedIds.add("testReportDueEndToday_1");

    testFutureEngagementWorker(1);
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
    ra.setReportUuid(report.getUuid());
    ra.setStep(step);
    ra.setStepUuid(step.getUuid());
    ra.setType(ActionType.APPROVE);
    ra.setCreatedAt(Utils.endOfToday());
    engine.getReportActionDao().insert(ra);

    unexpectedIds.add("testApprovalStepReport_1");

    testFutureEngagementWorker(0);
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

  private static Report createTestReport(final String toAdressId) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Person author = TestBeans.getTestPerson();
    author.setEmailAddress(toAdressId + whitelistedEmail);
    engine.getPersonDao().insert(author);

    final Organization organization = TestBeans.getTestOrganization();
    engine.getOrganizationDao().insert(organization);

    final ApprovalStep approvalStep = TestBeans.getTestApprovalStep(organization);
    approvalStep.setType(ApprovalStepType.PLANNING_APPROVAL);
    engine.getApprovalStepDao().insertAtEnd(approvalStep);

    final Report report = TestBeans.getTestReport(author, approvalStep, ImmutableList.of());
    engine.getReportDao().insert(report);
    return report;
  }
}
