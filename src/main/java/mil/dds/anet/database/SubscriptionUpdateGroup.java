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

  public SubscriptionUpdateGroup(String objectType, String objectUuid, Instant updatedAt,
      List<SubscriptionUpdateStatement> stmts, boolean isNote) {
    this.objectType = objectType;
    this.objectUuid = objectUuid;
    this.updatedAt = updatedAt;
    this.stmts = stmts;
    this.isNote = isNote;
  }

  public SubscriptionUpdateGroup(String objectType, String objectUuid, Instant updatedAt,
      List<SubscriptionUpdateStatement> stmts) {
    this(objectType, objectUuid, updatedAt, stmts, false);
  }

  public SubscriptionUpdateGroup(String objectType, String objectUuid, Instant updatedAt,
      SubscriptionUpdateStatement stmt) {
    this(objectType, objectUuid, updatedAt, new ArrayList<>());
    this.stmts.add(stmt);
  }

  public SubscriptionUpdateGroup(String objectType, String objectUuid, Instant updatedAt,
      SubscriptionUpdateStatement stmt, boolean isNote) {
    this(objectType, objectUuid, updatedAt, new ArrayList<>(), isNote);
    this.stmts.add(stmt);
  }

  public boolean isValid() {
    return this.objectType != null && this.objectUuid != null && this.updatedAt != null
        && this.stmts != null;
  }

  public String getObjectType() {
    return objectType;
  }

  public void setObjectType(String objectType) {
    this.objectType = objectType;
  }

  public String getObjectUuid() {
    return objectUuid;
  }

  public void setObjectUuid(String objectUuid) {
    this.objectUuid = objectUuid;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public List<SubscriptionUpdateStatement> getStmts() {
    return stmts;
  }

  public void setStmts(List<SubscriptionUpdateStatement> stmts) {
    this.stmts = stmts;
  }

  public boolean isNote() {
    return isNote;
  }

  public void setNote(boolean note) {
    isNote = note;
  }
}
