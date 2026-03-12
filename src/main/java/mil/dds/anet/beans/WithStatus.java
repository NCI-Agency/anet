package mil.dds.anet.beans;

public interface WithStatus {

  enum Status {
    ACTIVE, INACTIVE
  }

  Status getStatus();

  void setStatus(Status status);
}
