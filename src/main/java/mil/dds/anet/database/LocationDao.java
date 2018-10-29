package mil.dds.anet.database;

import java.util.List;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterRowMapper(LocationMapper.class)
public class LocationDao implements IAnetDao<Location> {

	private final Handle dbHandle;
	private final IdBatcher<Location> idBatcher;

	public LocationDao(Handle h) { 
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getLocationsByUuids */ SELECT * from locations where uuid IN ( %1$s )";
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
		
		final Query sqlQuery = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum);
		return new AnetBeanList<Location>(sqlQuery, pageNum, pageSize, new LocationMapper(), null);
	}

	public Location getByUuid(String uuid) {
		return dbHandle.createQuery("/* getLocationByUuid */ SELECT * from locations where uuid = :uuid")
				.bind("uuid", uuid)
				.map(new LocationMapper())
				.findFirst().orElse(null);
	}

	@Override
	public List<Location> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Location insert(Location l) {
		DaoUtils.setInsertFields(l);
		dbHandle.createUpdate(
				"/* locationInsert */ INSERT INTO locations (uuid, name, status, lat, lng, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :name, :status, :lat, :lng, :createdAt, :updatedAt)")
			.bindBean(l)
			.bind("status", DaoUtils.getEnumId(l.getStatus()))
			.execute();
		return l;
	}
	
	public int update(Location l) {
		DaoUtils.setUpdateFields(l);
		return dbHandle.createUpdate("/* updateLocation */ UPDATE locations "
					+ "SET name = :name, status = :status, lat = :lat, lng = :lng, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindBean(l)
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

	public AnetBeanList<Location> search(LocationSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getLocationSearcher().runSearch(query, dbHandle);
	}
	
	//TODO: Don't delete any location if any references exist. 
	
}
