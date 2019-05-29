package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class MssqlAuthorizationGroupSearcher extends AbstractSearcher
    implements IAuthorizationGroupSearcher {

  @InTransaction
  @Override
  public AnetBeanList<AuthorizationGroup> runSearch(AuthorizationGroupSearchQuery query) {
    final MssqlSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery> qb =
        new MssqlSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery>(
            "MssqlAuthorizationGroupSearch");
    qb.addSelectClause("authorizationGroups.*");
    qb.addSelectClause("count(*) over() as totalCount");
    qb.addFromClause("authorizationGroups");

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
      // so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now.
      // See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      qb.addSelectClause(
          "ISNULL(c_authorizationGroups.rank, 0) + ISNULL(f_authorizationGroups.rank, 0)"
              + " AS search_rank");
      qb.addFromClause(
          "LEFT JOIN CONTAINSTABLE (authorizationGroups, (name, description), :containsQuery) c_authorizationGroups"
              + " ON authorizationGroups.uuid = c_authorizationGroups.[Key]"
              + " LEFT JOIN FREETEXTTABLE(authorizationGroups, (name, description), :freetextQuery) f_authorizationGroups"
              + " ON authorizationGroups.uuid = f_authorizationGroups.[Key]");
      qb.addWhereClause("c_authorizationGroups.rank IS NOT NULL");
      final String text = query.getText();
      qb.addSqlArg("containsQuery", Utils.getSqlServerFullTextQuery(text));
      qb.addSqlArg("freetextQuery", text);
    }

    qb.addEqualsClause("status", "authorizationGroups.status", query.getStatus());

    if (query.getPositionUuid() != null) {
      // Search for authorization groups related to a given position
      qb.addWhereClause(
          "authorizationGroups.uuid IN (SELECT ap.authorizationGroupUuid FROM authorizationGroupPositions ap"
              + " WHERE ap.positionUuid = :positionUuid)");
      qb.addSqlArg("positionUuid", query.getPositionUuid());
    }

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new AuthorizationGroupMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AuthorizationGroupSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), "authorizationGroups", "createdAt"));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), "authorizationGroups", "name"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "authorizationGroups", "uuid"));
  }

}
