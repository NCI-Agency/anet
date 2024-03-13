package mil.dds.anet.database;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.database.mappers.AdminSettingMapper;
import org.jdbi.v3.core.Handle;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class AdminDao {

  public static enum AdminSettingKeys {
    SECURITY_BANNER_CLASSIFICATION, SECURITY_BANNER_RELEASABILITY, SECURITY_BANNER_COLOR,
    DEFAULT_APPROVAL_ORGANIZATION, HELP_LINK_URL, CONTACT_EMAIL, DAILY_ROLLUP_MAX_REPORT_AGE_DAYS,
    EXTERNAL_DOCUMENTATION_LINK_URL, EXTERNAL_DOCUMENTATION_LINK_TEXT, GENERAL_BANNER_LEVEL,
    GENERAL_BANNER_TEXT, GENERAL_BANNER_VISIBILITY,
  }

  @Inject
  private Provider<Handle> handle;
  private Map<String, String> cachedSettings = null;
  private static final Object cachedSettingsLock = new Object();

  protected Handle getDbHandle() {
    return handle.get();
  }

  private void initCache() {
    synchronized (cachedSettingsLock) {
      if (cachedSettings == null) {
        cachedSettings = new HashMap<String, String>();
        for (final AdminSetting s : getAllSettings()) {
          cachedSettings.put(s.getKey(), s.getValue());
        }
      }
    }
  }

  public String getSetting(AdminSettingKeys key) {
    initCache();
    return cachedSettings.get(key.toString());
  }

  @InTransaction
  public List<AdminSetting> getAllSettings() {
    return getDbHandle().createQuery("/* getAllAdminSettings */ SELECT * FROM \"adminSettings\"")
        .map(new AdminSettingMapper()).list();
  }

  /**
   * Saves an adminSetting to the database, inserting if it does not exist yet.
   */
  @InTransaction
  public int saveSetting(AdminSetting setting) {
    initCache();
    final String sql;
    synchronized (cachedSettingsLock) {
      sql = cachedSettings.containsKey(setting.getKey())
          ? "/* updateAdminSetting */ UPDATE \"adminSettings\" SET value = :value WHERE \"key\" = :key"
          : "/* insertAdminSetting */ INSERT INTO \"adminSettings\" (\"key\", value) VALUES (:key, :value)";
      cachedSettings.put(setting.getKey(), setting.getValue());
    }
    return getDbHandle().createUpdate(sql).bind("key", setting.getKey())
        .bind("value", setting.getValue()).execute();
  }

  @InTransaction
  public void updateMaterializedView(String viewName) {
    // Can't use a prepared statement with a parameter here, alas
    getDbHandle()
        .execute(String.format("REFRESH MATERIALIZED VIEW CONCURRENTLY \"%1$s\"", viewName));
  }
}
