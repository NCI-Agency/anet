package mil.dds.anet.integrationtest.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * This class provides a wrapper for the email data (from the fake SMTP server response) Warning:
 * The server does not support the BCC field. Warning: The server appears to append an extra empty
 * line at the end of the response's content.
 */
public class EmailResponse {
  public final ToFromData from;
  public final ToFromData to;
  public final ToFromData cc;
  public final ToFromData replyTo;
  public final String subject;
  public final String text;
  public final String textAsHtml;
  public final Instant date;
  public final ArrayNode attachments;
  public final String messageId;
  public final boolean isHtml;
  public final JsonNode header;
  public final ArrayNode headerLines;

  /**
   * Parse a response from the SMTP server.
   * 
   * @param responseData The JSON object received from the server
   */
  public EmailResponse(final JsonNode responseData) {
    final JsonNode fromNode = responseData.get("from");
    this.from = fromNode == null ? null : new ToFromData(fromNode);
    final JsonNode toNode = responseData.get("to");
    this.to = toNode == null ? null : new ToFromData(toNode);
    final JsonNode ccNode = responseData.get("cc");
    this.cc = ccNode == null ? null : new ToFromData(ccNode);
    final JsonNode replyToNode = responseData.get("replyTo");
    this.replyTo = replyToNode == null ? null : new ToFromData(replyToNode);

    this.subject = responseData.get("subject").asText();
    this.text = responseData.get("text").asText();
    this.textAsHtml = responseData.get("textAsHtml").asText();
    this.date = Instant.parse(responseData.get("date").asText());
    this.attachments = (ArrayNode) responseData.get("attachments");
    this.messageId = responseData.get("messageId").asText();
    this.isHtml = responseData.get("html").asBoolean();
    this.header = responseData.get("headers");
    this.headerLines = (ArrayNode) responseData.get("headerLines");
  }

  /**
   * This class represents the the 'to' and 'from' data fields.
   */
  public class ToFromData {
    public final List<ValueData> values;
    public final String html;
    public final String text;

    public ToFromData(final JsonNode node) {
      final ArrayNode valueArray = (ArrayNode) node.get("value");
      this.values = new ArrayList<ValueData>();
      for (int i = 0; valueArray != null && i < valueArray.size(); i++) {
        this.values.add(new ValueData(valueArray.get(i)));
      }
      this.html = node.get("html").asText();
      this.text = node.get("text").asText();
    }

    /**
     * This class represents the the 'value' data from the 'to' and 'from' fields.
     */
    public final class ValueData {
      public final String address;
      public final String name;

      public ValueData(final JsonNode node) {
        this.address = node.get("address").asText();
        this.name = node.get("name").asText();
      }
    }
  }
}
