package mil.dds.anet.test.integration.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportAction.ActionType;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.ReportActionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.test.SpringTestConfig;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.test.integration.utils.TestBeans;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.ReportPublicationWorker;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = SpringTestConfig.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ReportPublicationWorkerTest {

  @Autowired
  protected AnetConfig config;

  @Autowired
  protected AnetDictionary dict;

  @Autowired
  private JobHistoryDao jobHistoryDao;

  @Autowired
  private AdminDao adminDao;

  @Autowired
  private ApprovalStepDao approvalStepDao;

  @Autowired
  private EmailDao emailDao;

  @Autowired
  private EmailAddressDao emailAddressDao;

  @Autowired
  private OrganizationDao organizationDao;

  @Autowired
  private PersonDao personDao;

  @Autowired
  private ReportDao reportDao;

  @Autowired
  private ReportActionDao reportActionDao;

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
    final Map<String, Object> newDict = new HashMap<>(dict.getDictionary());
    final Map<String, Object> reportWorkflowSettings =
        (Map<String, Object>) newDict.get("reportWorkflow");
    // Make sure publication is immediate
    reportWorkflowSettings.put("nbOfHoursQuarantineApproved", 0);
    dict.setDictionary(newDict);

    if (config.getSmtp().isDisabled()) {
      fail("'ANET_SMTP_DISABLE' system environment variable must have value 'false' to run test.");
    }

    executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    allowedEmail = "@" + ((List<String>) dict.getDictionaryEntry("domainNames")).get(0);

    emailWorker = new AnetEmailWorker(config, dict, jobHistoryDao, emailDao, adminDao);
    reportPublicationWorker = new ReportPublicationWorker(dict, jobHistoryDao, reportDao);
    emailServer = new FakeSmtpServer(config.getSmtp());

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
  }

  @Test
  void testNoReports() {
    testReportPublicationWorker(0);
  }

  @Test
  void testApprovalStepReport() {
    final Report report = createTestReport("testApprovalStepReport_1");
    final ApprovalStep step = report.getApprovalStep();
    step.setType(ApprovalStepType.REPORT_APPROVAL);
    approvalStepDao.insert(step);
    report.setApprovalStep(step);
    reportDao.update(report);

    // Report in approve step
    final ReportAction ra = new ReportAction();
    ra.setReport(report);
    ra.setStep(step);
    ra.setType(ActionType.APPROVE);
    ra.setCreatedAt(Instant.now());
    reportActionDao.insert(ra);

    expectedIds.add("testApprovalStepReport_1");

    testReportPublicationWorker(1);

    // Report should be published now
    testReportPublished(report.getUuid(), false);
  }

  @Test
  void testPlanningApprovalStepReport() {
    final Report report = createTestReport("testPlanningApprovalStepReport_1");
    final ApprovalStep step = report.getApprovalStep();
    step.setType(ApprovalStepType.PLANNING_APPROVAL);
    approvalStepDao.insert(step);
    report.setApprovalStep(step);
    reportDao.update(report);

    // Report in planning approve step
    final ReportAction ra = new ReportAction();
    ra.setReport(report);
    ra.setStep(step);
    ra.setType(ActionType.APPROVE);
    ra.setCreatedAt(Instant.now());
    reportActionDao.insert(ra);

    expectedIds.add("testPlanningApprovalStepReport_1");

    testReportPublicationWorker(1);

    // Report should be published now
    testReportPublished(report.getUuid(), false);
  }

  @Test
  void testAutomaticallyApprovedReport() {
    final Report report = createTestReport("testAutomaticallyApprovedReport_1");
    report.setApprovalStep(null);
    reportDao.update(report);

    // Report in automatic approve step (no planning workflow)
    final ReportAction ra = new ReportAction();
    ra.setReport(report);
    ra.setType(ActionType.APPROVE);
    ra.setPlanned(true);
    ra.setCreatedAt(Instant.now());
    reportActionDao.insert(ra);

    expectedIds.add("testAutomaticallyApprovedReport_1");

    testReportPublicationWorker(1);

    // Report should be published now
    testReportPublished(report.getUuid(), true);
  }

  private void testReportPublished(final String uuid, final boolean expectedPlanned) {
    final AnetObjectEngine engine = ApplicationContextProvider.getEngine();
    final Report updatedReport = reportDao.getByUuid(uuid);
    assertThat(updatedReport.getState()).isEqualTo(ReportState.PUBLISHED);
    final List<ReportAction> workflow = updatedReport.loadWorkflow(engine.getContext()).join();
    assertThat(workflow).isNotEmpty();
    final ReportAction lastAction = workflow.get(workflow.size() - 1);
    assertThat(lastAction.getType()).isEqualTo(ActionType.PUBLISH);
    assertThat(lastAction.isPlanned()).isEqualTo(expectedPlanned);
  }

  // DB integration
  private void testReportPublicationWorker(final int expectedCount) {
    final int emailSize = emailDao.getAll().size();
    reportPublicationWorker.run();
    assertThat(emailDao.getAll()).hasSize(emailSize + expectedCount);
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
    final ReportPerson author =
        AbstractResourceTest.personToReportAuthor(TestBeans.getTestPerson());
    personDao.insert(author);
    final EmailAddress emailAddress =
        new EmailAddress(Utils.getEmailNetworkForNotifications(), toAddressId + allowedEmail);
    emailAddressDao.updateEmailAddresses(PersonDao.TABLE_NAME, author.getUuid(),
        List.of(emailAddress));

    final Organization organization = TestBeans.getTestOrganization();
    organizationDao.insert(organization);

    final ApprovalStep approvalStep = TestBeans.getTestApprovalStep(organization);
    approvalStep.setType(ApprovalStepType.PLANNING_APPROVAL);
    approvalStepDao.insertAtEnd(approvalStep);

    final Report report = TestBeans.getTestReport(toAddressId, null, approvalStep, List.of(author));
    report.setState(ReportState.APPROVED);
    reportDao.insert(report);
    return report;
  }
}
