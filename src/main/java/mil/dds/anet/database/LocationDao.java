package mil.dds.anet.database;

import java.util.List;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.sqlobject.customizers.RegisterMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.LocationList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterMapper(LocationMapper.class)
public class LocationDao implements IAnetDao<Location> {

	Handle dbHandle;
	
	public LocationDao(Handle h) { 
		this.dbHandle = h;
	}
	
	public LocationList getAll(int pageNum, int pageSize) { 
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
		return LocationList.fromQuery(query, pageNum, pageSize);
	}

	public Location getByUuid(String uuid) {
		return dbHandle.createQuery("/* getLocationByUuid */ SELECT * from locations where uuid = :uuid")
				.bind("uuid", uuid)
				.map(new LocationMapper())
				.first();
	}

	public Location insert(Location l) {
		DaoUtils.setInsertFields(l);
		dbHandle.createStatement(
				"/* locationInsert */ INSERT INTO locations (uuid, name, status, lat, lng, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :name, :status, :lat, :lng, :createdAt, :updatedAt)")
			.bindFromProperties(l)
			.bind("status", DaoUtils.getEnumId(l.getStatus()))
			.execute();
		return l;
	}
	
	public int update(Location l) {
		DaoUtils.setUpdateFields(l);
		return dbHandle.createStatement("/* updateLocation */ UPDATE locations "
					+ "SET name = :name, status = :status, lat = :lat, lng = :lng, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindFromProperties(l)
				.bind("status", DaoUtils.getEnumId(l.getStatus()))
				.execute();
	}
	
	public List<Location> getRecentLocations(Person author, int maxResults) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* recentLocations */ SELECT locations.* FROM locations WHERE uuid IN ( "
					+ "SELECT TOP(:maxResults) reports.\"locationUuid\" "
					+ "FROM reports "
					+ "WHERE authorUuid = :authorUuid "
					+ "GROUP BY \"locationUuid\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC"
				+ ")";
		} else {
			sql = "/* recentLocations */ SELECT locations.* FROM locations WHERE uuid IN ( "
					+ "SELECT reports.\"locationUuid\" "
					+ "FROM reports "
					+ "WHERE \"authorUuid\" = :authorUuid "
					+ "GROUP BY \"locationUuid\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC "
					+ "LIMIT :maxResults"
				+ ")";
		}
		return dbHandle.createQuery(sql)
				.bind("authorUuid", author.getUuid())
				.bind("maxResults", maxResults)
				.map(new LocationMapper())
				.list();
	}

	public LocationList search(LocationSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getLocationSearcher().runSearch(query, dbHandle);
	}
	
	//TODO: Don't delete any location if any references exist. 
	
}
