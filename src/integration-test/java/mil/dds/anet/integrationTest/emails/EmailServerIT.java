package mil.dds.anet.integrationTest.emails;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import io.dropwizard.testing.junit.DropwizardAppRule;
import java.util.List;
import mil.dds.anet.AnetApplication;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetConfiguration.SmtpConfiguration;
import mil.dds.anet.integrationTest.utils.EmailResponse;
import mil.dds.anet.integrationTest.utils.FakeSmtpServer;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;

/**
 * This class is only meant to show the basic capabilities of the fake SMTP server. It shows how to
 * query the email server and parse the response. Web-interface available at
 * http://[smtp_adress]:[stmp_port]
 */
public class EmailServerIT {

  @ClassRule
  public static final DropwizardAppRule<AnetConfiguration> RULE =
      new DropwizardAppRule<AnetConfiguration>(AnetApplication.class, "anet.yml");
  private static SmtpConfiguration smtpConfig;

  @BeforeClass
  public static void setUpClass() {
    smtpConfig = RULE.getConfiguration().getSmtp();
  }

  /**
   * Test the basic functions of the fake SMTP email server.
   * 
   * @throws Exception On SMTP query error
   */
  @Test
  public void runTest() throws Exception {
    final FakeSmtpServer emailServer = new FakeSmtpServer(smtpConfig);

    emailServer.clearEmailServer();

    emailServer.sendEmail("to@example.com", "from@example.com", null, null, "Test subject",
        "Hello there!", null);
    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();

    assertEquals(1, emails.size());

    // Test first email
    final EmailResponse email1 = emails.get(0);
    assertEquals("from@example.com", email1.from.text);
    assertEquals("to@example.com", email1.to.text);
    assertNull(email1.cc);
    assertNull(email1.replyTo);
    assertEquals("Test subject", email1.subject);
    assertEquals("Hello there!\n", email1.text); // <--Automatically inserts a new line!
  }
}
