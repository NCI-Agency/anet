package mil.dds.anet.database;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class SubscriptionUpdateGroup {
  private final String objectType;
  private final String objectUuid;
  private final String auditTrailUuid;
  private final Instant updatedAt;
  private final List<SubscriptionUpdateStatement> stmts;
  private final boolean isNote;

  public SubscriptionUpdateGroup(String objectType, String objectUuid, String auditTrailUuid,
      Instant updatedAt, List<SubscriptionUpdateStatement> stmts, boolean isNote) {
    this.objectType = objectType;
    this.objectUuid = objectUuid;
    this.auditTrailUuid = auditTrailUuid;
    this.updatedAt = updatedAt;
    this.stmts = stmts;
    this.isNote = isNote;
  }

  public SubscriptionUpdateGroup(String objectType, String objectUuid, String auditTrailUuid,
      Instant updatedAt, List<SubscriptionUpdateStatement> stmts) {
    this(objectType, objectUuid, auditTrailUuid, updatedAt, stmts, false);
  }

  public SubscriptionUpdateGroup(String objectType, String objectUuid, String auditTrailUuid,
      Instant updatedAt, SubscriptionUpdateStatement stmt) {
    this(objectType, objectUuid, auditTrailUuid, updatedAt, new ArrayList<>());
    this.stmts.add(stmt);
  }

  public SubscriptionUpdateGroup(String objectType, String objectUuid, String auditTrailUuid,
      Instant updatedAt, SubscriptionUpdateStatement stmt, boolean isNote) {
    this(objectType, objectUuid, auditTrailUuid, updatedAt, new ArrayList<>(), isNote);
    this.stmts.add(stmt);
  }

  public boolean isValid() {
    return this.objectType != null && this.objectUuid != null && this.updatedAt != null
        && this.stmts != null;
  }

  public String getObjectType() {
    return objectType;
  }

  public String getObjectUuid() {
    return objectUuid;
  }

  public String getAuditTrailUuid() {
    return auditTrailUuid;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public List<SubscriptionUpdateStatement> getStmts() {
    return stmts;
  }

  public boolean isNote() {
    return isNote;
  }
}
