package mil.dds.anet.search.sqlite;

import com.google.common.base.Joiner;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqliteLocationSearcher extends AbstractSearcherBase implements ILocationSearcher {

  @Override
  public AnetBeanList<Location> runSearch(LocationSearchQuery query, Person user) {
    final List<String> whereClauses = new LinkedList<String>();
    final Map<String, Object> sqlArgs = new HashMap<String, Object>();
    final StringBuilder sql =
        new StringBuilder("/* SqliteLocationSearch */ SELECT * FROM locations");

    final String text = query.getText();
    final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
    if (doFullTextSearch) {
      whereClauses.add("name LIKE '%' || :text || '%'");
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    if (query.getStatus() != null) {
      whereClauses.add("status = :status");
      sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus()));
    }

    final AnetBeanList<Location> result = new AnetBeanList<Location>(query.getPageNum(),
        query.getPageSize(), new ArrayList<Location>());

    if (!whereClauses.isEmpty()) {
      sql.append(" WHERE ");
      sql.append(Joiner.on(" AND ").join(whereClauses));
    }

    sql.append(" LIMIT :limit OFFSET :offset");

    final List<Location> list = getDbHandle().createQuery(sql.toString()).bindMap(sqlArgs)
        .bind("offset", query.getPageSize() * query.getPageNum()).bind("limit", query.getPageSize())
        .map(new LocationMapper()).list();

    result.setList(list);
    // Sqlite cannot do true total counts, so this is a crutch.
    result.setTotalCount(result.getList().size());
    return result;
  }

}
