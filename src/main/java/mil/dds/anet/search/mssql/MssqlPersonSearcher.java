package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.search.AbstractPersonSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class MssqlPersonSearcher extends AbstractPersonSearcher {

  public MssqlPersonSearcher() {
    super(new MssqlSearchQueryBuilder<Person, PersonSearchQuery>("MssqlPersonSearch"));
  }

  @Override
  protected void addTextQuery(PersonSearchQuery query) {
    final boolean doSoundex = !query.isSortByPresent();
    final String text = query.getText();
    if (doSoundex) {
      qb.addSelectClause("EXP(SUM(LOG(1.0/(5-DIFFERENCE(name_token.value, search_token.value)))))"
          + " AS search_rank");
      qb.addFromClause("CROSS APPLY STRING_SPLIT(people.name, ' ') AS name_token"
          + " CROSS APPLY STRING_SPLIT(:freetextQuery, ' ') AS search_token");
      qb.addSqlArg("freetextQuery", text);
      // Add grouping needed for soundex score
      qb.addGroupByClause(PersonDao.PERSON_FIELDS_NOAS);
    } else {
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
        qb.addSqlArg("likeQuery", qb.getLikeQuery(text));
      }
      whereRank.append(")");
      qb.addWhereClause(whereRank.toString());
      qb.addSqlArg("containsQuery", qb.getFullTextQuery(text));
      qb.addSqlArg("freetextQuery", text);
    }
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PersonSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}
