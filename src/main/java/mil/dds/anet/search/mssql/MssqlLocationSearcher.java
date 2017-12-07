package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.LocationList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlLocationSearcher implements ILocationSearcher {

	@Override
	public LocationList runSearch(LocationSearchQuery query, Handle dbHandle) {
		final LocationList result = new LocationList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());
		final String text = query.getText();
		if (text == null || text.trim().isEmpty()) {
			return result;
		}

		final Map<String,Object> args = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder(
				"/* MssqlLocationSearch */ SELECT locations.*"
						+ ", count(*) over() as totalCount FROM locations"
						+ " LEFT JOIN CONTAINSTABLE (locations, (name), :containsQuery) c_locations"
						+ " ON locations.id = c_locations.[Key]"
						+ " WHERE c_locations.rank IS NOT NULL"
						+ " ORDER BY locations.name ASC, locations.id ASC");
		args.put("containsQuery", Utils.getSqlServerFullTextQuery(text));

		final Query<Location> map = MssqlSearcher.addPagination(query, dbHandle, sql, args)
			.map(new LocationMapper());
		return LocationList.fromQuery(map, query.getPageNum(), query.getPageSize());
	}

}
