package mil.dds.anet.test.email;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Properties;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import mil.dds.anet.test.email.EmailResponse;
import org.apache.commons.io.IOUtils;
import org.json.JSONArray;

/**
 * This class provides a wrapper for the fake SMTP server's API
 */
public class FakeSmtpServer {
  // TODO: Read settings from configuration
  private final String smtpIP = "localhost";
  private final String smtpPort = "1025";

  private final String httpIP = "localhost";
  private final String httpPort = "1080";

  /**
   * Retrieves all emails from the server
   * 
   * @return All emails from the server
   * @throws IOException If the request fails
   */
  public List<EmailResponse> requestAllEmailsFromServer() throws IOException {
    return requestEmailsFromServer(new QueryFilter(null, null, null, null));
  }

  /**
   * Retrieves all emails from the server according to a filter
   * 
   * @param queryFilter The filter to use
   * @return All filtered emails from the server
   * @throws IOException If the request fails
   */
  public List<EmailResponse> requestEmailsFromServer(QueryFilter queryFilter) throws IOException {
    String request = queryFilter.createFilteredServerQuery(this.httpIP, this.httpPort);
    String response = sendServerRequest(request, "GET");
    System.out.println(response);
    return parseServeResponse(response);
  }

  /**
   * Clears all emails from the server
   */
  public void clearEmailServer() throws IOException {
    String request = String.format("http://%s:%s/api/emails", this.httpIP, this.httpPort);
    sendServerRequest(request, "DELETE");
  }

  private static List<EmailResponse> parseServeResponse(String serverResponse) {
    JSONArray response = new JSONArray(serverResponse);
    List<EmailResponse> emails = new ArrayList<EmailResponse>();

    for (int i = 0; i < response.length(); i++) {
      emails.add(new EmailResponse(response.getJSONObject(i)));
    }

    return emails;
  }

  private static String sendServerRequest(String request, String requestType) throws IOException {
    URL url = new URL(request);
    HttpURLConnection httpConnection = (HttpURLConnection) url.openConnection();
    httpConnection.setDoOutput(true);
    httpConnection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
    httpConnection.setRequestProperty("Accept-Charset", StandardCharsets.UTF_8.name());
    httpConnection.setRequestMethod(requestType);
    httpConnection.connect();
    InputStream response = httpConnection.getInputStream();
    return IOUtils.toString(response, StandardCharsets.UTF_8.name());
  }

  /**
   * Sends an email to the server Warning: The server does not support the BCC field
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
  public void sendEmail(String to, String from, String replyTo, String cc, String subject,
      String msg, Date date) throws MessagingException {
    Properties properties = System.getProperties();

    properties.setProperty("mail.smtp.host", this.smtpIP);
    properties.setProperty("mail.smtp.port", this.smtpPort);

    Session session = Session.getDefaultInstance(properties);

    Message message = new MimeMessage(session);
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

    Transport.send(message);
  }

  /**
   * A filter for the queries to the email server
   */
  public class QueryFilter {
    public final String from;
    public final String to;
    public final String since;
    public final String until;

    public QueryFilter(String from, String to, String since, String until) {
      this.from = from;
      this.to = to;
      this.since = since;
      this.until = until;
    }

    public String createFilteredServerQuery(String serverHost, String serverPort) {
      String fromFilter = this.from == null ? "" : "?from=" + this.from;
      String toFilter = this.to == null ? "" : "?to=" + this.to;
      String sinceFilter = this.since == null ? "" : "?since=" + this.since;
      String untilFilter = this.until == null ? "" : "?until=" + this.until;

      return String.format("http://%s:%s/api/emails%s%s%s%s", serverHost, serverPort, fromFilter,
          toFilter, sinceFilter, untilFilter);
    }
  }

}
