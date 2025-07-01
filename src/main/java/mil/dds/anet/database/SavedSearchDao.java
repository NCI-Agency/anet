package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.database.mappers.SavedSearchMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SavedSearchDao extends AnetBaseDao<SavedSearch, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "savedSearches";

  public SavedSearchDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public SavedSearch getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<SavedSearch> {
    private static final String SQL =
        "/* batch.getSavedSearchesByUuids */ SELECT * from \"savedSearches\" where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(SavedSearchDao.this.databaseHandler, SQL, "uuids", new SavedSearchMapper());
    }
  }

  @Override
  public List<SavedSearch> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Transactional
  public List<SavedSearch> getSearchesByOwner(Person owner) {
    final Handle handle = getDbHandle();
    try {
      return handle.createQuery(
          "/* getSavedSearchByOwner */ SELECT * FROM \"savedSearches\" WHERE \"ownerUuid\" = :ownerUuid")
          .bind("ownerUuid", owner.getUuid()).map(new SavedSearchMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public SavedSearch insertInternal(SavedSearch obj) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate("/* insertSavedSearch */ INSERT INTO \"savedSearches\" "
          + "(uuid, \"ownerUuid\", name, \"objectType\", query, \"displayInHomepage\", priority) "
          + "VALUES (:uuid, :ownerUuid, :name, :objectType, :query, :displayInHomepage, :priority)")
          .bindBean(obj).bind("createdAt", DaoUtils.asLocalDateTime(obj.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt()))
          .bind("objectType", DaoUtils.getEnumId(obj.getObjectType())).execute();
      return obj;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(SavedSearch obj) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate("/* updateSavedSearch */ UPDATE \"savedSearches\" "
          + "SET name = :name, \"objectType\" = :objectType, query = :query, \"displayInHomepage\" = :displayInHomepage, priority = :priority WHERE uuid = :uuid")
          .bindBean(obj).bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int deleteInternal(String uuid) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* deleteSavedSearch */ DELETE FROM \"savedSearches\" WHERE uuid = :uuid")
          .bind("uuid", uuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public Double getMaxPriorityForOwner(String ownerUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery(
              "SELECT MAX(priority) FROM \"savedSearches\" WHERE \"ownerUuid\" = :ownerUuid")
          .bind("ownerUuid", ownerUuid).mapTo(Double.class).findOne().orElse(null);
    } finally {
      closeDbHandle(handle);
    }
  }

  public int updatePriority(String uuid, Double priority) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("UPDATE \"savedSearches\" SET priority = :priority WHERE uuid = :uuid")
          .bind("uuid", uuid).bind("priority", priority).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public int updateSavedSearchDisplayInHomepage(String uuid, Boolean displayInHomepage) {
    final Handle handle = getDbHandle();
    try {
      if (Boolean.TRUE.equals(displayInHomepage)) {
        // Fetch ownerUuid from the SavedSearch
        String ownerUuid =
            handle.createQuery("SELECT \"ownerUuid\" FROM \"savedSearches\" WHERE uuid = :uuid")
                .bind("uuid", uuid).mapTo(String.class).findOne().orElse(null);

        // Compute new priority
        Double maxPriority = getMaxPriorityForOwner(ownerUuid);
        double newPriority = (maxPriority == null) ? 0.0 : maxPriority + 1.0;

        // Set displayInHomepage true and set new priority
        return handle.createUpdate(
            "UPDATE \"savedSearches\" SET \"displayInHomepage\" = :displayInHomepage, priority = :priority WHERE uuid = :uuid")
            .bind("uuid", uuid).bind("displayInHomepage", true).bind("priority", newPriority)
            .execute();
      } else {
        // Set displayInHomepage false and clear priority
        return handle.createUpdate(
            "UPDATE \"savedSearches\" SET \"displayInHomepage\" = :displayInHomepage, priority = NULL WHERE uuid = :uuid")
            .bind("uuid", uuid).bind("displayInHomepage", false).execute();
      }
    } finally {
      closeDbHandle(handle);
    }
  }
}
