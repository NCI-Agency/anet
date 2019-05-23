package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlPersonSearcher extends AbstractMssqlSearcherBase<Person, PersonSearchQuery>
    implements IPersonSearcher {

  @Override
  public AnetBeanList<Person> runSearch(PersonSearchQuery query) {
    start("MssqlPersonSearch");
    sql.append("SELECT " + PersonDao.PERSON_FIELDS);

    final boolean doSoundex = query.isTextPresent() && !query.isSortByPresent();
    if (doSoundex) {
      sql.append(", EXP(SUM(LOG(1.0/(5-DIFFERENCE(name_token.value, search_token.value)))))");
      sql.append(" AS search_rank");
    } else if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
      // so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now.
      // See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      sql.append(", ISNULL(c_people.rank, 0) + ISNULL(f_people.rank, 0)");
      if (query.getMatchPositionName()) {
        sql.append(" + ISNULL(c_positions.rank, 0)");
      }
      sql.append(" AS search_rank");
    }
    sql.append(", count(*) over() as totalCount FROM people");

    if (query.getOrgUuid() != null || query.getLocationUuid() != null
        || query.getMatchPositionName()) {
      sql.append(" LEFT JOIN positions ON people.uuid = positions.currentPersonUuid ");
    }

    final String text = query.getText();
    if (doSoundex) {
      sql.append(" CROSS APPLY STRING_SPLIT(people.name, ' ') AS name_token"
          + " CROSS APPLY STRING_SPLIT(:freetextQuery, ' ') AS search_token");
      sqlArgs.put("freetextQuery", text);
    } else if (query.isTextPresent()) {
      sql.append(
          " LEFT JOIN CONTAINSTABLE (people, (name, emailAddress, biography), :containsQuery) c_people"
              + " ON people.uuid = c_people.[Key]"
              + " LEFT JOIN FREETEXTTABLE(people, (name, biography), :freetextQuery) f_people"
              + " ON people.uuid = f_people.[Key]");
      final StringBuilder whereRank =
          new StringBuilder("(" + "c_people.rank IS NOT NULL" + " OR f_people.rank IS NOT NULL");
      if (query.getMatchPositionName()) {
        sql.append(" LEFT JOIN CONTAINSTABLE(positions, (name), :containsQuery) c_positions"
            + " ON positions.uuid = c_positions.[Key]");
        whereRank.append(" OR c_positions.rank IS NOT NULL" + " OR positions.code LIKE :likeQuery");
        sqlArgs.put("likeQuery", Utils.prepForLikeQuery(text) + "%");
      }
      whereRank.append(")");
      whereClauses.add(whereRank.toString());
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
      sqlArgs.put("freetextQuery", text);
    }

    addDateClause("startDate", "people.endOfTourDate", Comparison.AFTER,
        query.getEndOfTourDateStart());
    addDateClause("endDate", "people.endOfTourDate", Comparison.BEFORE,
        query.getEndOfTourDateEnd());
    addEqualsClause("role", "people.role", query.getRole());
    addInClause("statuses", "people.status", query.getStatus());
    addEqualsClause("rank", "people.rank", query.getRank());
    addEqualsClause("country", "people.country", query.getCountry());
    addEqualsClause("pendingVerification", "people.pendingVerification",
        query.getPendingVerification());

    if (query.getOrgUuid() != null) {
      if (!query.getIncludeChildOrgs()) {
        whereClauses.add(" positions.organizationUuid = :orgUuid ");
      } else {
        withClauses.add("parent_orgs(uuid) AS ( "
            + "SELECT uuid FROM organizations WHERE uuid = :orgUuid " + "UNION ALL "
            + "SELECT o.uuid from parent_orgs po, organizations o WHERE o.parentOrgUuid = po.uuid "
            + ") ");
        whereClauses.add(" positions.organizationUuid IN (SELECT uuid from parent_orgs)");
      }
      sqlArgs.put("orgUuid", query.getOrgUuid());
    }

    addEqualsClause("locationUuid", "positions.locationUuid", query.getLocationUuid());

    finish(doSoundex, query);
    return getResult(query, new PersonMapper());
  }

  protected void finish(boolean doSoundex, PersonSearchQuery query) {
    addWithClauses();
    addWhereClauses();
    if (doSoundex) {
      // Add grouping needed for soundex score
      sql.append(" GROUP BY " + PersonDao.PERSON_FIELDS_NOAS);
    }
    addOrderByClauses(query);
  }

  @Override
  protected void getOrderByClauses(PersonSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "people", "createdAt"));
        break;
      case RANK:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "people", "rank"));
        break;
      case NAME:
      default:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "people", "name"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "people", "uuid"));
  }

}
