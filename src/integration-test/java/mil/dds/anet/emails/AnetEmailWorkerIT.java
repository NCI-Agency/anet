package mil.dds.anet.emails;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.when;
import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetConfiguration.SmtpConfiguration;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.utils.EmailResponse;
import mil.dds.anet.utils.FakeSmtpServer;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest({EmailDao.class, AnetConfiguration.class, ScheduledExecutorService.class,
    AnetObjectEngine.class})
public class AnetEmailWorkerIT {

  private AnetEmailWorker emailWorker;
  private EmailDao emailDao;
  private FakeSmtpServer emailServer;
  private AnetObjectEngine instance;

  /**
   * Sets up the test.
   */
  @Before
  public void setUp() {
    emailServer = new FakeSmtpServer();
    emailDao = PowerMockito.mock(EmailDao.class, Mockito.RETURNS_MOCKS);

    final AnetConfiguration config = PowerMockito.mock(AnetConfiguration.class, Mockito.RETURNS_MOCKS);
    final ScheduledExecutorService scheduler =
        PowerMockito.mock(ScheduledExecutorService.class, Mockito.RETURNS_MOCKS);

    // Configuration
    when(config.getDictionaryEntry("SUPPORT_EMAIL_ADDR")).thenReturn("support@example.com");
    when(config.getDictionaryEntry("dateFormats.email.date")).thenReturn("d MMMM yyyy");
    when(config.getDictionaryEntry("dateFormats.email.withTime")).thenReturn("d MMMM yyyy @ HH:mm");
    when(config.getDictionaryEntry("engagementsIncludeTimeAndDuration")).thenReturn(true);
    when(config.getDictionaryEntry("activeDomainNames")).thenReturn(Arrays.asList("anet.com"));
    when(config.getDictionaryEntry("fields")).thenReturn(new HashMap<String, Object>());

    when(config.getEmailFromAddr()).thenReturn("test_from_address@anet.com");
    when(config.getServerUrl()).thenReturn("localhost:1025");

    final SmtpConfiguration smtpConfig =
        PowerMockito.mock(SmtpConfiguration.class, Mockito.RETURNS_MOCKS);
    when(smtpConfig.getStartTls()).thenReturn(false);
    when(smtpConfig.getHostname()).thenReturn("localhost");
    when(smtpConfig.getPort()).thenReturn(1025);
    when(config.getSmtp()).thenReturn(smtpConfig);

    emailWorker = new AnetEmailWorker(emailDao, config, scheduler);

    // Email engine
    PowerMockito.mockStatic(AnetObjectEngine.class);
    instance = PowerMockito.mock(AnetObjectEngine.class);
    when(instance.getContext()).thenReturn(new HashMap<String, Object>());
    when(AnetObjectEngine.getInstance()).thenReturn(instance);
  }


  /**
   * Test the worker.
   * 
   * @throws IOException On error from the email server
   */
  @Test
  public void testWorker() throws IOException {
    // Setup
    emailServer.clearEmailServer();

    final List<String> toAddresses = Arrays.asList("test_to_address@anet.com");
    final AnetEmail testEmail = createTestEmail(1, toAddresses, "test_comment");

    // Run
    final List<AnetEmail> emailsToReadyToSend = Arrays.asList(testEmail);
    when(emailDao.getAll()).thenReturn(emailsToReadyToSend);

    emailWorker.run();

    // Verify
    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();
    assertEquals(1, emails.size());
  }

  private AnetEmail createTestEmail(int id, List<String> toAddresses, String comment) {
    final AnetEmail email = PowerMockito.mock(AnetEmail.class, Mockito.RETURNS_MOCKS);
    when(email.getId()).thenReturn(id);
    when(email.getToAddresses()).thenReturn(toAddresses);
    when(email.getCreatedAt()).thenReturn(Instant.now());
    when(email.getComment()).thenReturn(comment);

    return email;
  }
}
