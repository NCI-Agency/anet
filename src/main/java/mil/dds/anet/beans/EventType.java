package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.Objects;

public class EventType implements WithStatus {

  @GraphQLQuery
  private String code;

  @GraphQLQuery
  private Status status;

  @GraphQLQuery
  private Instant createdAt;

  @GraphQLQuery
  private Instant updatedAt;

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    EventType eventType = (EventType) o;
    return Objects.equals(code, eventType.code);
  }

  @Override
  public int hashCode() {
    return Objects.hash(code);
  }
}
