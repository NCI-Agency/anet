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
    if (!Utils.isEmptyOrNull(query.getAdminOrgUuid())) {
      addAdminOrgQuery(query);
    }
    addOrderByClauses(qb, query);
  }

  protected void addAdminOrgQuery(EventSeriesSearchQuery query) {
    if (query.getAdminOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getAdminOrgUuid().get(0))) {
      qb.addWhereClause("\"eventSeries\".\"adminOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(null, "\"eventSeries\"", new String[] {"\"adminOrgUuid\""},
          "parent_orgs", "organizations", "uuid", "\"parentOrgUuid\"", "orgUuid",
          query.getAdminOrgUuid(), true, true);
    }
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
