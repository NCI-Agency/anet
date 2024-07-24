package mil.dds.anet.search;

import mil.dds.anet.beans.EventSeries;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSeriesSearchQuery;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.database.mappers.EventSeriesMapper;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractEventSeriesSearcher
    extends AbstractSearcher<EventSeries, EventSeriesSearchQuery> implements IEventSeriesSearcher {

  public AbstractEventSeriesSearcher(
      AbstractSearchQueryBuilder<EventSeries, EventSeriesSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<EventSeries> runSearch(EventSeriesSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new EventSeriesMapper());
  }

  @Override
  protected void buildQuery(EventSeriesSearchQuery query) {
    qb.addSelectClause(EventSeriesDao.EVENT_SERIES_FIELDS);
    qb.addFromClause("\"eventSeries\"");
    qb.addWhereClause("TRUE");
    if (!Utils.isEmptyOrNull(query.getAdminOrgUuid())) {
      addAdminOrgQuery(qb, query);
    }
    qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "eventSeries_name"));
  }

  protected void addAdminOrgQuery(
      AbstractSearchQueryBuilder<EventSeries, EventSeriesSearchQuery> outerQb,
      EventSeriesSearchQuery query) {
    if (query.getAdminOrgUuid().size() == 1
        && Organization.DUMMY_ORG_UUID.equals(query.getAdminOrgUuid().get(0))) {
      qb.addWhereClause("event.\"adminOrgUuid\" IS NULL");
    } else {
      qb.addRecursiveClause(outerQb, "\"eventSeries\"", new String[] {"\"adminOrgUuid\""},
          "parent_orgs", "organizations", "uuid", "\"parentOrgUuid\"", "orgUuid",
          query.getAdminOrgUuid(), true, true);
    }
  }
}
