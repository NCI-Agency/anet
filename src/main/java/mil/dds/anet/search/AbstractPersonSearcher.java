package mil.dds.anet.search;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.utils.Utils;

public abstract class AbstractPersonSearcher extends AbstractSearcher<Person, PersonSearchQuery>
    implements IPersonSearcher {

  public AbstractPersonSearcher(AbstractSearchQueryBuilder<Person, PersonSearchQuery> qb) {
    super(qb);
  }

  @Override
  public AnetBeanList<Person> runSearch(PersonSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new PersonMapper());
  }

  protected void buildQuery(PersonSearchQuery query) {
    qb.addSelectClause(PersonDao.PERSON_FIELDS);
    qb.addFromClause("people");

    if (query.getOrgUuid() != null || query.getLocationUuid() != null
        || query.getMatchPositionName()) {
      qb.addFromClause("LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\"");
    }

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    qb.addDateClause("startDate", "people.\"endOfTourDate\"", Comparison.AFTER,
        query.getEndOfTourDateStart());
    qb.addDateClause("endDate", "people.\"endOfTourDate\"", Comparison.BEFORE,
        query.getEndOfTourDateEnd());
    qb.addEqualsClause("role", "people.role", query.getRole());
    qb.addInClause("statuses", "people.status", query.getStatus());
    qb.addEqualsClause("rank", "people.rank", query.getRank());
    qb.addEqualsClause("country", "people.country", query.getCountry());
    qb.addEqualsClause("pendingVerification", "people.\"pendingVerification\"",
        query.getPendingVerification());

    if (query.getOrgUuid() != null) {
      addOrgUuidQuery(query);
    }

    qb.addEqualsClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(PersonSearchQuery query);

  protected abstract void addOrgUuidQuery(PersonSearchQuery query);

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PersonSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "people", "\"createdAt\""));
        break;
      case RANK:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "people", "rank"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "people", "name"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "people", "uuid"));
  }

}
