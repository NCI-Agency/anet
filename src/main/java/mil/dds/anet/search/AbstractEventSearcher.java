package mil.dds.anet.search;

import static mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;

import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery;
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

    if (query.isOnlyWithTasks()) {
      qb.addFromClause("INNER JOIN \"eventTasks\" et ON et.\"eventUuid\" = events.uuid");
    }

    if (!Utils.isEmptyOrNull(query.getAdminOrgUuid())) {
      addAdminOrgQuery(qb, query);
    }
    if (!Utils.isEmptyOrNull(query.getEventSeriesUuid())) {
      qb.addWhereClause("events.\"eventSeriesUuid\" = :eventSeriesUuid");
      qb.addSqlArg("eventSeriesUuid", query.getEventSeriesUuid());
    }
    if (!Utils.isEmptyOrNull(query.getHostOrgUuid())) {
      addHostOrgQuery(qb, query);
    }
    if (!Utils.isEmptyOrNull(query.getLocationUuid())) {
      addLocationQuery(qb, query);
    }
    if (!Utils.isEmptyOrNull(query.getType())) {
      qb.addWhereClause("events.type = :type");
      qb.addSqlArg("type", query.getType());
    }
    qb.addDateRangeClause("includeDateStart", "events.\"endDate\"", Comparison.AFTER,
        query.getIncludeDate(), "includeDateEnd", "events.\"startDate\"", Comparison.BEFORE,
        query.getIncludeDate());
    qb.addDateRangeClause("startDate", "events.\"endDate\"", Comparison.AFTER, query.getStartDate(),
        "endDate", "events.\"startDate\"", Comparison.BEFORE, query.getEndDate());
    addOrderByClauses(qb, query);
  }

  protected void addLocationQuery(AbstractSearchQueryBuilder<Event, EventSearchQuery> outerQb,
      EventSearchQuery query) {
    if (query.getLocationUuid().size() == 1
        && Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid().get(0))) {
      qb.addWhereClause("events.\"locationUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(outerQb, "events", new String[] {"\"locationUuid\""},
          "parent_locations", "\"locationRelationships\"", "\"childLocationUuid\"",
          "\"parentLocationUuid\"", "locationUuid", query.getLocationUuid(), true, true);
    }
  }

  protected void addHostOrgQuery(AbstractSearchQueryBuilder<Event, EventSearchQuery> outerQb,
      EventSearchQuery query) {
    if (query.getHostOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getHostOrgUuid().get(0))) {
      qb.addWhereClause("events.\"hostOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(outerQb, "events", new String[] {"\"hostOrgUuid\""}, "parent_orgs",
          "organizations", "uuid", "\"parentOrgUuid\"", "orgUuid", query.getHostOrgUuid(), true,
          true);
    }
  }

  protected void addAdminOrgQuery(AbstractSearchQueryBuilder<Event, EventSearchQuery> outerQb,
      EventSearchQuery query) {
    if (query.getAdminOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getAdminOrgUuid().get(0))) {
      qb.addWhereClause("events.\"adminOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(outerQb, "events", new String[] {"\"adminOrgUuid\""}, "parent_orgs",
          "organizations", "uuid", "\"parentOrgUuid\"", "orgUuid", query.getAdminOrgUuid(), true,
          true);
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
    qb.addAllOrderByClauses(getOrderBy(ISearchQuery.SortOrder.ASC, "events_uuid"));
  }
}
