package mil.dds.anet.database;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.database.mappers.AdminSettingMapper;

public class AdminDao {

	public static enum AdminSettingKeys { 
		SECURITY_BANNER_TEXT,
		SECURITY_BANNER_COLOR, 
		DEFAULT_APPROVAL_ORGANIZATION,
		HELP_LINK_URL,
		CONTACT_EMAIL,
		DAILY_ROLLUP_MAX_REPORT_AGE_DAYS,
		EXTERNAL_DOCUMENTATION_LINK_URL,
		EXTERNAL_DOCUMENTATION_LINK_TEXT,		
		GENERAL_BANNER_LEVEL,
		GENERAL_BANNER_TEXT,
		GENERAL_BANNER_VISIBILITY,
	}

	private Handle dbHandle;
	private Map<String,String> cachedSettings = null;
	
	public AdminDao(Handle db) { 
		this.dbHandle = db;
	}

	private void initCache() { 
		cachedSettings = new HashMap<String,String>();
		List<AdminSetting> settings = getAllSettings();
		for (AdminSetting s : settings) {
			cachedSettings.put(s.getKey(), s.getValue());
		}
	}
	
	public String getSetting(AdminSettingKeys key) {
		if (cachedSettings == null) { initCache(); } 
		return cachedSettings.get(key.toString());
	}
	
	public List<AdminSetting> getAllSettings() { 
		return dbHandle.createQuery("/* getAllAdminSettings */ SELECT * FROM \"adminSettings\"")
				.map(new AdminSettingMapper())
				.list();
	}

	/**
	 * Saves an adminSetting to the database, inserting if it does not exist yet. 
	 */
	public int saveSetting(AdminSetting setting) {
		if (cachedSettings == null) { initCache(); }
		String sql; 
		if (cachedSettings.containsKey(setting.getKey())) {
			sql = "/* updateAdminSetting */ UPDATE \"adminSettings\" SET value = :value WHERE \"key\" = :key";
		} else { 
			sql = "/* insertAdminSetting */ INSERT INTO \"adminSettings\" (\"key\", value) VALUES (:key, :value)";
		}
		cachedSettings.put(setting.getKey(), setting.getValue());
		return dbHandle.createUpdate(sql)
			.bind("key", setting.getKey())
			.bind("value", setting.getValue())
			.execute();
	}

	
}
