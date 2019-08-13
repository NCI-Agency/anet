package mil.dds.anet.integrationtest.db;

import static org.junit.Assert.assertEquals;
import com.google.common.collect.ImmutableList;
import io.dropwizard.testing.junit.DropwizardAppRule;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import mil.dds.anet.AnetApplication;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.integrationtest.config.AnetITConfiguration;
import mil.dds.anet.integrationtest.utils.EmailResponse;
import mil.dds.anet.integrationtest.utils.FakeSmtpServer;
import mil.dds.anet.integrationtest.utils.TestBeans;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.FutureEngagementWorker;
import mil.dds.anet.utils.Utils;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;

public class FutureEngagementWorkerIT {
  @ClassRule
  public static final DropwizardAppRule<AnetConfiguration> app =
      new DropwizardAppRule<AnetConfiguration>(AnetApplication.class, "anet.yml");

  private static AnetObjectEngine engine;
  private static FutureEngagementWorker futureEngagementWorker;
  private static FakeSmtpServer emailServer;
  private static AnetEmailWorker emailWorker;

  private static boolean executeEmailServerTests;

  @BeforeClass
  public static void setUpClass() throws Exception {
    executeEmailServerTests = Boolean.parseBoolean(
        AnetITConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    engine = new AnetObjectEngine(app.getConfiguration().getDataSourceFactory().getUrl(),
        app.getApplication());
    futureEngagementWorker = new FutureEngagementWorker(engine.getReportDao());
    emailServer = new FakeSmtpServer(app.getConfiguration().getSmtp());
    emailWorker = new AnetEmailWorker(engine.getEmailDao(), app.getConfiguration(),
        Executors.newScheduledThreadPool(1));
  }

  @Test
  public void testNoReports() throws Exception {
    testFututeEngagementWorker(0);
  }

  @Test
  public void reportsOK() throws Exception {
    Report report = createTestReport();
    engine.getReportDao().update(report);
    Report report2 = createTestReport();
    engine.getReportDao().update(report2);
    Report report3 = createTestReport();
    engine.getReportDao().update(report3);

    testFututeEngagementWorker(3);
  }

  @Test
  public void testReportDueInFuture() throws Exception {
    Report report = createTestReport();
    report.setEngagementDate(Instant.now().plus(Duration.ofDays(2L)));
    engine.getReportDao().update(report);

    testFututeEngagementWorker(0);
  }

  @Test
  public void testReportDueEndToday() throws Exception {
    Report report = createTestReport();
    report.setEngagementDate(Utils.endOfToday());
    engine.getReportDao().update(report);

    testFututeEngagementWorker(1);
  }

  @Test
  public void testReportApprovalStates() throws Exception {
    checkApprovalStepType(ApprovalStepType.PLANNING_APPROVAL, 1);
    checkApprovalStepType(ApprovalStepType.REPORT_APPROVAL, 0);
  }

  private void checkApprovalStepType(ApprovalStepType type, int expectedCount) throws Exception {
    Report report = createTestReport();
    ApprovalStep as = report.getApprovalStep();
    as.setType(type);
    engine.getApprovalStepDao().insert(as);
    report.setApprovalStep(as);
    engine.getReportDao().update(report);

    testFututeEngagementWorker(expectedCount);
  }

  @Test
  public void testReportStates() throws Exception {
    checkReportState(ReportState.APPROVED, 1);
    checkReportState(ReportState.CANCELLED, 0);
    checkReportState(ReportState.DRAFT, 0);
    checkReportState(ReportState.PENDING_APPROVAL, 1);
    checkReportState(ReportState.PUBLISHED, 1);
    checkReportState(ReportState.REJECTED, 1);
  }

  private void checkReportState(ReportState state, int expectedCount) throws Exception {
    Report report = createTestReport();
    report.setState(state);
    engine.getReportDao().update(report);

    testFututeEngagementWorker(expectedCount);
  }

  @Test
  public void testApprovalStepReport() throws Exception {
    Report report = createTestReport();
    ApprovalStep step = report.getApprovalStep();
    step.setType(ApprovalStepType.REPORT_APPROVAL);
    engine.getApprovalStepDao().insert(step);
    report.setApprovalStep(step);
    engine.getReportDao().update(report);

    ReportAction ra = new ReportAction();
    ra.setReport(report);
    ra.setReportUuid(report.getUuid());
    ra.setStep(step);
    ra.setStepUuid(step.getUuid());
    engine.getReportActionDao().insert(ra);

    testFututeEngagementWorker(1);
  }

  private void testFututeEngagementWorker(int expectedCount) throws Exception {
    // DB integration
    engine.getEmailDao().deletePendingEmails(
        engine.getEmailDao().getAll().stream().map(e -> e.getId()).collect(Collectors.toList()));
    assertEquals(0, engine.getEmailDao().getAll().size());

    futureEngagementWorker.run();
    assertEquals(expectedCount, engine.getEmailDao().getAll().size());

    // Email integration
    if (executeEmailServerTests) {
      emailServer.clearEmailServer();
      emailWorker.run();

      final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();
      assertEquals(expectedCount, emails.size());
    }
  }

  private static Report createTestReport() throws IOException {
    Person author = TestBeans.getTestPerson();
    author.setEmailAddress("test@cmil.mil"); // Domain whitelisted
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
