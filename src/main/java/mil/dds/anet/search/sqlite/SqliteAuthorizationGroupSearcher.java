package mil.dds.anet.search.sqlite;

import com.google.common.base.Joiner;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery.AuthorizationGroupSearchSortBy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqliteAuthorizationGroupSearcher extends AbstractSearcherBase
    implements IAuthorizationGroupSearcher {

  @Override
  public AnetBeanList<AuthorizationGroup> runSearch(AuthorizationGroupSearchQuery query) {
    final List<String> whereClauses = new LinkedList<String>();
    final Map<String, Object> sqlArgs = new HashMap<String, Object>();
    final StringBuilder sql = new StringBuilder(
        "/* SqliteAuthorizationGroupSearch */ SELECT * FROM \"authorizationGroups\"");

    final String text = query.getText();
    final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
    if (doFullTextSearch) {
      whereClauses.add("(name LIKE '%' || :text || '%' OR description LIKE '%' || :text || '%' )");
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    if (query.getStatus() != null) {
      whereClauses.add("status = :status");
      sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus()));
    }

    if (query.getPositionUuid() != null) {
      // Search for authorization groups related to a given position
      whereClauses
          .add("uuid IN ( SELECT \"authorizationGroupUuid\" FROM \"authorizationGroupPositions\" "
              + "WHERE \"positionUuid\" = :positionUuid) ");
      sqlArgs.put("positionUuid", query.getPositionUuid());
    }

    final AnetBeanList<AuthorizationGroup> result = new AnetBeanList<AuthorizationGroup>(
        query.getPageNum(), query.getPageSize(), new ArrayList<AuthorizationGroup>());

    if (whereClauses.isEmpty()) {
      return result;
    }

    sql.append(" WHERE ");
    sql.append(Joiner.on(" AND ").join(whereClauses));

    // Sort Ordering
    final List<String> orderByClauses = new LinkedList<>();
    if (query.getSortBy() == null) {
      query.setSortBy(AuthorizationGroupSearchSortBy.NAME);
    }
    if (query.getSortOrder() == null) {
      query.setSortOrder(SortOrder.ASC);
    }
    switch (query.getSortBy()) {
      case CREATED_AT:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "\"createdAt\""));
        break;
      case NAME:
      default:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "name"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, null, "uuid"));
    sql.append(" ORDER BY ");
    sql.append(Joiner.on(", ").join(orderByClauses));

    sql.append(" LIMIT :limit OFFSET :offset");

    final List<AuthorizationGroup> list = getDbHandle().createQuery(sql.toString()).bindMap(sqlArgs)
        .bind("offset", query.getPageSize() * query.getPageNum()).bind("limit", query.getPageSize())
        .map(new AuthorizationGroupMapper()).list();

    result.setList(list);
    // Sqlite cannot do true total counts, so this is a crutch.
    result.setTotalCount(result.getList().size());
    return result;
  }

}
