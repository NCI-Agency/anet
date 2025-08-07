package mil.dds.anet.database;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import mil.dds.anet.beans.Preference;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PreferenceSearchQuery;
import mil.dds.anet.database.mappers.PreferenceMapper;
import mil.dds.anet.search.pg.PostgresqlPreferenceSearcher;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PreferenceDao extends AnetBaseDao<Preference, PreferenceSearchQuery> {

  public static final String[] fields = {"uuid", "name", "type", "category", "description",
      "defaultValue", "allowedValues", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "preferences";
  public static final String PREFERENCE_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public PreferenceDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public AnetBeanList<Preference> search(PreferenceSearchQuery query) {
    return search(null, query);
  }

  public AnetBeanList<Preference> search(Set<String> subFields, PreferenceSearchQuery query) {
    return new PostgresqlPreferenceSearcher(databaseHandler).runSearch(subFields, query);
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
          "/* preferenceInsert */ INSERT INTO \"preferences\" (uuid, name, type, category, description, \"defaultValue\", \"allowedValues\",  "
              + "\"createdAt\", \"updatedAt\") "
              + " VALUES (:uuid, :name, :type, :category, :description, :value, :allowedValues, :createdAt, :updatedAt)")
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
          "/* preferencesUpdate */ UPDATE preferences SET name = :name, type = :type, category = :category, description = :description, "
              + "\"defaultValue\" = :defaultValue, \"allowedValues\" = :allowedValues WHERE uuid = :uuid")
          .bindBean(p).bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("name", p.getName()).bind("type", p.getType()).bind("category", p.getCategory())
          .bind("description", p.getDescription()).bind("defaultValue", p.getDefaultValue())
          .bind("allowedValues", p.getAllowedValues()).execute();
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

  /*
   * @return: number of rows updated.
   */
  public int updatePreferenceValue(Preference p) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* preferencesUpdateValue */ UPDATE preferences SET  \"defaultValue\" = :defaultValue WHERE uuid = :uuid")
          .bindBean(p).bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
          .bind("defaultValue", p.getDefaultValue()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }
}
