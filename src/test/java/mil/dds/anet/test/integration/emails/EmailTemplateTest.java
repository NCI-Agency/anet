package mil.dds.anet.test.integration.emails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.emails.AccountDeactivationEmail;
import mil.dds.anet.emails.AccountDeactivationWarningEmail;
import mil.dds.anet.emails.AnetEmailAction;
import mil.dds.anet.emails.ApprovalNeededEmail;
import mil.dds.anet.emails.DailyRollupEmail;
import mil.dds.anet.emails.FutureEngagementUpdated;
import mil.dds.anet.emails.NewReportCommentEmail;
import mil.dds.anet.emails.PendingAssessmentsNotificationEmail;
import mil.dds.anet.emails.ReportEditedEmail;
import mil.dds.anet.emails.ReportEmail;
import mil.dds.anet.emails.ReportPublishedEmail;
import mil.dds.anet.emails.ReportRejectionEmail;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.resources.ReportResourceTest;
import mil.dds.anet.threads.AnetEmailWorker;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class EmailTemplateTest extends AbstractResourceTest {

  @Autowired
  private JobHistoryDao jobHistoryDao;

  @Autowired
  private EmailDao emailDao;

  @Autowired
  private CommentDao commentDao;

  private FakeSmtpServer emailServer;
  private AnetEmailWorker emailWorker;

  @BeforeAll
  void setUpClass() throws Exception {
    if (config.getSmtp().isDisabled()) {
      fail("'ANET_SMTP_DISABLE' system environment variable must have value 'false' to run test.");
    }

    emailWorker = new AnetEmailWorker(config, dict, jobHistoryDao, emailDao);
    emailServer = new FakeSmtpServer(config.getSmtp());

    // Flush all emails from previous tests
    emailWorker.run();
    // Clear the email server before starting testing
    emailServer.clearEmailServer();
  }

  @AfterAll
  void tearDownClass() throws Exception {
    // Clear the email server after testing
    emailServer.clearEmailServer();
    emailWorker = null;
    AnetEmailWorker.setInstance(null);
  }

  @Test
  void testAccountDeactivationTemplate() throws IOException, InterruptedException {
    final AccountDeactivationEmail action = new AccountDeactivationEmail();
    action.setPerson(getAdminBean());
    assertActionCanBeSent(action);
  }

  @Test
  void testAccountDeactivationWarningTemplate() throws IOException, InterruptedException {
    final AccountDeactivationWarningEmail action = new AccountDeactivationWarningEmail();
    action.setPerson(getAdminBean());
    action.setNextReminder(Instant.now());
    assertActionCanBeSent(action);
  }

  @Test
  void testApprovalNeededTemplate() throws IOException, InterruptedException {
    final Report report = getTestReport();
    final ApprovalNeededEmail action = new ApprovalNeededEmail();
    action.setReport(report);
    assertActionCanBeSent(action);
  }

  @Test
  void testDailyRollupTemplate() throws IOException, InterruptedException {
    final Person person = getAdminBean();
    final DailyRollupEmail action = new DailyRollupEmail();
    action.setStartDate(Instant.now());
    action.setEndDate(Instant.now());
    action.setEndDate(Instant.now());
    action.setSender(person);
    // ANET Administrators
    action.setOrgUuid("285fa226-05cb-46d3-9037-9de459f4beec");
    action.setChartOrgType(RollupGraph.RollupGraphType.ADVISOR);
    action.setComment("Test daily rollup email");
    assertActionCanBeSent(action);
  }

  @Test
  void testFutureEngagementUpdatedTemplate() throws IOException, InterruptedException {
    final Report report = getTestReport();
    final FutureEngagementUpdated action = new FutureEngagementUpdated();
    action.setReport(report);
    assertActionCanBeSent(action);
  }

  @Test
  void testNewReportCommentTemplate() throws IOException, InterruptedException {
    final Report report = getTestReport();
    final Person person = getAdminBean();
    final Comment comment = createComment(person, report, "Test new report comment email");
    final NewReportCommentEmail action = new NewReportCommentEmail();
    action.setReport(report);
    action.setComment(comment);
    assertActionCanBeSent(action);
    deleteComment(comment);
  }

  @Test
  void testPendingAssessmentsNotificationTemplate() throws IOException, InterruptedException {
    final Person person = getAdminBean();
    final PendingAssessmentsNotificationEmail action = new PendingAssessmentsNotificationEmail();
    action.setAdvisor(person);
    // Chief of Police
    action.setPositionUuidsToAssess(List.of("731ee4f9-f21b-4166-b03d-d7ba5e7f735c"));
    // EF 1
    action.setTaskUuidsToAssess(List.of("1145e584-4485-4ce0-89c4-2fa2e1fe846a"));
    assertActionCanBeSent(action);
  }

  @Test
  void testReportEditedTemplate() throws IOException, InterruptedException {
    final Report report = getTestReport();
    final Person person = getAdminBean();
    final ReportEditedEmail action = new ReportEditedEmail();
    action.setReport(report);
    action.setEditor(person);
    assertActionCanBeSent(action);
  }

  @Test
  void testReportTemplate() throws IOException, InterruptedException {
    final Report report = getTestReport();
    final Person person = getAdminBean();
    final ReportEmail action = new ReportEmail();
    action.setReport(report);
    action.setSender(person);
    action.setComment("Test report email");
    assertActionCanBeSent(action);
  }

  @Test
  void testReportPublishedTemplate() throws IOException, InterruptedException {
    final Report report = getTestReport();
    final ReportPublishedEmail action = new ReportPublishedEmail();
    action.setReport(report);
    assertActionCanBeSent(action);
  }

  @Test
  void testReportRejectionTemplate() throws IOException, InterruptedException {
    final Report report = getTestReport();
    final Person person = getAdminBean();
    final Comment comment = createComment(person, report, "Test report rejection email");
    final ReportRejectionEmail action = new ReportRejectionEmail();
    action.setReport(report);
    action.setRejector(person);
    action.setComment(comment);
    assertActionCanBeSent(action);
    deleteComment(comment);
  }

  private Report getTestReport() {
    // A test report from Arthur
    final mil.dds.anet.test.client.Report report = withCredentials(adminUser, t -> queryExecutor
        .report(ReportResourceTest.FIELDS, "59be259b-30b9-4d04-9e21-e8ceb58cbe9c"));
    return getInput(report, Report.class);
  }

  private Comment createComment(Person person, Report report, String text) {
    final Comment comment = new Comment();
    comment.setAuthor(person);
    comment.setText(text);
    comment.setReportUuid(report.getUuid());
    return commentDao.insert(comment);
  }

  private void deleteComment(Comment comment) {
    commentDao.delete(comment.getUuid());
  }

  void assertActionCanBeSent(AnetEmailAction action) throws IOException, InterruptedException {
    // Get current mail status
    final int nrOfEmailsInDb = emailDao.getAll().size();
    final int nrOfEmailsOnServer = emailServer.requestAllEmailsFromServer().size();

    // Put message in db
    ReportDao.sendEmailToReportPeople(action, List.of(getAdminBean()));
    assertThat(emailDao.getAll()).hasSize(nrOfEmailsInDb + 1);

    // Send message to mail server
    emailWorker.run();
    assertThat(emailServer.requestAllEmailsFromServer()).hasSize(nrOfEmailsOnServer + 1);
    assertThat(emailDao.getAll()).hasSize(nrOfEmailsInDb);
  }
}
