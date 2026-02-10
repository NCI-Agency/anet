package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.SavedSearch;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.SavedSearchMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SavedSearchDao extends AnetBaseDao<SavedSearch, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "savedSearches";

  private static final String GET_MAX_FMT =
      "(SELECT COALESCE(MAX(%1$s) + 1, 0) FROM \"savedSearches\" WHERE \"ownerUuid\" = (%2$s))";

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
  public List<SavedSearch> getSearchesByOwner(Person owner, boolean forHomepage) {
    final Handle handle = getDbHandle();
    try {
      final StringBuilder sql = new StringBuilder(
          "/* getSavedSearchByOwner */ SELECT * FROM \"savedSearches\" WHERE \"ownerUuid\" = :ownerUuid");
      if (forHomepage) {
        sql.append(" AND \"displayInHomepage\" IS TRUE");
        sql.append(" ORDER BY \"homepagePriority\" NULLS LAST");
      } else {
        sql.append(" ORDER BY priority NULLS LAST");
      }
      return handle.createQuery(sql).bind("ownerUuid", owner.getUuid()).map(new SavedSearchMapper())
          .list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public SavedSearch insertInternal(SavedSearch obj) {
    final Handle handle = getDbHandle();
    try {
      final String getMaxPriority = String.format(GET_MAX_FMT, "priority", ":ownerUuid");
      final String getMaxHomepagePriority =
          String.format(GET_MAX_FMT, "\"homepagePriority\"", ":ownerUuid");
      return handle
          .createQuery("/* insertSavedSearch */ INSERT INTO \"savedSearches\" "
              + "(uuid, \"ownerUuid\", name, \"objectType\", query, \"createdAt\", \"updatedAt\", "
              + "\"displayInHomepage\", priority, \"homepagePriority\") "
              + "SELECT :uuid, :ownerUuid, :name, :objectType, :query, :createdAt, :updatedAt, "
              + ":displayInHomepage, " + getMaxPriority + ", "
              + "CASE WHEN :displayInHomepage THEN " + getMaxHomepagePriority
              + " ELSE NULL END RETURNING *")
          .bindBean(obj).bind("createdAt", DaoUtils.asLocalDateTime(obj.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(obj.getUpdatedAt()))
          .bind("objectType", DaoUtils.getEnumId(obj.getObjectType())).map(new SavedSearchMapper())
          .first();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(SavedSearch obj) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate(
              "/* updateSavedSearch */ UPDATE \"savedSearches\" SET \"updatedAt\" = :updatedAt,"
                  + " \"displayInHomepage\" = :displayInHomepage, priority = :priority, "
                  + "\"homepagePriority\" = :homepagePriority WHERE uuid = :uuid")
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

}
