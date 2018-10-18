package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.sqlobject.Bind;
import org.skife.jdbi.v2.sqlobject.customizers.RegisterMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterMapper(LocationMapper.class)
public class LocationDao implements IAnetDao<Location> {

	private final Handle dbHandle;
	private final IdBatcher<Location> idBatcher;

	public LocationDao(Handle h) { 
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getLocationsByIds */ SELECT * from locations where id IN ( %1$s )";
		this.idBatcher = new IdBatcher<Location>(h, idBatcherSql, new LocationMapper());
	}
	
	public AnetBeanList<Location> getAll(int pageNum, int pageSize) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) { 
			sql = "/* getAllLocations */ SELECT locations.*, COUNT(*) OVER() AS totalCount "
					+ "FROM locations ORDER BY \"createdAt\" DESC "
					+ "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else {
			sql = "/* getAllLocations */ SELECT * from locations "
					+ "ORDER BY \"createdAt\" ASC LIMIT :limit OFFSET :offset";
		}
		
		Query<Location> query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum)
				.map(new LocationMapper());
		return new AnetBeanList<Location>(query, pageNum, pageSize, null);
	}
	
	@Override
	public Location getById(@Bind("id") int id) { 
		Query<Location> query = dbHandle.createQuery("/* getLocationById */ SELECT * from locations where id = :id")
				.bind("id", id)
				.map(new LocationMapper());
			List<Location> results = query.list();
			if (results.size() == 0) { return null; } 
			return results.get(0);
	}

	@Override
	public List<Location> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	@Override
	public Location insert(Location l) {
		l.setCreatedAt(DateTime.now());
		l.setUpdatedAt(DateTime.now());
		GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement(
				"/* locationInsert */ INSERT INTO locations (name, status, lat, lng, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:name, :status, :lat, :lng, :createdAt, :updatedAt)")
			.bind("name", l.getName())
			.bind("status", DaoUtils.getEnumId(l.getStatus()))
			.bind("lat", l.getLat())
			.bind("lng", l.getLng())
			.bind("createdAt", l.getCreatedAt())
			.bind("updatedAt", l.getUpdatedAt())
			.executeAndReturnGeneratedKeys();
		l.setId(DaoUtils.getGeneratedId(keys));
		return l;
	}
	
	@Override
	public int update(Location l) {
		return dbHandle.createStatement("/* updateLocation */ UPDATE locations "
					+ "SET name = :name, status = :status, lat = :lat, lng = :lng, \"updatedAt\" = :updatedAt WHERE id = :id")
				.bind("id", l.getId())
				.bind("name", l.getName())
				.bind("status", DaoUtils.getEnumId(l.getStatus()))
				.bind("lat", l.getLat())
				.bind("lng", l.getLng())
				.bind("updatedAt", DateTime.now())
				.execute();
	}
	
	public List<Location> getRecentLocations(Person author, int maxResults) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* recentLocations */ SELECT locations.* FROM locations WHERE id IN ( "
					+ "SELECT TOP(:maxResults) reports.\"locationId\" "
					+ "FROM reports "
					+ "WHERE authorid = :authorId "
					+ "GROUP BY \"locationId\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC"
				+ ")";
		} else {
			sql = "/* recentLocations */ SELECT locations.* FROM locations WHERE id IN ( "
					+ "SELECT reports.\"locationId\" "
					+ "FROM reports "
					+ "WHERE \"authorId\" = :authorId "
					+ "GROUP BY \"locationId\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC "
					+ "LIMIT :maxResults"
				+ ")";
		}
		return dbHandle.createQuery(sql)
				.bind("authorId", author.getId())
				.bind("maxResults", maxResults)
				.map(new LocationMapper())
				.list();
	}

	public AnetBeanList<Location> search(LocationSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getLocationSearcher().runSearch(query, dbHandle);
	}
	
	//TODO: Don't delete any location if any references exist. 
	
}
