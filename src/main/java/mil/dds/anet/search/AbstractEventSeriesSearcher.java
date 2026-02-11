package mil.dds.anet.search;

import static mil.dds.anet.beans.search.ISearchQuery.SortOrder;

import mil.dds.anet.beans.EventSeries;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSeriesSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.database.mappers.EventSeriesMapper;
import mil.dds.anet.utils.Utils;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractEventSeriesSearcher
    extends AbstractSearcher<EventSeries, EventSeriesSearchQuery> implements IEventSeriesSearcher {

  public AbstractEventSeriesSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<EventSeries, EventSeriesSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<EventSeries> runSearch(EventSeriesSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new EventSeriesMapper());
  }

  @Override
  protected void buildQuery(EventSeriesSearchQuery query) {
    qb.addSelectClause(EventSeriesDao.EVENT_SERIES_FIELDS);
    qb.addFromClause("\"eventSeries\"");
    qb.addEnumEqualsClause("status", "\"eventSeries\".status", query.getStatus());

    if (query.getEmailNetwork() != null) {
      // Should never match
      qb.addWhereClause("FALSE");
    }

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          engine().getEventSeriesDao().getSubscriptionUpdate(null, false)));
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

    if (!Utils.isEmptyOrNull(query.getAnyOrgUuid())) {
      addAnyOrgQuery(query);
    }

    if (!Utils.isEmptyOrNull(query.getEventTaskUuid())) {
      addEventTaskUuidQuery(query);
    }

    addOrderByClauses(qb, query);
  }

  protected void addOwnerOrgQuery(EventSeriesSearchQuery query) {
    if (query.getOwnerOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getOwnerOrgUuid().get(0))) {
      qb.addWhereClause("\"eventSeries\".\"ownerOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(null, "\"eventSeries\"", new String[] {"\"ownerOrgUuid\""},
          "parent_owner_orgs", "organizations", "uuid", "\"parentOrgUuid\"", "ownerOrgUuid",
          query.getOwnerOrgUuid(), true, true, null);
    }
  }

  protected void addHostOrgQuery(EventSeriesSearchQuery query) {
    qb.addFromClause(
        "INNER JOIN \"eventSeriesHostRelatedObjects\" hosts ON hosts.\"relatedObjectType\" = 'organizations' AND hosts.\"eventSeriesUuid\" = \"eventSeries\".uuid");
    if (query.getHostOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getHostOrgUuid().get(0))) {
      qb.addWhereClause("hosts.\"relatedObjectUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(null, "hosts", new String[] {"\"relatedObjectUuid\""},
          "parent_host_orgs", "organizations", "\"parentOrgUuid\"", "uuid", "hostOrgUuid",
          query.getHostOrgUuid(), false, true, null);
    }
  }

  protected void addAdminOrgQuery(EventSeriesSearchQuery query) {
    if (query.getAdminOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getAdminOrgUuid().get(0))) {
      qb.addWhereClause("\"eventSeries\".\"adminOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(null, "\"eventSeries\"", new String[] {"\"adminOrgUuid\""},
          "parent_admin_orgs", "organizations", "uuid", "\"parentOrgUuid\"", "adminOrgUuid",
          query.getAdminOrgUuid(), true, true, null);
    }
  }

  private void addAnyOrgQuery(EventSeriesSearchQuery query) {
    qb.addFromClause("LEFT JOIN events ON \"eventSeries\".uuid = events.\"eventSeriesUuid\"");
    qb.addWhereClause("(\"eventSeries\".\"ownerOrgUuid\" IN ( <anyOrgUuid> )"
        + " OR \"eventSeries\".\"adminOrgUuid\" IN ( <anyOrgUuid> )"
        + " OR events.\"ownerOrgUuid\" IN ( <anyOrgUuid> )"
        + " OR events.\"adminOrgUuid\" IN ( <anyOrgUuid> )" + " OR EXISTS ("
        + "     SELECT 1 FROM \"eventSeriesHostRelatedObjects\" es_hosts"
        + "     WHERE es_hosts.\"eventSeriesUuid\" = \"eventSeries\".uuid"
        + "     AND es_hosts.\"relatedObjectType\" = 'organizations'"
        + "     AND es_hosts.\"relatedObjectUuid\" IN ( <anyOrgUuid> )" + " )" + " OR EXISTS ("
        + "     SELECT 1 FROM \"eventHostRelatedObjects\" e_hosts"
        + "     WHERE e_hosts.\"eventUuid\" = events.uuid"
        + "     AND e_hosts.\"relatedObjectType\" = 'organizations'"
        + "     AND e_hosts.\"relatedObjectUuid\" IN ( <anyOrgUuid> )" + " )" + ")");
    qb.addListArg("anyOrgUuid", query.getAnyOrgUuid());
  }

  private void addEventTaskUuidQuery(EventSeriesSearchQuery query) {
    qb.addFromClause("JOIN events ON \"eventSeries\".uuid = events.\"eventSeriesUuid\"");
    qb.addFromClause("JOIN \"eventTasks\" ON \"events\".uuid = \"eventTasks\".\"eventUuid\"");
    qb.addInListClause("eventTaskUuid", "\"eventTasks\".\"taskUuid\"", query.getEventTaskUuid());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      EventSeriesSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "eventSeries_createdAt"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "eventSeries_name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "eventSeries_uuid"));
  }
}
