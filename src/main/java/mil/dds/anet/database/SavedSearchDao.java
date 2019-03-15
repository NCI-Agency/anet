package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.database.mappers.SavedSearchMapper;
import mil.dds.anet.utils.DaoUtils;

public class SavedSearchDao extends AnetBaseDao<SavedSearch> {

	private final IdBatcher<SavedSearch> idBatcher;

	public SavedSearchDao(AnetObjectEngine engine) {
		super(engine, "SavedSearches", "savedSearches", "*", null);
		final String idBatcherSql = "/* batch.getSavedSearchesByUuids */ SELECT * from \"savedSearches\" where uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<SavedSearch>(engine, idBatcherSql, "uuids", new SavedSearchMapper());
	}
	
	@Override
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	public SavedSearch getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<SavedSearch> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	public List<SavedSearch> getSearchesByOwner(Person owner) { 
		return engine.getDbHandle().createQuery("/* getSavedSearchByOwner */ SELECT * FROM \"savedSearches\" WHERE \"ownerUuid\" = :ownerUuid")
			.bind("ownerUuid", owner.getUuid())
			.map(new SavedSearchMapper())
			.list();
	}

	@Override
	public SavedSearch insertInternal(SavedSearch obj) {
		engine.getDbHandle().createUpdate("/* insertSavedSearch */ INSERT INTO \"savedSearches\" "
				+ "(uuid, \"ownerUuid\", name, \"objectType\", query) "
				+ "VALUES (:uuid, :ownerUuid, :name, :objectType, :query)")
			.bindBean(obj)
			.bind("createdAt", DaoUtils.asLocalDateTime(obj.getCreatedAt()))
			.bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt()))
			.bind("objectType", DaoUtils.getEnumId(obj.getObjectType()))
			.execute();
		return obj;
	}

	@Override
	public int updateInternal(SavedSearch obj) {
		return engine.getDbHandle().createUpdate("/* updateSavedSearch */ UPDATE \"savedSearches\" "
				+ "SET name = :name, \"objectType\" = :objectType, query = :query "
				+ "WHERE uuid = :uuid")
			.bindBean(obj)
			.bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt()))
			.execute();
	}

	@Override
	public int deleteInternal(String uuid) {
		return engine.getDbHandle().createUpdate("/* deleteSavedSearch */ DELETE FROM \"savedSearches\" "
				+ "WHERE uuid = :uuid")
			.bind("uuid", uuid)
			.execute();
	}
	
}
