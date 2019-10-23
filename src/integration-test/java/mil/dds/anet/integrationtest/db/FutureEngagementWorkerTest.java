package mil.dds.anet.integrationtest.db;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import com.google.common.collect.ImmutableList;
import io.dropwizard.testing.junit.DropwizardAppRule;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import mil.dds.anet.AnetApplication;
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
import mil.dds.anet.integrationtest.config.AnetTestConfiguration;
import mil.dds.anet.integrationtest.utils.EmailResponse;
import mil.dds.anet.integrationtest.utils.FakeSmtpServer;
import mil.dds.anet.integrationtest.utils.TestBeans;
import mil.dds.anet.threads.FutureEngagementWorker;
import mil.dds.anet.utils.Utils;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;

public class FutureEngagementWorkerTest {
  @ClassRule
  public static final DropwizardAppRule<AnetConfiguration> app =
      new DropwizardAppRule<AnetConfiguration>(AnetApplication.class, "anet.yml");
  private final static List<String> expectedIds = new ArrayList<>();
  private final static List<String> unexpectedIds = new ArrayList<>();

  private static AnetObjectEngine engine;
  private static FutureEngagementWorker futureEngagementWorker;
  private static FakeSmtpServer emailServer;

  private static boolean executeEmailServerTests;
  private static String whitelistedEmail;



  @BeforeClass
  @SuppressWarnings("unchecked")
  public static void setUpClass() throws Exception {
    executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());
    whitelistedEmail =
        "@" + ((List<String>) app.getConfiguration().getDictionaryEntry("domainNames")).get(0);

    engine = new AnetObjectEngine(app.getConfiguration().getDataSourceFactory().getUrl(),
        app.getApplication());
    futureEngagementWorker = new FutureEngagementWorker(engine.getReportDao());
    emailServer = new FakeSmtpServer(app.getConfiguration().getSmtp());
    emailServer.clearEmailServer();
  }

  @AfterClass
  public static void finalCheckAndCleanup() throws IOException, InterruptedException {
    // Test that all emails have been correctly sent
    testFututeEngagementWorkerEmail();
  }

  @Test
  public void testNoReports() {
    testFututeEngagementWorker(0);
  }

  @Test
  public void reportsOK() {
    Report report = createTestReport("reportsOK_1");
    engine.getReportDao().update(report);
    Report report2 = createTestReport("reportsOK_2");
    engine.getReportDao().update(report2);
    Report report3 = createTestReport("reportsOK_3");
    engine.getReportDao().update(report3);

    expectedIds.add("reportsOK_1");
    expectedIds.add("reportsOK_2");
    expectedIds.add("reportsOK_3");

    testFututeEngagementWorker(3);
  }

  @Test
  public void testReportDueInFuture() {
    Report report = createTestReport("testReportDueInFuture_1");
    report.setEngagementDate(Instant.now().plus(Duration.ofDays(2L)));
    engine.getReportDao().update(report);

    unexpectedIds.add("testReportDueInFuture_1");

    testFututeEngagementWorker(0);
  }

  @Test
  public void testReportDueEndToday() {
    Report report = createTestReport("testReportDueEndToday_1");
    report.setEngagementDate(Utils.endOfToday());
    engine.getReportDao().update(report);

    expectedIds.add("testReportDueEndToday_1");

    testFututeEngagementWorker(1);
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

    Report report = createTestReport(fullId);
    ApprovalStep as = report.getApprovalStep();
    as.setType(type);
    engine.getApprovalStepDao().insert(as);
    report.setApprovalStep(as);
    engine.getReportDao().update(report);

    testFututeEngagementWorker(isExpected ? 1 : 0);
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

  private void checkReportState(ReportState state, boolean isExpected, final String id) {
    final String fullId = "checkApprovalStepType_" + id;
    if (isExpected) {
      expectedIds.add(fullId);
    } else {
      unexpectedIds.add(fullId);
    }

    Report report = createTestReport(fullId);
    report.setState(state);
    engine.getReportDao().update(report);

    testFututeEngagementWorker(isExpected ? 1 : 0);
  }

  @Test
  public void testApprovalStepReport() {
    Report report = createTestReport("testApprovalStepReport_1");
    ApprovalStep step = report.getApprovalStep();
    step.setType(ApprovalStepType.REPORT_APPROVAL);
    engine.getApprovalStepDao().insert(step);
    report.setApprovalStep(step);
    engine.getReportDao().update(report);

    // Report in approve step
    ReportAction ra = new ReportAction();
    ra.setReport(report);
    ra.setReportUuid(report.getUuid());
    ra.setStep(step);
    ra.setStepUuid(step.getUuid());
    ra.setType(ActionType.APPROVE);
    ra.setCreatedAt(Utils.endOfToday());
    engine.getReportActionDao().insert(ra);

    unexpectedIds.add("testApprovalStepReport_1");

    testFututeEngagementWorker(0);
  }

  private void testFututeEngagementWorker(final int expectedCount) {
    // DB integration
    int emailSize = engine.getEmailDao().getAll().size();
    futureEngagementWorker.run();
    assertEquals(emailSize + expectedCount, engine.getEmailDao().getAll().size());
  }

  private static void testFututeEngagementWorkerEmail() throws IOException, InterruptedException {
    // Email integration
    if (executeEmailServerTests) {
      // We wait until all messages have been (asynchronously) sent
      Thread.sleep(5000);

      final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();
      assertEquals(expectedIds.size(), emails.size());
      emails.forEach(e -> assertTrue(expectedIds.contains(e.to.text.split("@")[0])));
      emails.forEach(e -> assertFalse(unexpectedIds.contains(e.to.text.split("@")[0])));
    }
  }

  private static Report createTestReport(final String toAdressId) {
    Person author = TestBeans.getTestPerson();
    author.setEmailAddress(toAdressId + whitelistedEmail);
    engine.getPersonDao().insert(author);

    Organization organization = TestBeans.getTestOrganization();
    engine.getOrganizationDao().insert(organization);

    ApprovalStep approvalStep = TestBeans.getTestApprovalStep(organization);
    approvalStep.setType(ApprovalStepType.PLANNING_APPROVAL);
    engine.getApprovalStepDao().insertAtEnd(approvalStep);

    Report report = TestBeans.getTestReport(author, approvalStep, ImmutableList.of());
    engine.getReportDao().insert(report);
    return report;
  }
}
