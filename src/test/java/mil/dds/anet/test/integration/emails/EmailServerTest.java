package mil.dds.anet.test.integration.emails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.util.List;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.test.SpringTestConfig;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.test.integration.utils.EmailResponse;
import mil.dds.anet.test.integration.utils.FakeSmtpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * This class is only meant to show the basic capabilities of the fake SMTP server. It shows how to
 * query the email server and parse the response. Web-interface available at
 * http://[smtp_address]:[smtp_port]
 */
@SpringBootTest(classes = SpringTestConfig.class)
class EmailServerTest {

  @Autowired
  protected AnetConfig config;

  private FakeSmtpServer emailServer;

  @BeforeEach
  void setup() throws Exception {
    final boolean executeEmailServerTests = Boolean.parseBoolean(
        AnetTestConfiguration.getConfiguration().get("emailServerTestsExecute").toString());

    assumeTrue(executeEmailServerTests, "Email server tests configured to be skipped.");

    final AnetConfig.SmtpConfiguration smtpConfig = config.getSmtp();
    emailServer = new FakeSmtpServer(smtpConfig);

    // Clear the email server before starting test
    emailServer.clearEmailServer();
  }

  @AfterEach
  void tearDown() throws Exception {
    // Clear the email server after test
    emailServer.clearEmailServer();
  }

  /**
   * Test the basic functions of the fake SMTP email server.
   *
   * @throws Exception On SMTP query error
   */
  @Test
  void runTest() throws Exception {
    emailServer.sendEmail("to@example.com", "from@example.com", null, null, "Test subject",
        "Hello there!", null);
    final List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();

    assertThat(emails).hasSize(1);

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
