package mil.dds.anet.test.integration.emails;

import static org.assertj.core.api.Assertions.assertThat;

import io.dropwizard.testing.junit5.DropwizardAppExtension;
import io.dropwizard.testing.junit5.DropwizardExtensionsSupport;
import java.util.List;
import mil.dds.anet.AnetApplication;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetConfiguration.SmtpConfiguration;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

/**
 * This class is only meant to show the basic capabilities of the fake SMTP server. It shows how to
 * query the email server and parse the response. Web-interface available at
 * http://[smtp_adress]:[stmp_port]
 */
@ExtendWith(DropwizardExtensionsSupport.class)
public class EmailServerTest {
  public static final DropwizardAppExtension<AnetConfiguration> RULE =
      new DropwizardAppExtension<AnetConfiguration>(AnetApplication.class, "anet.yml");
  private static SmtpConfiguration smtpConfig;

  private FakeSmtpServer emailServer;

  @BeforeAll
  public static void setUpClass() {
    smtpConfig = RULE.getConfiguration().getSmtp();
  }

  @BeforeEach
  public void setup() throws Exception {
    assertThat(Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString())).isTrue();

    emailServer = new FakeSmtpServer(smtpConfig);

    // Clear the email server before starting test
    emailServer.clearEmailServer();
  }

  @AfterEach
  public void tearDown() throws Exception {
    // Clear the email server after test
    emailServer.clearEmailServer();
  }

  /**
   * Test the basic functions of the fake SMTP email server.
   * 
   * @throws Exception On SMTP query error
   */
  @Test
  public void runTest() throws Exception {
    emailServer.sendEmail("to@example.com", "from@example.com", null, null, "Test subject",
        "Hello there!", null);
    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();

    assertThat(emails.size()).isEqualTo(1);

    // Test first email
    final EmailResponse email1 = emails.get(0);
    assertThat(email1.from.text).isEqualTo("from@example.com");
    assertThat(email1.to.text).isEqualTo("to@example.com");
    assertThat(email1.cc).isNull();
    assertThat(email1.replyTo).isNull();
    assertThat(email1.subject).isEqualTo("Test subject");
    assertThat(email1.text).isEqualTo("Hello there!\n"); // <--Automatically inserts a new line!
  }
}
