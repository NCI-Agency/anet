package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;
import mil.dds.anet.views.AbstractAnetBean;

public class EventType extends AbstractAnetBean implements WithStatus {

  @GraphQLQuery
  private String code;

  @GraphQLQuery
  private Status status;

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

  @GraphQLQuery(name = "relatedEventsCount")
  public Integer getRelatedEventsCount() {
    if (code == null) {
      return 0;
    }
    return engine().getEventDao().countByType(code);
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
