package mil.dds.anet.search;

import static mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import static mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;

import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.database.mappers.EventMapper;
import mil.dds.anet.utils.Utils;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractEventSearcher extends AbstractSearcher<Event, EventSearchQuery>
    implements IEventSearcher {

  public AbstractEventSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<Event, EventSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<Event> runSearch(EventSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new EventMapper());
  }

  @Override
  protected void buildQuery(EventSearchQuery query) {
    qb.addSelectClause(EventDao.EVENT_FIELDS);
    qb.addFromClause("\"events\"");
    qb.addEnumEqualsClause("status", "events.status", query.getStatus());

    if (query.getEmailNetwork() != null) {
      // Should never match
      qb.addWhereClause("FALSE");
    }

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          engine().getEventDao().getSubscriptionUpdate(null)));
    }

    if (!Utils.isEmptyOrNull(query.getEventSeriesUuid())) {
      qb.addStringEqualsClause("eventSeriesUuid", "events.\"eventSeriesUuid\"",
          query.getEventSeriesUuid());
    }
    if (!Utils.isEmptyOrNull(query.getOwnerOrgUuid())) {
      addOwnerOrgQuery(query);
    }
    if (!Utils.isEmptyOrNull(query.getHostOrgUuid())) {
      addHostOrgQuery(query);
    }
    if (!Utils.isEmptyOrNull(query.getAdminOrgUuid())) {
      addAdminOrgQuery(query);
    }
    if (!Utils.isEmptyOrNull(query.getLocationUuid())) {
      addLocationQuery(query);
    }
    if (!Utils.isEmptyOrNull(query.getTaskUuid())) {
      addTaskQuery(query);
    }
    if (!Utils.isEmptyOrNull(query.getType())) {
      qb.addStringEqualsClause("type", "events.type", query.getType());
    }
    qb.addDateRangeClause("includeDateStart", "events.\"endDate\"", Comparison.AFTER,
        query.getIncludeDate(), "includeDateEnd", "events.\"startDate\"", Comparison.BEFORE,
        query.getIncludeDate());
    qb.addDateRangeClause("startDate", "events.\"endDate\"", Comparison.AFTER, query.getStartDate(),
        "endDate", "events.\"startDate\"", Comparison.BEFORE, query.getEndDate());
    addOrderByClauses(qb, query);
  }

  protected void addLocationQuery(EventSearchQuery query) {
    if (query.getLocationUuid().size() == 1
        && Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid().get(0))) {
      qb.addWhereClause("events.\"locationUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(null, "events", new String[] {"\"locationUuid\""}, "parent_locations",
          "\"locationRelationships\"", "\"childLocationUuid\"", "\"parentLocationUuid\"",
          "locationUuid", query.getLocationUuid(), true, true, null);
    }
  }

  protected void addOwnerOrgQuery(EventSearchQuery query) {
    if (query.getOwnerOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getOwnerOrgUuid().get(0))) {
      qb.addWhereClause("events.\"ownerOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(null, "events", new String[] {"\"ownerOrgUuid\""}, "parent_owner_orgs",
          "organizations", "uuid", "\"parentOrgUuid\"", "ownerOrgUuid", query.getOwnerOrgUuid(),
          true, true, null);
    }
  }

  protected void addHostOrgQuery(EventSearchQuery query) {
    if (query.getHostOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getHostOrgUuid().get(0))) {
      qb.addWhereClause("events.\"hostOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(null, "events", new String[] {"\"hostOrgUuid\""}, "parent_host_orgs",
          "organizations", "uuid", "\"parentOrgUuid\"", "hostOrgUuid", query.getHostOrgUuid(), true,
          true, null);
    }
  }

  protected void addAdminOrgQuery(EventSearchQuery query) {
    if (query.getAdminOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getAdminOrgUuid().get(0))) {
      qb.addWhereClause("events.\"adminOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(null, "events", new String[] {"\"adminOrgUuid\""}, "parent_admin_orgs",
          "organizations", "uuid", "\"parentOrgUuid\"", "adminOrgUuid", query.getAdminOrgUuid(),
          true, true, null);
    }
  }

  protected void addTaskQuery(EventSearchQuery query) {
    qb.addFromClause("INNER JOIN \"eventTasks\" et ON et.\"eventUuid\" = events.uuid");
    if (query.getTaskUuid().size() == 1
        && Task.DUMMY_TASK_UUID.equals(query.getTaskUuid().get(0))) {
      qb.addWhereClause("et.\"taskUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(null, "et", "\"taskUuid\"", "parent_tasks", "tasks",
          "\"parentTaskUuid\"", "parentTaskUuid", query.getTaskUuid(), true, null);
    }
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, EventSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "events_createdAt"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "events_name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "events_uuid"));
  }
}
