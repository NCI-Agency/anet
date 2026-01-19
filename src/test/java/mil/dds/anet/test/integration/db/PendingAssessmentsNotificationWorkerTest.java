package mil.dds.anet.test.integration.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.emails.PendingAssessmentsNotificationEmail;
import mil.dds.anet.test.AnetApplicationTest;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.PendingAssessmentsNotificationWorker;
import mil.dds.anet.utils.PendingAssessmentsHelper.AssessmentDates;
import mil.dds.anet.utils.PendingAssessmentsHelper.Recurrence;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

class PendingAssessmentsNotificationWorkerTest extends AnetApplicationTest {

  protected static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Autowired
  protected AnetConfig config;

  @Autowired
  protected AnetDictionary dict;

  @Autowired
  private JobHistoryDao jobHistoryDao;

  @Autowired
  private EmailDao emailDao;

  @Autowired
  private PositionDao positionDao;

  @Autowired
  private TaskDao taskDao;

  private PendingAssessmentsNotificationWorker pendingAssessmentsNotificationWorker;
  private AnetEmailWorker emailWorker;
  private FakeSmtpServer emailServer;

  private boolean executeEmailServerTests;

  @BeforeAll
  void setUpClass() throws Exception {
    if (config.getSmtp().isDisabled()) {
      fail("'ANET_SMTP_DISABLE' system environment variable must have value 'false' to run test.");
    }

    executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    pendingAssessmentsNotificationWorker =
        new PendingAssessmentsNotificationWorker(dict, jobHistoryDao);
    emailWorker = new AnetEmailWorker(config, dict, jobHistoryDao, emailDao);
    emailServer = new FakeSmtpServer(config.getSmtp());

    // Flush all assessment notifications
    pendingAssessmentsNotificationWorker.run();
    // Clear the email server before starting testing
    flushEmail();
  }

  @AfterAll
  void tearDownClass() throws Exception {
    // Clear the email server after testing
    flushEmail();

    emailWorker = null;
    AnetEmailWorker.setInstance(null);
  }

