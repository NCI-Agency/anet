package mil.dds.anet.database;

import java.util.Map;

public class SubscriptionUpdateStatement {
	public String objectType;
	public String sql;
	public Map<String, Object> params;

	public SubscriptionUpdateStatement(String objectType, String sql, Map<String, Object> params) {
		this.objectType = objectType;
		this.sql = sql;
		this.params = params;
	}
}
