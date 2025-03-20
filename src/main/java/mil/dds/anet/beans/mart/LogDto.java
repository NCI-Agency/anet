package mil.dds.anet.beans.mart;

import java.time.Instant;

public class LogDto {
  /**
   * Different states of a log
   */
  public enum LogState {

    PENDING(1), SENT(2), FAILED_TO_SEND_EMAIL(3);

    private final int code;

    LogState(int code) {
      this.code = code;
    }

    public int getCode() {
      return code;
    }
  }

  private Long sequence;
  private String reportUuid;
  private Instant submittedAt;
  private int state;
  private String errors;

  public Long getSequence() {
    return sequence;
  }

  public void setSequence(Long sequence) {
    this.sequence = sequence;
  }

  public String getReportUuid() {
    return reportUuid;
  }

  public void setReportUuid(String reportUuid) {
    this.reportUuid = reportUuid;
  }

  public Instant getSubmittedAt() {
    return submittedAt;
  }

  public void setSubmittedAt(Instant submittedAt) {
    this.submittedAt = submittedAt;
  }

  public int getState() {
    return state;
  }

  public void setState(int state) {
    this.state = state;
  }

  public String getErrors() {
    return errors;
  }

  public void setErrors(String errors) {
    this.errors = errors;
  }
}
