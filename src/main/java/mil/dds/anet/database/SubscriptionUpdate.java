package mil.dds.anet.database;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class SubscriptionUpdate {
	public Instant updatedAt;
	public List<SubscriptionUpdateStatement> stmts;

	public SubscriptionUpdate(Instant updatedAt, List<SubscriptionUpdateStatement> stmts) {
		this.updatedAt = updatedAt;
		this.stmts = stmts;
	}

	public SubscriptionUpdate(Instant updatedAt, SubscriptionUpdateStatement stmt) {
		this(updatedAt, new ArrayList<>());
		this.stmts.add(stmt);
	}
}
