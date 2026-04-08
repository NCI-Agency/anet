package mil.dds.anet.test.integration.utils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;

/**
 * This class provides a wrapper for the email data (from the fake SMTP server response).
 */
public class EmailResponse {
  public final ToFromData from;
  public final ToFromData to;
  public final ToFromData cc;
  public final ToFromData replyTo;
  public final String subject;
  public final String text;
  public final Instant date;
  public final Integer attachments;
  public final String messageId;

  /**
   * Parse a response from the SMTP server.
   *
   * @param responseData The JSON object received from the server
   */
  public EmailResponse(final JsonNode responseData) {
    this.from = Optional.ofNullable(responseData.get("From")).map(ToFromData::new).orElse(null);
    this.to = Optional.ofNullable(responseData.get("To")).map(ToFromData::new).orElse(null);
    this.cc = Optional.ofNullable(responseData.get("Cc")).map(ToFromData::new).orElse(null);
    this.replyTo =
        Optional.ofNullable(responseData.get("ReplyTo")).map(ToFromData::new).orElse(null);

    this.subject =
        Optional.ofNullable(responseData.get("Subject")).map(JsonNode::asString).orElse(null);
    this.text =
        Optional.ofNullable(responseData.get("Snippet")).map(JsonNode::asString).orElse(null);
    this.date = Optional.ofNullable(responseData.get("Created"))
        .map(x -> Instant.parse(x.asString())).orElse(null);
    this.attachments =
        Optional.ofNullable(responseData.get("Attachments")).map(JsonNode::asInt).orElse(null);
    this.messageId =
        Optional.ofNullable(responseData.get("MessageID")).map(JsonNode::asString).orElse(null);
  }

  /**
   * This class represents the 'to' and 'from' data fields.
   */
  public static class ToFromData {
    public final List<ValueData> values;

    public ToFromData(final JsonNode node) {
      values = new ArrayList<>();
      if (node != null && !node.isNull()) {
        if (node.isArray()) {
          final ArrayNode valueArray = node.asArray();
          for (int i = 0; i < valueArray.size(); i++) {
            values.add(new ValueData(valueArray.get(i)));
          }
        } else {
          values.add(new ValueData(node));
        }
      }
    }

    /**
     * This class represents the 'value' data from the 'to' and 'from' fields.
     */
    public static final class ValueData {
      public final String address;
      public final String name;

      public ValueData(final JsonNode node) {
        this.address =
            Optional.ofNullable(node.get("Address")).map(JsonNode::asString).orElse(null);
        this.name = Optional.ofNullable(node.get("Name")).map(JsonNode::asString).orElse(null);
      }
    }
  }
}
