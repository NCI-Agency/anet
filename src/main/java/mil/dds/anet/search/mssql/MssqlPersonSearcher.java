package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearchQueryBuilder.Comparison;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlPersonSearcher extends AbstractSearcher implements IPersonSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Person> runSearch(PersonSearchQuery query) {
    final MssqlSearchQueryBuilder<Person, PersonSearchQuery> qb =
        new MssqlSearchQueryBuilder<Person, PersonSearchQuery>("MssqlPersonSearch");
    qb.addSelectClause(PersonDao.PERSON_FIELDS);
    qb.addSelectClause("count(*) over() as totalCount");
    qb.addFromClause("people");

    if (query.getOrgUuid() != null || query.getLocationUuid() != null
        || query.getMatchPositionName()) {
      qb.addFromClause("LEFT JOIN positions ON people.uuid = positions.currentPersonUuid");
    }

    final boolean doSoundex = query.isTextPresent() && !query.isSortByPresent();
    final String text = query.getText();
    if (doSoundex) {
      qb.addSelectClause("EXP(SUM(LOG(1.0/(5-DIFFERENCE(name_token.value, search_token.value)))))"
          + " AS search_rank");
      qb.addFromClause("CROSS APPLY STRING_SPLIT(people.name, ' ') AS name_token"
          + " CROSS APPLY STRING_SPLIT(:freetextQuery, ' ') AS search_token");
      qb.addSqlArg("freetextQuery", text);
      // Add grouping needed for soundex score
      qb.addGroupByClause(PersonDao.PERSON_FIELDS_NOAS);
    } else if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
      // so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now.
      // See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      qb.addSelectClause("ISNULL(c_people.rank, 0) + ISNULL(f_people.rank, 0)"
          + (query.getMatchPositionName() ? " + ISNULL(c_positions.rank, 0)" : "")
          + " AS search_rank");
      qb.addFromClause(
          "LEFT JOIN CONTAINSTABLE (people, (name, emailAddress, biography), :containsQuery) c_people"
              + " ON people.uuid = c_people.[Key]"
              + " LEFT JOIN FREETEXTTABLE(people, (name, biography), :freetextQuery) f_people"
              + " ON people.uuid = f_people.[Key]");
      final StringBuilder whereRank =
          new StringBuilder("(c_people.rank IS NOT NULL OR f_people.rank IS NOT NULL");
      if (query.getMatchPositionName()) {
        qb.addFromClause("LEFT JOIN CONTAINSTABLE(positions, (name), :containsQuery) c_positions"
            + " ON positions.uuid = c_positions.[Key]");
        whereRank.append(" OR c_positions.rank IS NOT NULL OR positions.code LIKE :likeQuery");
        qb.addSqlArg("likeQuery", Utils.prepForLikeQuery(text) + "%");
      }
      whereRank.append(")");
      qb.addWhereClause(whereRank.toString());
      qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
      qb.addSqlArg("freetextQuery", text);
    }

    qb.addDateClause("startDate", "people.endOfTourDate", Comparison.AFTER,
        query.getEndOfTourDateStart());
    qb.addDateClause("endDate", "people.endOfTourDate", Comparison.BEFORE,
        query.getEndOfTourDateEnd());
    qb.addEqualsClause("role", "people.role", query.getRole());
    qb.addInClause("statuses", "people.status", query.getStatus());
    qb.addEqualsClause("rank", "people.rank", query.getRank());
    qb.addEqualsClause("country", "people.country", query.getCountry());
    qb.addEqualsClause("pendingVerification", "people.pendingVerification",
        query.getPendingVerification());

    if (query.getOrgUuid() != null) {
      if (!query.getIncludeChildOrgs()) {
        qb.addWhereClause("positions.organizationUuid = :orgUuid");
      } else {
        qb.addWithClause("parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid"
            + ")");
        qb.addWhereClause("positions.organizationUuid IN (SELECT uuid from parent_orgs)");
      }
      qb.addSqlArg("orgUuid", query.getOrgUuid());
    }

    qb.addEqualsClause("locationUuid", "positions.locationUuid", query.getLocationUuid());

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new PersonMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PersonSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), "people", "createdAt"));
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
