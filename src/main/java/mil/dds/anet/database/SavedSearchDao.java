package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.database.mappers.SavedSearchMapper;
import mil.dds.anet.utils.DaoUtils;

public class SavedSearchDao implements IAnetDao<SavedSearch> {

	private final Handle dbHandle;
	private final IdBatcher<SavedSearch> idBatcher;

	public SavedSearchDao(Handle h) { 
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getSavedSearchesByIds */ SELECT * from \"savedSearches\" where id IN ( %1$s )";
		this.idBatcher = new IdBatcher<SavedSearch>(h, idBatcherSql, new SavedSearchMapper());
	}
	
	@Override
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}
	
	@Override
	public SavedSearch getById(int id) { 
		return dbHandle.createQuery("/* getSavedSearchById */ SELECT * from \"savedSearches\" where id = :id")
				.bind("id", id)
				.map(new SavedSearchMapper())
				.first();
	}

	@Override
	public List<SavedSearch> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	public List<SavedSearch> getSearchesByOwner(Person owner) { 
		return dbHandle.createQuery("/* getSavedSearchByOwner */ SELECT * FROM \"savedSearches\" WHERE \"ownerId\" = :ownerId")
			.bind("ownerId", owner.getId())
			.map(new SavedSearchMapper())
			.list();
	}
	
	@Override
	public SavedSearch insert(SavedSearch obj) {
		obj.setCreatedAt(DateTime.now());
		GeneratedKeys<Map<String, Object>> keys = dbHandle.createStatement("/* insertSavedSearch */ INSERT INTO \"savedSearches\" "
				+ "(\"ownerId\", name, \"objectType\", query) "
				+ "VALUES (:ownerId, :name, :objectType, :query)")
			.bindFromProperties(obj)
			.bind("ownerId", obj.getOwner().getId())
			.bind("objectType", DaoUtils.getEnumId(obj.getObjectType()))
			.executeAndReturnGeneratedKeys();
		obj.setId(DaoUtils.getGeneratedId(keys));
		return obj;
	}

	@Override
	public int update(SavedSearch obj) {
		return dbHandle.createStatement("/* updateSavedSearch */ UPDATE \"savedSearches\" "
				+ "SET name = :name, \"objectType\" = :objectType, query = :query "
				+ "WHERE id = :id")
			.bindFromProperties(obj)
			.execute();
	}

	public int deleteSavedSearch(Integer id, Person owner) {
		return dbHandle.createStatement("/* deleteSavedSearch */ DELETE FROM \"savedSearches\" "
				+ "WHERE id = :id AND \"ownerId\" = :ownerId")
			.bind("id", id)
			.bind("ownerId", owner.getId())
			.execute();
	}
	
}
