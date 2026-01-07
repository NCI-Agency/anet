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

  @GraphQLMutation(name = "createEventType")
  public EventType createEventType(@GraphQLArgument(name = "code") String code) {
    final String normalizedCode = code == null ? "" : code.toUpperCase();
    if (normalizedCode.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "EVENT_TYPE_CODE_REQUIRED");
    }

    if (dao.getByCode(normalizedCode) != null) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "EVENT_TYPE_ALREADY_EXISTS");
    }

    EventType et = new EventType();
    et.setCode(normalizedCode);
    et.setStatus(Status.ACTIVE);

    dao.insert(et);
    return et;
  }

  @GraphQLMutation(name = "updateEventTypeStatus")
  public int updateStatus(@GraphQLArgument(name = "code") String code,
      @GraphQLArgument(name = "status") Status status) {

    if (dao.getByCode(code) == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_TYPE_NOT_FOUND");
    }
    return dao.updateStatus(code, status);
  }

  @GraphQLMutation(name = "deleteEventType")
  public int deleteEventType(@GraphQLArgument(name = "code") String code) {
    if (dao.getByCode(code) == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_TYPE_NOT_FOUND");
    }
    if (dao.isInUse(code)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "EVENT_TYPE_IN_USE");
    }

    final int numRows = dao.delete(code);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "EVENT_TYPE_NOT_FOUND");
    }
    return numRows;
  }

}
