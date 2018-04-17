package mil.dds.anet.database;

import java.util.List;

import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AbstractAnetBeanList;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.database.mappers.SavedSearchMapper;
import mil.dds.anet.utils.DaoUtils;

public class SavedSearchDao implements IAnetDao<SavedSearch> {

	Handle dbHandle;
	
	public SavedSearchDao(Handle h) { 
		this.dbHandle = h;
	}
	
	public AbstractAnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	@Deprecated
	public SavedSearch getById(int id) { 
		return dbHandle.createQuery("/* getSavedSearchById */ SELECT * from \"savedSearches\" where id = :id")
				.bind("id", id)
				.map(new SavedSearchMapper())
				.first();
	}

	public SavedSearch getByUuid(String uuid) {
		return dbHandle.createQuery("/* getSavedSearchByUuid */ SELECT * from \"savedSearches\" where uuid = :uuid")
				.bind("uuid", uuid)
				.map(new SavedSearchMapper())
				.first();
	}

	public List<SavedSearch> getSearchesByOwner(Person owner) { 
		return dbHandle.createQuery("/* getSavedSearchByOwner */ SELECT * FROM \"savedSearches\" WHERE \"ownerUuid\" = :ownerUuid")
			.bind("ownerUuid", owner.getUuid())
			.map(new SavedSearchMapper())
			.list();
	}
	
	public SavedSearch insert(SavedSearch obj) {
		DaoUtils.setInsertFields(obj);
		dbHandle.createStatement("/* insertSavedSearch */ INSERT INTO \"savedSearches\" "
				+ "(uuid, \"ownerUuid\", name, \"objectType\", query) "
				+ "VALUES (:uuid, :ownerUuid, :name, :objectType, :query)")
			.bindFromProperties(obj)
			.bind("ownerUuid", obj.getOwner().getUuid())
			.bind("objectType", DaoUtils.getEnumId(obj.getObjectType()))
			.execute();
		return obj;
	}

	public int update(SavedSearch obj) {
		DaoUtils.setUpdateFields(obj);
		return dbHandle.createStatement("/* updateSavedSearch */ UPDATE \"savedSearches\" "
				+ "SET name = :name, \"objectType\" = :objectType, query = :query "
				+ "WHERE uuid = :uuid")
			.bindFromProperties(obj)
			.execute();
	}

	public int deleteSavedSearch(String uuid, Person owner) {
		return dbHandle.createStatement("/* deleteSavedSearch */ DELETE FROM \"savedSearches\" "
				+ "WHERE uuid = :uuid AND \"ownerUuid\" = :ownerUuid")
			.bind("uuid", uuid)
			.bind("ownerUuid", owner.getUuid())
			.execute();
	}
	
}
