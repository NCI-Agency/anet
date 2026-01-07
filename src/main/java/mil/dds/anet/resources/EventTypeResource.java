package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EventType;
import mil.dds.anet.beans.WithStatus.Status;
import mil.dds.anet.database.EventTypeDao;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class EventTypeResource {

  private final EventTypeDao dao;

  public EventTypeResource(AnetObjectEngine engine) {
    this.dao = engine.getEventTypeDao();
  }

  @GraphQLQuery(name = "eventTypes")
  public List<EventType> getAll() {
    return dao.getAll();
  }

  @GraphQLMutation(name = "updateEventTypeStatus")
  public int updateStatus(
      @GraphQLArgument(name = "code") String code,
      @GraphQLArgument(name = "status") Status status) {
    return dao.updateStatus(code, status);
  }

}
