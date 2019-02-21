package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;

import org.jdbi.v3.core.statement.Query;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public class LocationDao extends AnetSubscribableObjectDao<Location> {

	private static final String tableName = "locations";

	public LocationDao() {
		super("Locations", tableName, "*", null);
	}
	
	public AnetBeanList<Location> getAll(int pageNum, int pageSize) {
		String sql;
		if (DaoUtils.isMsSql()) {
			sql = "/* getAllLocations */ SELECT locations.*, COUNT(*) OVER() AS totalCount "
					+ "FROM locations ORDER BY \"createdAt\" DESC "
					+ "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else {
			sql = "/* getAllLocations */ SELECT * from locations "
					+ "ORDER BY \"createdAt\" ASC LIMIT :limit OFFSET :offset";
		}
		
		final Query sqlQuery = getDbHandle().createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum);
		return new AnetBeanList<Location>(sqlQuery, pageNum, pageSize, new LocationMapper(), null);
	}

	public Location getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	static class SelfIdBatcher extends IdBatcher<Location> {
		private static final String sql =
			"/* batch.getLocationsByUuids */ SELECT * from locations where uuid IN ( <uuids> )";

		public SelfIdBatcher() {
			super(sql, "uuids", new LocationMapper());
		}
	}

	@Override
	public List<Location> getByIds(List<String> uuids) {
		final IdBatcher<Location>  idBatcher = AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Location insertInternal(Location l) {
		getDbHandle().createUpdate(
				"/* locationInsert */ INSERT INTO locations (uuid, name, status, lat, lng, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :name, :status, :lat, :lng, :createdAt, :updatedAt)")
			.bindBean(l)
			.bind("createdAt", DaoUtils.asLocalDateTime(l.getCreatedAt()))
			.bind("updatedAt", DaoUtils.asLocalDateTime(l.getUpdatedAt()))
			.bind("status", DaoUtils.getEnumId(l.getStatus()))
			.execute();
		return l;
	}

	@Override
	public int updateInternal(Location l) {
		return getDbHandle().createUpdate("/* updateLocation */ UPDATE locations "
					+ "SET name = :name, status = :status, lat = :lat, lng = :lng, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindBean(l)
				.bind("updatedAt", DaoUtils.asLocalDateTime(l.getUpdatedAt()))
				.bind("status", DaoUtils.getEnumId(l.getStatus()))
				.execute();
	}

	@Override
	public int deleteInternal(String uuid) {
		throw new UnsupportedOperationException();
	}

	public List<Location> getRecentLocations(Person author, int maxResults) {
		String sql;
		if (DaoUtils.isMsSql()) {
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
		return getDbHandle().createQuery(sql)
				.bind("authorUuid", author.getUuid())
				.bind("maxResults", maxResults)
				.map(new LocationMapper())
				.list();
	}

	public AnetBeanList<Location> search(LocationSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getLocationSearcher().runSearch(query);
	}
	
	//TODO: Don't delete any location if any references exist. 

	@Override
	public SubscriptionUpdateGroup getSubscriptionUpdate(Location obj) {
		return getCommonSubscriptionUpdate(obj, tableName, "locationUuid");
	}
}
