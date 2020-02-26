package mil.dds.anet.test.integration.emails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import io.dropwizard.testing.ConfigOverride;
import io.dropwizard.testing.junit5.DropwizardAppExtension;
import io.dropwizard.testing.junit5.DropwizardExtensionsSupport;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import mil.dds.anet.AnetApplication;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import mil.dds.anet.threads.AnetEmailWorker;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;

@ExtendWith(DropwizardExtensionsSupport.class)
public class AnetEmailWorkerTest {

  private static AnetEmailWorker emailWorker;
  private static EmailDao emailDao;
  private static FakeSmtpServer emailServer;

  private static final DropwizardAppExtension<AnetConfiguration> app =
      new DropwizardAppExtension<AnetConfiguration>(AnetApplication.class, "anet.yml",
          ConfigOverride.config("dictionary.SUPPORT_EMAIL_ADDR", "support@example.com"),
          ConfigOverride.config("dictionary.activeDomainNames", "anet.com"));

  /**
   * Sets up the test.
   * 
   * @throws Exception If the setup fails
   */
  @BeforeAll
  public static void setUp() throws Exception {
    final boolean executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    assumeTrue(executeEmailServerTests, "Email server tests configured to be skipped.");

    emailDao = mock(EmailDao.class, Mockito.RETURNS_DEEP_STUBS);

    app.getConfiguration().setEmailFromAddr("test_from_address@anet.com");

    emailServer = new FakeSmtpServer(app.getConfiguration().getSmtp());
    emailWorker = new AnetEmailWorker(emailDao, app.getConfiguration());

    // Clear the email server before starting test
    emailServer.clearEmailServer();
  }

  @AfterAll
  public static void tearDown() throws Exception {
    // Clear the email server after test
    emailServer.clearEmailServer();
  }

  /**
   * Test the worker.
   * 
   * @throws Exception On error from the email server
   */
  @Test
  public void testWorker() throws Exception {
    final List<String> toAddresses = new ArrayList<>();
    toAddresses.add("test_to_address@anet.com");
    final AnetEmail testEmail = createTestEmail(1, toAddresses, "test_comment");

    // Run
    final List<AnetEmail> emailsToReadyToSend = new ArrayList<>();
    emailsToReadyToSend.add(testEmail);
    when(emailDao.getAll()).thenReturn(emailsToReadyToSend);

    emailWorker.run();

    // Verify
    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();
    assertThat(emails.size()).isEqualTo(1);
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
