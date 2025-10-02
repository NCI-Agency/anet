package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EventSeries;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSeriesSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class EventSeriesResource {

  private final AnetDictionary dict;
  private final EventSeriesDao dao;

  public EventSeriesResource(AnetDictionary dict, AnetObjectEngine engine) {
    this.dict = dict;
    this.dao = engine.getEventSeriesDao();
  }

  public static boolean hasPermission(final Person user, final String orgUuid) {
    return AuthUtils.isAdmin(user) || AuthUtils.canAdministrateOrg(user, orgUuid);
  }

  public void assertPermission(final Person user, final String orgUuid) {
    if (!hasPermission(user, orgUuid)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          String.format(
              orgUuid == null ? AuthUtils.MISSING_ORG_MESSAGE : AuthUtils.UNAUTH_ORG_MESSAGE,
              dict.getDictionaryEntry("fields.eventSeries.adminOrg.label")));
    }
  }

  @GraphQLQuery(name = "eventSeries")
  public EventSeries getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final EventSeries es = dao.getByUuid(uuid);
    if (es == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event series not found");
    }
    return es;
  }

  @GraphQLQuery(name = "eventSeriesList")
  @AllowUnverifiedUsers
  public AnetBeanList<EventSeries> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") EventSeriesSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  @GraphQLMutation(name = "createEventSeries")
  public EventSeries createEventSeries(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "eventSeries") EventSeries eventSeries) {
    final Person user = DaoUtils.getUserFromContext(context);
    validateEventSeries(user, eventSeries);

    eventSeries.setDescription(Utils.isEmptyHtml(eventSeries.getDescription()) ? null
        : Utils.sanitizeHtml(eventSeries.getDescription()));

    final EventSeries created = dao.insert(eventSeries);

    AnetAuditLogger.log("Event Series {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateEventSeries")
  public Integer updateEventSeries(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "eventSeries") EventSeries eventSeries) {
    final Person user = DaoUtils.getUserFromContext(context);
    validateEventSeries(user, eventSeries);

    // Validate user has permission also for the original adminOrg
    final EventSeries existing = dao.getByUuid(eventSeries.getUuid());
    assertPermission(user, existing.getAdminOrgUuid());

    eventSeries.setDescription(Utils.isEmptyHtml(eventSeries.getDescription()) ? null
        : Utils.sanitizeHtml(eventSeries.getDescription()));

    final int numRows = dao.update(eventSeries);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process event series update");
    }

    // Update any subscriptions
    dao.updateSubscriptions(eventSeries);

    AnetAuditLogger.log("EventSeries {} updated by {}", eventSeries, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  private void validateEventSeries(final Person user, final EventSeries eventSeries) {
    if (eventSeries.getStatus() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Event series status must not be empty");
    }
    if (eventSeries.getName() == null || eventSeries.getName().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Event Series name must not be empty");
    }
    assertPermission(user, eventSeries.getAdminOrgUuid());
  }

}
