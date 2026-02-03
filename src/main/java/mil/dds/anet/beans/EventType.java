package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;
import mil.dds.anet.views.AbstractAnetBean;

public class EventType extends AbstractAnetBean implements WithStatus {

  @GraphQLQuery
  @GraphQLInputField
  private Status status;

  @GraphQLQuery
  @GraphQLInputField
  private String name;

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  @GraphQLQuery(name = "relatedEventsCount")
  public Integer loadRelatedEventsCount() {
    if (uuid == null) {
      return 0;
    }
    return engine().getEventDao().countByEventType(uuid);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof EventType that)) {
      return false;
    }
    return Objects.equals(name, that.name);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name);
  }
}
