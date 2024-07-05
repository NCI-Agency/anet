package mil.dds.anet.search;

import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.database.mappers.EventMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractEventSearcher extends AbstractSearcher<Event, EventSearchQuery>
    implements IEventSearcher {

  public AbstractEventSearcher(AbstractSearchQueryBuilder<Event, EventSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Event> runSearch(EventSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new EventMapper());
  }

  @Override
  protected void buildQuery(EventSearchQuery query) {
    qb.addSelectClause(EventDao.EVENT_FIELDS);
    qb.addFromClause("\"events\"");
    qb.addWhereClause("TRUE");

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
    if (query.getIncludeDate() != null) {
      qb.addWhereClause(":date >= events.\"startDate\" AND :date <= events.\"endDate\"");
      DaoUtils.addInstantAsLocalDateTime(qb.sqlArgs, "date", query.getIncludeDate());
    }
    if (query.getStartDate() != null) {
      qb.addWhereClause("events.\"startDate\" >= :startDate");
      DaoUtils.addInstantAsLocalDateTime(qb.sqlArgs, "startDate", query.getStartDate());
    }
    if (query.getEndDate() != null) {
      qb.addWhereClause("events.\"startDate\" <= :endDate");
      DaoUtils.addInstantAsLocalDateTime(qb.sqlArgs, "endDate", query.getEndDate());
    }
    qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "events_name"));
  }

  protected void addLocationQuery(AbstractSearchQueryBuilder<Event, EventSearchQuery> outerQb,
      EventSearchQuery query) {
    if (query.getLocationUuid().size() == 1
        && Location.DUMMY_LOCATION_UUID.equals(query.getLocationUuid().get(0))) {
      qb.addWhereClause("event.\"locationUuid\" IS NULL");
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
      qb.addWhereClause("event.\"hostOrgUuid\" IS NULL");
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
      qb.addWhereClause("event.\"adminOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(outerQb, "events", new String[] {"\"adminOrgUuid\""}, "parent_orgs",
          "organizations", "uuid", "\"parentOrgUuid\"", "orgUuid", query.getAdminOrgUuid(), true,
          true);
    }
  }
}
