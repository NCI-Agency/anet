package mil.dds.anet.database;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.beans.MergedEntity;
import mil.dds.anet.database.mappers.AdminSettingMapper;
import mil.dds.anet.database.mappers.MergedEntityMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminDao extends AbstractDao implements InitializingBean {

  public enum AdminSettingKeys {
    DEFAULT_APPROVAL_ORGANIZATION, DAILY_ROLLUP_MAX_REPORT_AGE_DAYS,
    EXTERNAL_DOCUMENTATION_LINK_URL, EXTERNAL_DOCUMENTATION_LINK_TEXT, GENERAL_BANNER_LEVEL,
    GENERAL_BANNER_TEXT, GENERAL_BANNER_VISIBILITY, UNLIMITED_EXPORTS_AUTHORIZATION_GROUP, HELP_TEXT
  }

  private Map<String, String> cachedSettings = null;
  private static final Object cachedSettingsLock = new Object();

  public AdminDao(final DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    initCache();
  }

  private void initCache() {
    synchronized (cachedSettingsLock) {
      if (cachedSettings == null) {
        cachedSettings = new HashMap<>();
        for (final AdminSetting s : getAllSettings()) {
          cachedSettings.put(s.getKey(), s.getValue());
        }
      }
    }
  }

  public String getSetting(AdminSettingKeys key) {
    return cachedSettings.get(key.toString());
  }

  @Transactional
  public List<AdminSetting> getAllSettings() {
    final Handle handle = getDbHandle();
    try {
      return handle.createQuery("/* getAllAdminSettings */ SELECT * FROM \"adminSettings\"")
          .map(new AdminSettingMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  /** Saves an adminSetting to the database, inserting if it does not exist yet. */
  @Transactional
  public int saveSetting(AdminSetting setting) {
    final Handle handle = getDbHandle();
    try {
      initCache();
      final String sql;
      synchronized (cachedSettingsLock) {
        sql = cachedSettings.containsKey(setting.getKey())
            ? "/* updateAdminSetting */ UPDATE \"adminSettings\" SET value = :value WHERE \"key\" = :key"
            : "/* insertAdminSetting */ INSERT INTO \"adminSettings\" (\"key\", value) VALUES (:key, :value)";
        cachedSettings.put(setting.getKey(), setting.getValue());
      }
      return handle.createUpdate(sql).bind("key", setting.getKey())
          .bind("value", setting.getValue()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void updateMaterializedView(String viewName) {
    // Can't use a prepared statement with a parameter here, alas
    final Handle handle = getDbHandle();
    try {
      handle.execute(String.format("REFRESH MATERIALIZED VIEW CONCURRENTLY \"%1$s\"", viewName));
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public List<MergedEntity> getMergedEntities() {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery("/* getMergedEntities */ SELECT \"oldUuid\", \"newUuid\" "
              + "FROM \"mergedEntities\" ORDER BY \"createdAt\"")
          .map(new MergedEntityMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int insertMergedEntity(final MergedEntity mergedEntity) {
    final Handle handle = getDbHandle();
    try {
      final String sql = "/* insertMergedEntity */ INSERT INTO \"mergedEntities\" "
          + "( \"oldUuid\", \"newUuid\", \"createdAt\" ) VALUES ( :oldUuid, :newUuid, :mergeDate )";
      return handle.createUpdate(sql).bind("oldUuid", mergedEntity.oldUuid())
          .bind("newUuid", mergedEntity.newUuid())
          .bind("mergeDate", DaoUtils.asLocalDateTime(mergedEntity.mergeDate())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int updateMergedEntity(final String tableName, final String columnName,
      final MergedEntity mergedEntity) {
    final Handle handle = getDbHandle();
    try {
      final String sql = String.format("/* updateMergedEntity */ UPDATE \"%1$s\" "
          + "SET \"%2$s\" = regexp_replace(\"%2$s\", %3$s, :newUuid, 'g') WHERE \"%2$s\" ~ %3$s",
          tableName, columnName, "('\\m' || :oldUuid || '\\M')");
      return handle.createUpdate(sql).bind("oldUuid", mergedEntity.oldUuid())
          .bind("newUuid", mergedEntity.newUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int deleteMergedEntity(final MergedEntity mergedEntity) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* deleteMergedEntity */ DELETE FROM \"mergedEntities\" "
              + "WHERE \"oldUuid\" = :oldUuid AND \"newUuid\" = :newUuid")
          .bind("oldUuid", mergedEntity.oldUuid()).bind("newUuid", mergedEntity.newUuid())
          .execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public String getDefaultOrgUuid() {
    return getSetting(AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION);
  }
}
