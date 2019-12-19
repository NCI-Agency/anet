package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.search.AbstractPersonSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class MssqlPersonSearcher extends AbstractPersonSearcher {

  public MssqlPersonSearcher() {
    super(new MssqlSearchQueryBuilder<Person, PersonSearchQuery>("MssqlPersonSearch"));
  }

  @Override
  protected void addTextQuery(PersonSearchQuery query) {
    if (!query.isSortByPresent()) {
      // If we're doing a full-text search without an explicit sort order, add a pseudo-rank (the
      // sum of all search ranks) so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now. See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      qb.addSelectClause("ISNULL(c_people.rank, 0) + ISNULL(f_people.rank, 0)"
          + " + CASE WHEN people.code LIKE :likeQuery THEN 1000 ELSE 0 END"
          + (query.getMatchPositionName()
              ? " + ISNULL(c_positions.rank, 0)"
                  + " + CASE WHEN positions.code LIKE :likeQuery THEN 1000 ELSE 0 END"
              : "")
          + " AS search_rank");
    }
    qb.addFromClause(
        "LEFT JOIN CONTAINSTABLE (people, (name, emailAddress, biography), :containsQuery) c_people"
            + " ON people.uuid = c_people.[Key]"
            + " LEFT JOIN FREETEXTTABLE(people, (name, biography), :freetextQuery) f_people"
            + " ON people.uuid = f_people.[Key]");
    final StringBuilder whereRank =
        new StringBuilder("(c_people.rank IS NOT NULL OR f_people.rank IS NOT NULL"
            + " OR people.code LIKE :likeQuery");
    if (query.getMatchPositionName()) {
      qb.addFromClause("LEFT JOIN CONTAINSTABLE(positions, (name), :containsQuery) c_positions"
          + " ON positions.uuid = c_positions.[Key]");
      whereRank.append(" OR c_positions.rank IS NOT NULL OR positions.code LIKE :likeQuery");
    }
    whereRank.append(")");
    qb.addWhereClause(whereRank.toString());
    final String text = query.getText();
    qb.addSqlArg("containsQuery", qb.getFullTextQuery(text));
    qb.addSqlArg("freetextQuery", text);
    qb.addSqlArg("likeQuery", qb.getLikeQuery(text));
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
