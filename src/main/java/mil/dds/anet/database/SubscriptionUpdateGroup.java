package mil.dds.anet.database;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class SubscriptionUpdateGroup {
	public String objectType;
	public String objectUuid;
	public Instant updatedAt;
	public List<SubscriptionUpdateStatement> stmts;
	public boolean isNote;

	public SubscriptionUpdateGroup(String objectType, String objectUuid, Instant updatedAt, List<SubscriptionUpdateStatement> stmts, boolean isNote) {
		this.objectType = objectType;
		this.objectUuid = objectUuid;
		this.updatedAt = updatedAt;
		this.stmts = stmts;
		this.isNote = isNote;
	}

	public SubscriptionUpdateGroup(String objectType, String objectUuid, Instant updatedAt, List<SubscriptionUpdateStatement> stmts) {
		this(objectType, objectUuid, updatedAt, stmts, false);
	}

	public SubscriptionUpdateGroup(String objectType, String objectUuid, Instant updatedAt, SubscriptionUpdateStatement stmt) {
		this(objectType, objectUuid, updatedAt, new ArrayList<>());
		this.stmts.add(stmt);
	}

	public SubscriptionUpdateGroup(String objectType, String objectUuid, Instant updatedAt, SubscriptionUpdateStatement stmt, boolean isNote) {
		this(objectType, objectUuid, updatedAt, new ArrayList<>(), isNote);
		this.stmts.add(stmt);
	}

	public boolean isValid() {
		return this.objectType != null && this.objectUuid != null && this.updatedAt != null && this.stmts != null;
	}
}
