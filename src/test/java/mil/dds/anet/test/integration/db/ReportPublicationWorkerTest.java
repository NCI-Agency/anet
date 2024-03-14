package mil.dds.anet.test.integration.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.google.common.collect.ImmutableList;
import io.dropwizard.testing.junit5.DropwizardAppExtension;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportAction.ActionType;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.test.integration.utils.TestBeans;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.ReportPublicationWorker;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ReportPublicationWorkerTest {

  @Autowired
  protected DropwizardAppExtension<AnetConfiguration> dropwizardApp;

  private final List<String> expectedIds = new ArrayList<>();
  private final List<String> unexpectedIds = new ArrayList<>();

  private ReportPublicationWorker reportPublicationWorker;
  private FakeSmtpServer emailServer;
  private AnetEmailWorker emailWorker;

  private boolean executeEmailServerTests;
  private String allowedEmail;

  @BeforeAll
  @SuppressWarnings("unchecked")
  void setUpClass() throws Exception {
    final AnetConfiguration configuration = dropwizardApp.getConfiguration();
    final Map<String, Object> dictionary = new HashMap<>(configuration.getDictionary());
    final Map<String, Object> reportWorkflowSettings =
        (Map<String, Object>) dictionary.get("reportWorkflow");
    // Make sure publication is immediate
    reportWorkflowSettings.put("nbOfHoursQuarantineApproved", 0);
    configuration.setDictionary(dictionary);

    if (configuration.getSmtp().isDisabled()) {
      fail("'ANET_SMTP_DISABLE' system environment variable must have value 'false' to run test.");
    }

    executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    allowedEmail = "@" + ((List<String>) configuration.getDictionaryEntry("domainNames")).get(0);

    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    emailWorker = new AnetEmailWorker(configuration, engine.getEmailDao());
    reportPublicationWorker = new ReportPublicationWorker(configuration, engine.getReportDao());
    emailServer = new FakeSmtpServer(configuration.getSmtp());

    // Flush all reports from previous tests
    reportPublicationWorker.run();
    // Flush all emails from previous tests
    emailWorker.run();
    // Clear the email server before starting testing
    emailServer.clearEmailServer();
  }

  @AfterAll
  void tearDownClass() throws Exception {
    // Test that all emails have been correctly sent
    testReportPublicationWorkerEmail();

    // Clear the email server after testing
    emailServer.clearEmailServer();

    emailWorker = null;
    AnetEmailWorker.setInstance(null);
  }

  @Test
  void testNoReports() {
    testReportPublicationWorker(0);
  }

  @Test
  void testApprovalStepReport() {
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

    expectedIds.add("testApprovalStepReport_1");

    testReportPublicationWorker(1);

    // Report should be published now
    testReportPublished(report.getUuid(), false);
  }

  @Test
  void testPlanningApprovalStepReport() {
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

    testReportPublicationWorker(1);

    // Report should be published now
    testReportPublished(report.getUuid(), false);
  }

  @Test
  void testAutomaticallyApprovedReport() {
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

    testReportPublicationWorker(1);

    // Report should be published now
    testReportPublished(report.getUuid(), true);
  }

  private void testReportPublished(final String uuid, final boolean expectedPlanned) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final Report updatedReport = engine.getReportDao().getByUuid(uuid);
    assertThat(updatedReport.getState()).isEqualTo(ReportState.PUBLISHED);
    final List<ReportAction> workflow = updatedReport.loadWorkflow(engine.getContext()).join();
    assertThat(workflow).isNotEmpty();
    final ReportAction lastAction = workflow.get(workflow.size() - 1);
    assertThat(lastAction.getType()).isEqualTo(ActionType.PUBLISH);
    assertThat(lastAction.isPlanned()).isEqualTo(expectedPlanned);
  }

  // DB integration
  private void testReportPublicationWorker(final int expectedCount) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final int emailSize = engine.getEmailDao().getAll().size();
    reportPublicationWorker.run();
    assertThat(engine.getEmailDao().getAll()).hasSize(emailSize + expectedCount);
  }

  // Email integration
  private void testReportPublicationWorkerEmail() throws IOException, InterruptedException {
    assumeTrue(executeEmailServerTests, "Email server tests configured to be skipped.");

    // Make sure all messages have been (asynchronously) sent
    emailWorker.run();

    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();
    assertThat(emails).hasSameSizeAs(expectedIds);
    emails.forEach(e -> assertThat(expectedIds).contains(e.to.text.split("@")[0]));
    emails.forEach(e -> assertThat(unexpectedIds).doesNotContain(e.to.text.split("@")[0]));
  }

  private Report createTestReport(final String toAddressId) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final ReportPerson author =
        AbstractResourceTest.personToReportAuthor(TestBeans.getTestPerson());
    author.setEmailAddress(toAddressId + allowedEmail);
    engine.getPersonDao().insert(author);

    final Organization organization = TestBeans.getTestOrganization();
    engine.getOrganizationDao().insert(organization);

    final ApprovalStep approvalStep = TestBeans.getTestApprovalStep(organization);
    approvalStep.setType(ApprovalStepType.PLANNING_APPROVAL);
    engine.getApprovalStepDao().insertAtEnd(approvalStep);

    final Report report =
        TestBeans.getTestReport(toAddressId, null, approvalStep, ImmutableList.of(author));
    report.setState(ReportState.APPROVED);
    engine.getReportDao().insert(report);
    return report;
  }
}
