package mil.dds.anet.database;

import java.util.Collections;
import java.util.List;
import mil.dds.anet.beans.Preference;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.PreferenceMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PreferenceDao extends AnetBaseDao<Preference, AbstractSearchQuery<?>> {

  public static final String[] fields =
      {"uuid", "name", "type", "description", "defaultValue", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "preferences";
  public static final String PREFERENCE_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public PreferenceDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Transactional
  public List<Preference> getAllPreferences() {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery("/* getAllPreferences */ SELECT " + PREFERENCE_FIELDS + " FROM preferences")
          .map(new PreferenceMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }


  @Override
  public Preference insertInternal(Preference p) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate(
          "/* preferenceInsert */ INSERT INTO \"preferences\" (uuid, name, type, description, \"defaultValue\", "
              + "\"createdAt\", \"updatedAt\") "
              + " VALUES (:uuid, :name, :type, :description, :value, :createdAt, :updatedAt)")
          .bindBean(p).bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt())).execute();
      return p;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public Preference getByUuid(String uuid) {
    return getByIds(Collections.singletonList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Preference> {
    private static final String SQL = "/* batch.getPreferencesByUuids */ SELECT "
        + PREFERENCE_FIELDS + "FROM preferences WHERE preferences.uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(PreferenceDao.this.databaseHandler, SQL, "uuids", new PreferenceMapper());
    }
  }

  @Override
  public List<Preference> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  /*
   * @return: number of rows updated.
   */
  @Override
  public int updateInternal(Preference p) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* preferencesUpdate */ UPDATE preferences SET name = :name, type = :type, description = :description, "
              + "\"defaultValue\" = :defaultValue WHERE uuid = :uuid")
          .bindBean(p).bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("name", p.getName()).bind("type", p.getType())
          .bind("description", p.getDescription()).bind("defaultValue", p.getDefaultValue())
          .execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int deleteInternal(String preferenceUuid) {
    final Handle handle = getDbHandle();
    try {
      handle.execute("DELETE FROM preferences WHERE uuid = ?", preferenceUuid);
      // Delete preference
      return handle.createUpdate("DELETE FROM preferences WHERE uuid = :preferenceUuid")
          .bind("preferenceUuid", preferenceUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }
}