  @Test
  void testGetAssessmentDates() {
    final Object[][] testData = new Object[][] {
        // each item has: { test date, recurrence, expected assessment date,
        // expected notification date, expected reminder date }
        // daily tests
        {"2004-02-28T23:59:59.999Z", Recurrence.DAILY, "2004-02-27T00:00:00.000Z",
            "2004-02-28T00:00:00.000Z", null},
        {"2004-02-29T00:00:00.000Z", Recurrence.DAILY, "2004-02-28T00:00:00.000Z",
            "2004-02-29T00:00:00.000Z", null},
        {"2004-02-29T23:59:59.999Z", Recurrence.DAILY, "2004-02-28T00:00:00.000Z",
            "2004-02-29T00:00:00.000Z", null},
        {"2004-03-01T00:00:00.000Z", Recurrence.DAILY, "2004-02-29T00:00:00.000Z",
            "2004-03-01T00:00:00.000Z", null},
        // weekly tests
        {"2004-02-28T23:59:59.999Z", Recurrence.WEEKLY, "2004-02-16T00:00:00.000Z",
            "2004-02-23T00:00:00.000Z", "2004-02-26T00:00:00.000Z"},
        {"2004-02-29T00:00:00.000Z", Recurrence.WEEKLY, "2004-02-16T00:00:00.000Z",
            "2004-02-23T00:00:00.000Z", "2004-02-26T00:00:00.000Z"},
        {"2004-02-29T23:59:59.999Z", Recurrence.WEEKLY, "2004-02-16T00:00:00.000Z",
            "2004-02-23T00:00:00.000Z", "2004-02-26T00:00:00.000Z"},
        {"2004-03-01T00:00:00.000Z", Recurrence.WEEKLY, "2004-02-23T00:00:00.000Z",
            "2004-03-01T00:00:00.000Z", "2004-03-04T00:00:00.000Z"},
        // biweekly tests
        {"2004-02-28T23:59:59.999Z", Recurrence.BIWEEKLY, "2004-02-09T00:00:00.000Z",
            "2004-02-23T00:00:00.000Z", "2004-02-28T00:00:00.000Z"},
        {"2004-02-29T00:00:00.000Z", Recurrence.BIWEEKLY, "2004-02-09T00:00:00.000Z",
            "2004-02-23T00:00:00.000Z", "2004-02-28T00:00:00.000Z"},
        {"2004-02-29T23:59:59.999Z", Recurrence.BIWEEKLY, "2004-02-09T00:00:00.000Z",
            "2004-02-23T00:00:00.000Z", "2004-02-28T00:00:00.000Z"},
        {"2004-03-01T00:00:00.000Z", Recurrence.BIWEEKLY, "2004-02-09T00:00:00.000Z",
            "2004-02-23T00:00:00.000Z", "2004-02-28T00:00:00.000Z"},
        {"2004-03-07T23:59:59.999Z", Recurrence.BIWEEKLY, "2004-02-09T00:00:00.000Z",
            "2004-02-23T00:00:00.000Z", "2004-02-28T00:00:00.000Z"},
        {"2004-03-08T00:00:00.000Z", Recurrence.BIWEEKLY, "2004-02-23T00:00:00.000Z",
            "2004-03-08T00:00:00.000Z", "2004-03-13T00:00:00.000Z"},
        {"2021-01-03T23:59:59.999Z", Recurrence.BIWEEKLY, "2020-12-07T00:00:00.000Z",
            "2020-12-21T00:00:00.000Z", "2020-12-26T00:00:00.000Z"},
        {"2021-01-04T00:00:00.000Z", Recurrence.BIWEEKLY, "2020-12-21T00:00:00.000Z",
            "2021-01-04T00:00:00.000Z", "2021-01-09T00:00:00.000Z"},
        {"2021-01-18T00:00:00.000Z", Recurrence.BIWEEKLY, "2021-01-04T00:00:00.000Z",
            "2021-01-18T00:00:00.000Z", "2021-01-23T00:00:00.000Z"},
        {"2021-01-24T23:59:59.999Z", Recurrence.BIWEEKLY, "2021-01-04T00:00:00.000Z",
            "2021-01-18T00:00:00.000Z", "2021-01-23T00:00:00.000Z"},
        {"2021-01-25T00:00:00.000Z", Recurrence.BIWEEKLY, "2021-01-04T00:00:00.000Z",
            "2021-01-18T00:00:00.000Z", "2021-01-23T00:00:00.000Z"},
        {"2021-01-31T23:59:59.999Z", Recurrence.BIWEEKLY, "2021-01-04T00:00:00.000Z",
            "2021-01-18T00:00:00.000Z", "2021-01-23T00:00:00.000Z"},
        {"2021-02-01T00:00:00.000Z", Recurrence.BIWEEKLY, "2021-01-18T00:00:00.000Z",
            "2021-02-01T00:00:00.000Z", "2021-02-06T00:00:00.000Z"},
        // semimonthly tests
        {"2004-02-28T23:59:59.999Z", Recurrence.SEMIMONTHLY, "2004-02-01T00:00:00.000Z",
            "2004-02-15T00:00:00.000Z", "2004-02-20T00:00:00.000Z"},
        {"2004-02-29T00:00:00.000Z", Recurrence.SEMIMONTHLY, "2004-02-01T00:00:00.000Z",
            "2004-02-15T00:00:00.000Z", "2004-02-20T00:00:00.000Z"},
        {"2004-02-29T23:59:59.999Z", Recurrence.SEMIMONTHLY, "2004-02-01T00:00:00.000Z",
            "2004-02-15T00:00:00.000Z", "2004-02-20T00:00:00.000Z"},
        {"2004-03-01T00:00:00.000Z", Recurrence.SEMIMONTHLY, "2004-02-15T00:00:00.000Z",
            "2004-03-01T00:00:00.000Z", "2004-03-06T00:00:00.000Z"},
        // monthly tests
        {"2004-02-28T23:59:59.999Z", Recurrence.MONTHLY, "2004-01-01T00:00:00.000Z",
            "2004-02-01T00:00:00.000Z", "2004-02-08T00:00:00.000Z"},
        {"2004-02-29T00:00:00.000Z", Recurrence.MONTHLY, "2004-01-01T00:00:00.000Z",
            "2004-02-01T00:00:00.000Z", "2004-02-08T00:00:00.000Z"},
        {"2004-02-29T23:59:59.999Z", Recurrence.MONTHLY, "2004-01-01T00:00:00.000Z",
            "2004-02-01T00:00:00.000Z", "2004-02-08T00:00:00.000Z"},
        {"2004-03-01T00:00:00.000Z", Recurrence.MONTHLY, "2004-02-01T00:00:00.000Z",
            "2004-03-01T00:00:00.000Z", "2004-03-08T00:00:00.000Z"},
        // quarterly tests
        {"2004-02-29T00:00:00.000Z", Recurrence.QUARTERLY, "2003-10-01T00:00:00.000Z",
            "2004-01-01T00:00:00.000Z", "2004-01-29T00:00:00.000Z"},
        {"2004-03-31T23:59:59.999Z", Recurrence.QUARTERLY, "2003-10-01T00:00:00.000Z",
            "2004-01-01T00:00:00.000Z", "2004-01-29T00:00:00.000Z"},
        {"2004-04-01T00:00:00.000Z", Recurrence.QUARTERLY, "2004-01-01T00:00:00.000Z",
            "2004-04-01T00:00:00.000Z", "2004-04-29T00:00:00.000Z"},
        // semiannually tests
        {"2004-02-29T00:00:00.000Z", Recurrence.SEMIANNUALLY, "2003-07-01T00:00:00.000Z",
            "2004-01-01T00:00:00.000Z", "2004-02-01T00:00:00.000Z"},
        {"2004-06-30T23:59:59.999Z", Recurrence.SEMIANNUALLY, "2003-07-01T00:00:00.000Z",
            "2004-01-01T00:00:00.000Z", "2004-02-01T00:00:00.000Z"},
        {"2004-07-01T00:00:00.000Z", Recurrence.SEMIANNUALLY, "2004-01-01T00:00:00.000Z",
            "2004-07-01T00:00:00.000Z", "2004-08-01T00:00:00.000Z"},
        // annually tests
        {"2003-12-31T23:59:59.999Z", Recurrence.ANNUALLY, "2002-01-01T00:00:00.000Z",
            "2003-01-01T00:00:00.000Z", "2003-02-01T00:00:00.000Z"},
        {"2004-01-01T00:00:00.000Z", Recurrence.ANNUALLY, "2003-01-01T00:00:00.000Z",
            "2004-01-01T00:00:00.000Z", "2004-02-01T00:00:00.000Z"},
        {"2004-02-29T00:00:00.000Z", Recurrence.ANNUALLY, "2003-01-01T00:00:00.000Z",
            "2004-01-01T00:00:00.000Z", "2004-02-01T00:00:00.000Z"},
        // end
    };
    for (final Object[] testItem : testData) {
      final AssessmentDates assessmentDates =
          new AssessmentDates(toInstant(testItem[0]), (Recurrence) testItem[1], true);
      logger.debug("checking {} against {}", testItem, assessmentDates);
      assertThat(assessmentDates.getAssessmentDate()).isEqualTo(toInstant(testItem[2]));
      assertThat(assessmentDates.getNotificationDate()).isEqualTo(toInstant(testItem[3]));
      assertThat(assessmentDates.getReminderDate()).isEqualTo(toInstant(testItem[4]));
    }
  }

