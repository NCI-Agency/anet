package mil.dds.anet.test.integration.emails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.test.SpringTestConfig;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.threads.AnetEmailWorker;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = SpringTestConfig.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AnetEmailWorkerTest {

  @Autowired
  protected AnetConfig config;

  @Autowired
  protected AnetDictionary dict;

  @Autowired
  private JobHistoryDao jobHistoryDao;

  private String allowedEmail;
  private EmailDao emailDao;
  private FakeSmtpServer emailServer;
  private AnetEmailWorker emailWorker = null;

  @BeforeAll
  @SuppressWarnings("unchecked")
  void setUp() throws Exception {
    final boolean executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    assumeTrue(executeEmailServerTests, "Email server tests configured to be skipped.");

    emailDao = mock(EmailDao.class, Mockito.RETURNS_DEEP_STUBS);
    emailWorker = new AnetEmailWorker(config, dict, jobHistoryDao, emailDao);

    allowedEmail = "@" + ((List<String>) dict.getDictionaryEntry("domainNames")).get(0);
    config.setEmailFromAddr("test_from_address" + allowedEmail);

    emailServer = new FakeSmtpServer(config.getSmtp());

    // Clear the email server before starting test
    emailServer.clearEmailServer();
  }

  @AfterAll
  void tearDown() throws Exception {
    // Clear the email server after test
    emailServer.clearEmailServer();

    emailWorker = null;
    AnetEmailWorker.setInstance(null);
  }

  /**
   * Test the worker.
   *
   * @throws Exception On error from the email server
   */
  @Test
  void testWorker() throws Exception {
    final List<String> toAddresses = new ArrayList<>();
    toAddresses.add("test_to_address" + allowedEmail);
    final AnetEmail testEmail = createTestEmail(1, toAddresses, "test_comment");

    // Run
    final List<AnetEmail> emailsToReadyToSend = new ArrayList<>();
    emailsToReadyToSend.add(testEmail);
    when(emailDao.getAll()).thenReturn(emailsToReadyToSend);

    // Make sure all messages have been (asynchronously) sent
    emailWorker.run();

    // Verify
    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();
    assertThat(emails).hasSize(1);
  }

  private AnetEmail createTestEmail(final int id, final List<String> toAddresses,
      final String comment) {
    final AnetEmail email = mock(AnetEmail.class, Mockito.RETURNS_MOCKS);
    when(email.getId()).thenReturn(id);
    when(email.getToAddresses()).thenReturn(toAddresses);
    when(email.getCreatedAt()).thenReturn(Instant.now());
    when(email.getComment()).thenReturn(comment);

    return email;
  }
}
