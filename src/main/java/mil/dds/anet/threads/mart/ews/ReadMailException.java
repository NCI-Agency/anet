package mil.dds.anet.threads.mart.ews;

public class ReadMailException extends Exception {

  private static final long serialVersionUID = 1L;

  public ReadMailException(String message) {
    super(message);
  }

  public ReadMailException(Exception exception) {
    super(exception);
  }
}
