package mil.dds.anet.search;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractPersonSearcher extends AbstractSearcher<Person, PersonSearchQuery>
    implements IPersonSearcher {

  public AbstractPersonSearcher(AbstractSearchQueryBuilder<Person, PersonSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Person> runSearch(PersonSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new PersonMapper());
  }

  protected void buildQuery(PersonSearchQuery query) {
    qb.addSelectClause(PersonDao.PERSON_FIELDS);
    qb.addTotalCount();
    qb.addFromClause("people");

    if (query.getOrgUuid() != null || query.getLocationUuid() != null
        || query.getMatchPositionName()) {
      qb.addFromClause("LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\"");
    }

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    qb.addDateRangeClause("startDate", "people.\"endOfTourDate\"", Comparison.AFTER,
        query.getEndOfTourDateStart(), "endDate", "people.\"endOfTourDate\"", Comparison.BEFORE,
        query.getEndOfTourDateEnd());
    qb.addEqualsClause("role", "people.role", query.getRole());
    qb.addInClause("statuses", "people.status", query.getStatus());
    qb.addEqualsClause("rank", "people.rank", query.getRank());
    qb.addEqualsClause("country", "people.country", query.getCountry());
    qb.addEqualsClause("pendingVerification", "people.\"pendingVerification\"",
        query.getPendingVerification());

    if (query.getOrgUuid() != null) {
      if (query.getIncludeChildOrgs()) {
        qb.addRecursiveClause(null, "positions", "\"organizationUuid\"", "parent_orgs",
            "organizations", "\"parentOrgUuid\"", "orgUuid", query.getOrgUuid());
      } else {
        qb.addEqualsClause("orgUuid", "positions.\"organizationUuid\"", query.getOrgUuid());
      }
    }

    qb.addEqualsClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());

    if (query.getHasBiography() != null) {
      if (query.getHasBiography()) {
        qb.addWhereClause("people.biography IS NOT NULL");
      } else {
        qb.addWhereClause("people.biography IS NULL");
      }
    }

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(PersonSearchQuery query);

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PersonSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "people", "\"createdAt\""));
        break;
      case RANK:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "people", "rank"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "people", "name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "people", "uuid"));
  }

}
