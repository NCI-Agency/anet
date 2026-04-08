package mil.dds.anet.test.integration.utils;

import static org.junit.jupiter.api.Assertions.fail;

import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.TimeUnit;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.test.integration.config.AnetTestConfiguration;
import mil.dds.anet.utils.Utils;
import org.apache.commons.io.IOUtils;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * This class provides a wrapper for the fake SMTP server's API.
 */
public class FakeSmtpServer {

  private final String smtpIP;
  private final String smtpPort;
  private final String smtpUsername;
  private final String smtpPassword;
  private final String sslTrust;
  private final String startTls;

  private final int waitBeforeActionMs;
  private final int maxRetriesClear;

  private final String serverQuery;

  public FakeSmtpServer(final AnetConfig.SmtpConfiguration smtpConfig) throws Exception {
    smtpIP = smtpConfig.getHostname();
    smtpPort = Integer.toString(smtpConfig.getPort());
    smtpUsername = smtpConfig.getUsername();
    smtpPassword = smtpConfig.getPassword();
    sslTrust = smtpConfig.getSslTrust();
    startTls = Boolean.toString(smtpConfig.getStartTls());
    final String httpIP = smtpConfig.getHostname();

    // Not in config
    final String httpPort = System.getenv("ANET_SMTP_HTTP_PORT");

    // A system variable is required to run this test
    if (httpPort == null) {
      fail("'ANET_SMTP_HTTP_PORT' system environment variable not found.");
    }

    serverQuery = String.format("http://%s:%s/api/v1/messages", httpIP, httpPort);

    // Read from test config
    waitBeforeActionMs = Integer
        .parseInt(AnetTestConfiguration.getConfiguration().get("emailWaitBeforeAction").toString());
    maxRetriesClear = Integer.parseInt(
        AnetTestConfiguration.getConfiguration().get("emailMaxWaitRetriesOnClear").toString());

    clearEmailServer();
  }

  /**
   * Retrieves all emails from the server.
   *
   * @return All emails from the server
   * @throws IOException If the request fails
   * @throws InterruptedException If the wait timer fails
   */
  public List<EmailResponse> requestAllEmailsFromServer() throws IOException, InterruptedException {
    TimeUnit.MILLISECONDS.sleep(waitBeforeActionMs);

    return requestEmailsFromServer();
  }

  /**
   * Retrieves all emails from the server.
   *
   * @return All emails from the server
   * @throws IOException If the request fails
   * @throws InterruptedException If the wait timer fails
   */
  public List<EmailResponse> requestEmailsFromServer() throws IOException, InterruptedException {
    TimeUnit.MILLISECONDS.sleep(waitBeforeActionMs);

    final String response = sendServerRequest(serverQuery, "GET");
    return parseServeResponse(response);
  }

  /**
   * Clears all emails from the server.
   *
   * @throws Exception If the request or wait timer fails
   */
  public void clearEmailServer() throws Exception {
    TimeUnit.MILLISECONDS.sleep(waitBeforeActionMs);

    sendServerRequest(serverQuery, "DELETE");

    for (int i = 0; i <= maxRetriesClear; i++) {
      if (i == maxRetriesClear) {
        throw new Exception("Email server not responding");
      } else if (requestAllEmailsFromServer().isEmpty()) {
        break;
      }
    }
  }

  private List<EmailResponse> parseServeResponse(final String serverResponse)
      throws JacksonException {
    final ObjectMapper mapper = new ObjectMapper();
    final JsonNode response = mapper.readTree(serverResponse);
    final List<EmailResponse> emails = new ArrayList<>();
    response.get("messages").forEach(node -> emails.add(new EmailResponse(node)));
    return emails;
  }

  private String sendServerRequest(final String request, final String requestType)
      throws IOException {
    final URL url;
    try {
      url = new URI(request).toURL();
    } catch (URISyntaxException e) {
      throw new RuntimeException(e);
    }
    final HttpURLConnection httpConnection = (HttpURLConnection) url.openConnection();

    if (!Utils.isEmptyOrNull(smtpUsername) || !Utils.isEmptyOrNull(smtpPassword)) {
      final String userpass = smtpUsername + ":" + smtpPassword;
      final String basicAuth =
          "Basic " + new String(Base64.getEncoder().encode(userpass.getBytes()));
      httpConnection.setRequestProperty("Authorization", basicAuth);
    }

    httpConnection.setDoOutput(true);
    httpConnection.setRequestMethod(requestType);
    httpConnection.connect();
    final InputStream response = httpConnection.getInputStream();
    return IOUtils.toString(response, StandardCharsets.UTF_8);
  }

  /**
   * Sends an email to the server.
   *
   * @param to 'To' address
   * @param from 'From' address
   * @param replyTo 'ReplyTo' address
   * @param cc 'CC' address
   * @param subject Email's subject
   * @param msg Email's message
   * @param date (Optional) Email's date
   * @throws MessagingException If formatting/sending the email fails
   */
  public void sendEmail(final String to, final String from, final String replyTo, final String cc,
      final String subject, final String msg, final Date date) throws MessagingException {
    final Properties properties = System.getProperties();

    properties.setProperty("mail.smtp.host", smtpIP);
    properties.setProperty("mail.smtp.port", smtpPort);
    properties.setProperty("mail.smtp.auth", "false");
    properties.setProperty("mail.smtp.ssl.trust", sslTrust);
    properties.setProperty("mail.smtp.starttls.enable", startTls);

    final Session session = Session.getDefaultInstance(properties, new Authenticator() {

      @Override
      protected PasswordAuthentication getPasswordAuthentication() {
        return new PasswordAuthentication(smtpUsername, smtpPassword);
      }

    });

    final Message message = new MimeMessage(session);
    message.setFrom(new InternetAddress(from));
    message.addRecipient(Message.RecipientType.TO, new InternetAddress(to));

    if (replyTo != null) {
      message.setReplyTo(new InternetAddress[] {new InternetAddress(replyTo)});
    }

    if (cc != null) {
      message.addRecipient(Message.RecipientType.CC, new InternetAddress(cc));
    }

    message.setSubject(subject);
    message.setText(msg);
    message.setSentDate(date == null ? new Date() : date);

    Transport.send(message, message.getAllRecipients());
  }

}
