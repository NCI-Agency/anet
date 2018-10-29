package mil.dds.anet.search.sqlite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import com.google.common.base.Joiner;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqliteLocationSearcher implements ILocationSearcher {

	@Override
	public AnetBeanList<Location> runSearch(LocationSearchQuery query, Handle dbHandle) {
		final List<String> whereClauses = new LinkedList<String>();
		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder("/* SqliteLocationSearch */ SELECT * FROM locations");
		
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

		final AnetBeanList<Location> result = new AnetBeanList<Location>(query.getPageNum(), query.getPageSize(), new ArrayList<Location>());
		
		if (whereClauses.isEmpty()) {
			return result;
		}
		
		sql.append(" WHERE ");
		sql.append(Joiner.on(" AND ").join(whereClauses));
		
		sql.append(" LIMIT :limit OFFSET :offset");
		
		final List<Location> list = dbHandle.createQuery(sql.toString())
			.bindMap(sqlArgs)
			.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize())
			.map(new LocationMapper())
			.list();
		
		result.setList(list);
		result.setTotalCount(result.getList().size()); // Sqlite cannot do true total counts, so this is a crutch.
		return result;
	}

}
