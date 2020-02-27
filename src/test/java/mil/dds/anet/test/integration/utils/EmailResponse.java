package mil.dds.anet.test.integration.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
    this.from =
        Optional.ofNullable(responseData.get("from")).map(x -> new ToFromData(x)).orElse(null);
    this.to = Optional.ofNullable(responseData.get("to")).map(x -> new ToFromData(x)).orElse(null);
    this.cc = Optional.ofNullable(responseData.get("cc")).map(x -> new ToFromData(x)).orElse(null);
    this.replyTo =
        Optional.ofNullable(responseData.get("replyTo")).map(x -> new ToFromData(x)).orElse(null);

    this.subject =
        Optional.ofNullable(responseData.get("subject")).map(x -> x.asText()).orElse(null);
    this.text = Optional.ofNullable(responseData.get("text")).map(x -> x.asText()).orElse(null);
    this.textAsHtml =
        Optional.ofNullable(responseData.get("textAsHtml")).map(x -> x.asText()).orElse(null);
    this.date = Optional.ofNullable(responseData.get("date")).map(x -> Instant.parse(x.asText()))
        .orElse(null);
    this.attachments =
        Optional.ofNullable(responseData.get("attachments")).map(x -> (ArrayNode) x).orElse(null);
    this.messageId =
        Optional.ofNullable(responseData.get("messageId")).map(x -> x.asText()).orElse(null);
    this.isHtml =
        Optional.ofNullable(responseData.get("html")).map(x -> x.asBoolean()).orElse(null);
    this.header = responseData.get("headers");
    this.headerLines =
        Optional.ofNullable(responseData.get("headerLines")).map(x -> (ArrayNode) x).orElse(null);
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
