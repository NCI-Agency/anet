package mil.dds.anet.search;

import com.google.common.collect.Sets;
import java.util.Map;
import java.util.Set;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractPersonSearcher extends AbstractSearcher<Person, PersonSearchQuery>
    implements IPersonSearcher {

  private static final Set<String> ALL_FIELDS = Sets.newHashSet(PersonDao.allFields);
  private static final Set<String> MINIMAL_FIELDS = Sets.newHashSet(PersonDao.minimalFields);
  private static final Map<String, String> FIELD_MAPPING = Map.of("country", "countryUuid");

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
    qb.addFromClause("people");

    if (!Utils.isEmptyOrNull(query.getOrgUuid()) || !Utils.isEmptyOrNull(query.getLocationUuid())
        || query.getMatchPositionName() || !Utils.isEmptyOrNull(query.getPositionType())) {
      qb.addFromClause("LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\"");
    }

    if (hasTextQuery(query)) {
      addTextQuery(query);
    }

    if (query.getUser() != null && query.getSubscribed()) {
      qb.addWhereClause(Searcher.getSubscriptionReferences(query.getUser(), qb.getSqlArgs(),
          AnetObjectEngine.getInstance().getPersonDao().getSubscriptionUpdate(null)));
    }

    qb.addDateRangeClause("startDate", "people.\"endOfTourDate\"", Comparison.AFTER,
        query.getEndOfTourDateStart(), "endDate", "people.\"endOfTourDate\"", Comparison.BEFORE,
        query.getEndOfTourDateEnd());
    qb.addEnumEqualsClause("status", "people.status", query.getStatus());
    qb.addStringEqualsClause("rank", "people.rank", query.getRank());
    qb.addStringEqualsClause("countryUuid", "people.\"countryUuid\"", query.getCountryUuid());
    qb.addObjectEqualsClause("pendingVerification", "people.\"pendingVerification\"",
        query.getPendingVerification());

    if (!Utils.isEmptyOrNull(query.getOrgUuid())) {
      if (RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy())
          || RecurseStrategy.PARENTS.equals(query.getOrgRecurseStrategy())) {
        qb.addRecursiveClause(null, "positions", "\"organizationUuid\"", "parent_orgs",
            "organizations", "\"parentOrgUuid\"", "orgUuid", query.getOrgUuid(),
            RecurseStrategy.CHILDREN.equals(query.getOrgRecurseStrategy()));
      } else {
        qb.addInListClause("orgUuid", "positions.\"organizationUuid\"", query.getOrgUuid());
      }
    }

    if (!Utils.isEmptyOrNull(query.getLocationUuid())) {
      addLocationUuidQuery(query);
    }

    if (query.getHasBiography() != null) {
      if (query.getHasBiography()) {
        qb.addWhereClause("people.biography IS NOT NULL");
      } else {
        qb.addWhereClause("people.biography IS NULL");
      }
    }

    qb.addInClause("types", "positions.type", query.getPositionType());

    if (Boolean.TRUE.equals(query.isInMyReports())) {
      qb.addSelectClause("\"inMyReports\".max AS \"inMyReports_max\"");
      qb.addFromClause("JOIN ("
          + "  SELECT \"reportPeople\".\"personUuid\" AS uuid, MAX(reports.\"createdAt\") AS max"
          + "  FROM reports"
          + "  JOIN \"reportPeople\" ON reports.uuid = \"reportPeople\".\"reportUuid\""
          + "  WHERE reports.uuid IN (SELECT \"reportUuid\" FROM \"reportPeople\""
          + "    WHERE \"isAuthor\" = :isAuthor AND \"personUuid\" = :userUuid)"
          + "  AND \"reportPeople\".\"personUuid\" != :userUuid"
          + "  GROUP BY \"reportPeople\".\"personUuid\""
          + ") \"inMyReports\" ON people.uuid = \"inMyReports\".uuid");
      qb.addSqlArg("isAuthor", true);
      qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
    }

    if (query.getEmailNetwork() != null) {
      qb.addFromClause("JOIN \"emailAddresses\" \"pplEmail\""
          + " ON \"pplEmail\".\"relatedObjectType\" = '" + PersonDao.TABLE_NAME + "'"
          + " AND \"pplEmail\".\"relatedObjectUuid\" = people.uuid");
      qb.addStringEqualsClause("emailNetwork", "\"pplEmail\".network", query.getEmailNetwork());
      qb.addIsNotNullOrEmptyClause("\"pplEmail\".address");
    }

    addOrderByClauses(qb, query);
  }

  protected void addLocationUuidQuery(PersonSearchQuery query) {
    if (ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy())
        || ISearchQuery.RecurseStrategy.PARENTS.equals(query.getLocationRecurseStrategy())) {
      qb.addRecursiveClause(null, "positions", new String[] {"\"locationUuid\""},
          "parent_locations", "\"locationRelationships\"", "\"childLocationUuid\"",
          "\"parentLocationUuid\"", "locationUuid", query.getLocationUuid(),
          ISearchQuery.RecurseStrategy.CHILDREN.equals(query.getLocationRecurseStrategy()), true);
    } else {
      qb.addInListClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());
    }
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PersonSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "people_createdAt"));
        break;
      case RANK:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "people_rank"));
        break;
      case RECENT:
        if (Boolean.TRUE.equals(query.isInMyReports())) {
          // Otherwise the JOIN won't exist
          qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "inMyReports_max"));
        }
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "people_name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "people_uuid"));
  }

}
