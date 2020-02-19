package mil.dds.anet.search;

import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Sets;
import java.util.Map;
import java.util.Set;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractPersonSearcher extends AbstractSearcher<Person, PersonSearchQuery>
    implements IPersonSearcher {

  private static final Set<String> ALL_FIELDS = Sets.newHashSet(PersonDao.allFields);
  private static final Set<String> MINIMAL_FIELDS = Sets.newHashSet(PersonDao.minimalFields);
  private static final Map<String, String> FIELD_MAPPING = ImmutableMap.of();

  public AbstractPersonSearcher(AbstractSearchQueryBuilder<Person, PersonSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Person> runSearch(Set<String> subFields, PersonSearchQuery query) {
    buildQuery(subFields, query);
    return qb.buildAndRun(getDbHandle(), query, new PersonMapper());
  }

  @Override
  protected void buildQuery(PersonSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected String getTableFields(Set<String> subFields) {
    return getTableFields(PersonDao.TABLE_NAME, ALL_FIELDS, MINIMAL_FIELDS, FIELD_MAPPING,
        subFields);
  }

  protected void buildQuery(Set<String> subFields, PersonSearchQuery query) {
    qb.addSelectClause(getTableFields(subFields));
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
      if (RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy())
          || RecurseStrategy.PARENTS.equals(query.getOrgRecurseStrategy())) {
        qb.addRecursiveClause(null, "positions", "\"organizationUuid\"", "parent_orgs",
            "organizations", "\"parentOrgUuid\"", "orgUuid", query.getOrgUuid(),
            RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy()));
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

    if (Boolean.TRUE.equals(query.isInMyReports())) {
      qb.addFromClause("JOIN ("
          + "  SELECT \"reportPeople\".\"personUuid\" AS uuid, MAX(reports.\"createdAt\") AS max"
          + "  FROM reports"
          + "  JOIN \"reportPeople\" ON reports.uuid = \"reportPeople\".\"reportUuid\""
          + "  WHERE reports.\"authorUuid\" = :userUuid AND \"reportPeople\".\"personUuid\" != :userUuid"
          + "  GROUP BY \"reportPeople\".\"personUuid\""
          + ") \"inMyReports\" ON people.uuid = \"inMyReports\".uuid");
      qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
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
      case RECENT:
        if (Boolean.TRUE.equals(query.isInMyReports())) {
          // Otherwise the JOIN won't exist
          qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "\"inMyReports\"", "max"));
        }
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "people", "name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "people", "uuid"));
  }

}