  private Instant toInstant(final Object testDate) {
    return testDate == null ? null : Instant.parse((String) testDate);
  }

  @Test
  void testNoAssessments() {
    // There should be no new pending assessments since the run in setUpClass()
    testPendingAssessmentsNotificationWorker(0);
  }

  @Test
  void testInitialDataAssessments() throws Exception {
    final JobHistory jobHistory =
        jobHistoryDao.getByJobName(pendingAssessmentsNotificationWorker.getClass().getSimpleName());
    if (jobHistory != null) {
      // Wipe out last run
      jobHistory.setLastRun(Instant.EPOCH);
      jobHistoryDao.update(jobHistory);
    }

    // From our initial data we should get 7 pending assessments
    final List<AnetEmail> emails = testPendingAssessmentsNotificationWorker(7);
    // Check the actual emails
    for (final AnetEmail email : emails) {
      assertThat(email.getToAddresses()).hasSize(1);
      final String to = email.getToAddresses().get(0);
      final PendingAssessmentsNotificationEmail action =
          (PendingAssessmentsNotificationEmail) email.getAction();
      switch (to.split("@")[0]) {
        case "erin":
          // Erin should assess position Planning Captain
          assertAssessments(action, Set.of("Planning Captain"), Collections.emptySet());
          break;
        case "henry":
          // Henry should assess task 2.A and 2.B
          assertAssessments(action, Collections.emptySet(), Set.of("2.A", "2.B"));
          break;
        case "liz":
          // Elizabeth should assess position Cost Adder - MoD
          assertAssessments(action, Set.of("Cost Adder - MoD"), Collections.emptySet());
          break;
        case "bob":
          // Bob should assess task 1.1
          assertAssessments(action, Collections.emptySet(), Set.of("1.1"));
          break;
        case "andrew":
          // Andrew should assess tasks 1.1.A, 1.2.A and 1.2.B
          assertAssessments(action, Collections.emptySet(), Set.of("1.1.A", "1.2.A", "1.2.B"));
          break;
        case "kevin.malone":
          // Kevin should assess position Chief of Tests
          assertAssessments(action, Set.of("Chief of Tests"), Collections.emptySet());
          break;
        case "creed.bratton":
          // Creed should assess position Director of Tests
          assertAssessments(action, Set.of("Director of Tests"), Collections.emptySet());
          break;
        default:
          fail("Unknown to address: " + to);
      }
    }

    // There should be no new pending assessments since the previous run
    flushEmail();
    testPendingAssessmentsNotificationWorker(0);
  }

