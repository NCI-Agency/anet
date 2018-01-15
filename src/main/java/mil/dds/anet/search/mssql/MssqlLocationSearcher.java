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
		LocationList result = new LocationList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());
		if (query.getText() == null || query.getText().trim().length() == 0) {
			return result;
		}
		
		final Map<String,Object> args = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder(
				"/* MssqlLocationSearch */ SELECT *, count(*) over() as totalCount "
						+ "FROM locations WHERE CONTAINS (name, :name) "
						+ "ORDER BY name ASC, id ASC");
		args.put("name", Utils.getSqlServerFullTextQuery(query.getText()));

		final Query<Location> map = MssqlSearcher.addPagination(query, dbHandle, sql, args)
			.map(new LocationMapper());
		return LocationList.fromQuery(map, query.getPageNum(), query.getPageSize());
	}

}
