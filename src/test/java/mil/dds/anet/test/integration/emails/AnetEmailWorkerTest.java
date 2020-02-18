package mil.dds.anet.test.integration.emails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import io.dropwizard.testing.junit5.DropwizardAppExtension;
import io.dropwizard.testing.junit5.DropwizardExtensionsSupport;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
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
      new DropwizardAppExtension<AnetConfiguration>(AnetApplication.class, "anet.yml");

  /**
   * Sets up the test.
   * 
   * @throws Exception If the setup fails
   */
  @BeforeAll
  public static void setUp() throws Exception {
    assumeTrue(Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString()));

    emailDao = mock(EmailDao.class, Mockito.RETURNS_DEEP_STUBS);

    final ScheduledExecutorService scheduler =
        mock(ScheduledExecutorService.class, Mockito.RETURNS_DEEP_STUBS);

    // Configuration
    app.getConfiguration().getDictionary().put("SUPPORT_EMAIL_ADDR", "support@example.com");
    app.getConfiguration().getDictionary().put("dateFormats.email.date", "d MMMM yyyy");
    app.getConfiguration().getDictionary().put("dateFormats.email.withTime", "d MMMM yyyy @ HH:mm");
    app.getConfiguration().getDictionary().put("engagementsIncludeTimeAndDuration", true);
    app.getConfiguration().getDictionary().put("activeDomainNames", Arrays.asList("anet.com"));
    app.getConfiguration().getDictionary().put("fields", new HashMap<String, Object>());
    app.getConfiguration().setEmailFromAddr("test_from_address@anet.com");

    emailServer = new FakeSmtpServer(app.getConfiguration().getSmtp());
    emailWorker = new AnetEmailWorker(emailDao, app.getConfiguration(), scheduler);

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
    final List<String> toAddresses = Arrays.asList("test_to_address@anet.com");
    final AnetEmail testEmail = createTestEmail(1, toAddresses, "test_comment");

    // Run
    final List<AnetEmail> emailsToReadyToSend = Arrays.asList(testEmail);
    when(emailDao.getAll()).thenReturn(emailsToReadyToSend);

    emailWorker.run();

    // Verify
    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();
    assertThat(emails.size()).isEqualTo(1);
  }

  private AnetEmail createTestEmail(int id, List<String> toAddresses, String comment) {
    final AnetEmail email = mock(AnetEmail.class, Mockito.RETURNS_DEEP_STUBS);
    when(email.getId()).thenReturn(id);
    when(email.getToAddresses()).thenReturn(toAddresses);
    when(email.getCreatedAt()).thenReturn(Instant.now());
    when(email.getComment()).thenReturn(comment);

    return email;
  }
}