  private void assertAssessments(final PendingAssessmentsNotificationEmail action,
      final Set<String> expectedPositions, final Set<String> expectedTasks) {
    assertThat(action.getPositionUuidsToAssess()).hasSize(expectedPositions.size());
    final Set<String> actualPositions = action.getPositionUuidsToAssess().stream()
        .map(positionUuid -> positionDao.getByUuid(positionUuid).getName())
        .collect(Collectors.toSet());
    assertThat(actualPositions).isEqualTo(expectedPositions);

    assertThat(action.getTaskUuidsToAssess()).hasSize(expectedTasks.size());
    final Set<String> actualTasks = action.getTaskUuidsToAssess().stream()
        .map(taskUuid -> taskDao.getByUuid(taskUuid).getShortName()).collect(Collectors.toSet());
    assertThat(actualTasks).isEqualTo(expectedTasks);
  }

  private List<AnetEmail> testPendingAssessmentsNotificationWorker(final int expectedCount) {
    final int prevEmailSize = emailDao.getAll().size();
    pendingAssessmentsNotificationWorker.run();
    final List<AnetEmail> emails = emailDao.getAll();
    assertThat(emails).hasSize(prevEmailSize + expectedCount);
    return emails.subList(prevEmailSize, emails.size());
  }

  private void flushEmail() throws Exception {
    assumeTrue(executeEmailServerTests, "Email server tests configured to be skipped.");

    // Flush all messages
    emailWorker.run();
    // Clear the email server
    emailServer.clearEmailServer();
  }

}
