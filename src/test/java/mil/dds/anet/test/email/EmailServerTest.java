package mil.dds.anet.test.email;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import java.util.List;
import org.junit.Test;

/**
 * This class is only meant to show the basic capabilities of the fake SMTP server. It shows how to
 * query the email server and parse the response. Web-interface available at
 * http://<smtp_adress>:<stmp_port>
 */
public class EmailServerTest {

  @Test
  public void runTest() throws Exception {
    FakeSmtpServer emailServer = new FakeSmtpServer();

    emailServer.clearEmailServer();

    emailServer.sendEmail("to@example.com", "from@example.com", null, null, "Test subject",
        "Hello there!", null);
    List<EmailResponse> emails = emailServer.requestAllEmailsFromServer();

    assertEquals(1, emails.size());

    // Test first email
    EmailResponse email1 = emails.get(0);
    assertEquals("from@example.com", email1.from.text);
    assertEquals("to@example.com", email1.to.text);
    assertNull(email1.cc);
    assertNull(email1.replyTo);
    assertEquals("Test subject", email1.subject);
    assertEquals("Hello there!\n", email1.text); // <--Automatically inserts a new line!
  }
}
