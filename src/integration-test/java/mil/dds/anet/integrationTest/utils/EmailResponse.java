package mil.dds.anet.integrationTest.utils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

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
  public final JSONArray attachments;
  public final String messageId;
  public final boolean isHtml;
  public final JSONObject header;
  public final JSONArray headerLines;

  /**
   * Parse a response from the SMTP server.
   * 
   * @param responseData The JSON object received from the server
   */
  public EmailResponse(JSONObject responseData) {
    this.from =
        responseData.keySet().contains("from") ? new ToFromData(responseData.getJSONObject("from"))
            : null;
    this.to =
        responseData.keySet().contains("to") ? new ToFromData(responseData.getJSONObject("to"))
            : null;
    this.cc =
        responseData.keySet().contains("cc") ? new ToFromData(responseData.getJSONObject("cc"))
            : null;
    this.replyTo = responseData.keySet().contains("replyTo")
        ? new ToFromData(responseData.getJSONObject("replyTo"))
        : null;

    this.subject = responseData.optString("subject");
    this.text = responseData.optString("text");
    this.textAsHtml = responseData.optString("textAsHtml");
    this.date =
        responseData.keySet().contains("date") ? Instant.parse(responseData.getString("date"))
            : null;
    this.attachments = responseData.optJSONArray("attachments");
    this.messageId = responseData.optString("messageId");
    this.isHtml = responseData.optBoolean("html");
    this.header = responseData.optJSONObject("headers");
    this.headerLines = responseData.optJSONArray("headerLines");
  }

  /**
   * This class represents the the 'to' and 'from' data fields.
   */
  public class ToFromData {
    public final List<ValueData> values;
    public final String html;
    public final String text;

    public ToFromData(JSONObject responseData) {
      this.values = new ArrayList<ValueData>();
      final JSONArray valueArray = responseData.optJSONArray("value");
      for (int i = 0; valueArray != null && i < valueArray.length(); i++) {
        this.values.add(new ValueData(valueArray.getJSONObject(i)));
      }
      this.html = responseData.optString("html");
      this.text = responseData.optString("text");
    }

    /**
     * This class represents the the 'value' data from the 'to' and 'from' fields.
     */
    public final class ValueData {
      public final String address;
      public final String name;

      public ValueData(JSONObject responseData) {
        this.address = responseData.optString("address");
        this.name = responseData.optString("name");
      }
    }
  }
}
