package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import mil.dds.anet.beans.EventType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.EventTypeDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class EventTypeResource {

  private final EventTypeDao dao;

  public EventTypeResource(EventTypeDao dao) {
    this.dao = dao;
  }

  @GraphQLQuery(name = "eventTypes")
  public List<EventType> getAll() {
    return dao.getAll();
  }

  @GraphQLMutation(name = "createEventType")
  public EventType createEventType(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "eventType") EventType eventType) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    if (Utils.isEmptyOrNull(Utils.trimStringReturnNull(eventType.getName()))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Please enter a name for the event type");
    }

    try {
      dao.insert(eventType);
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, "Duplicate event type name");
    }
    return eventType;
  }

  @GraphQLMutation(name = "updateEventType")
  public int updateStatus(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "eventType") EventType eventType) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    return dao.update(eventType);
  }

  @GraphQLMutation(name = "deleteEventType")
  public int deleteEventType(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String uuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    try {
      return dao.delete(uuid);
    } catch (UnableToExecuteStatementException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event type is in use");
    }
  }

}
