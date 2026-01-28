package mil.dds.anet.emails;

import java.time.Instant;
import java.util.Map;
import mil.dds.anet.beans.AuditTrail;
import mil.dds.anet.beans.SubscribableObject;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.SubscriptionUpdate;

public class SubscriptionUpdateEmail implements AnetEmailAction {

  private String subscriptionUuid;
  private String updatedObjectType;
  private String updatedObjectUuid;
  private String auditTrailUuid;
  private boolean isNote;
  private Instant createdAt;

  @Override
  public String getTemplateName() {
    return "/emails/subscriptionUpdate.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "Subscription update";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    context.put("subscription", loadSubscription());
    context.put("updatedObjectType", updatedObjectType);
    context.put("updatedObjectUuid", updatedObjectUuid);
    context.put("updatedObject", loadUpdatedObject());
    context.put("auditTrail", loadAuditTrail());
    context.put("isNote", isNote);
    context.put("createdAt", createdAt);
    return context;
  }

  public String getSubscriptionUuid() {
    return subscriptionUuid;
  }

  public Subscription loadSubscription() {
    return engine().getSubscriptionDao().getByUuid(subscriptionUuid);
  }

  public void setSubscriptionUuid(String subscriptionUuid) {
    this.subscriptionUuid = subscriptionUuid;
  }

  public void setUpdatedObjectType(String updatedObjectType) {
    this.updatedObjectType = updatedObjectType;
  }

  public String getUpdatedObjectType() {
    return updatedObjectType;
  }

  public void setUpdatedObjectUuid(String updatedObjectUuid) {
    this.updatedObjectUuid = updatedObjectUuid;
  }

  public String getUpdatedObjectUuid() {
    return updatedObjectUuid;
  }

  public SubscribableObject loadUpdatedObject() {
    final SubscriptionUpdate subscriptionUpdate = new SubscriptionUpdate();
    subscriptionUpdate.setUpdatedObjectType(updatedObjectType);
    subscriptionUpdate.setUpdatedObjectUuid(updatedObjectUuid);
    return subscriptionUpdate.loadUpdatedObject(engine().getContext()).join();
  }

  public String getAuditTrailUuid() {
    return auditTrailUuid;
  }

  public void setAuditTrailUuid(String auditTrailUuid) {
    this.auditTrailUuid = auditTrailUuid;
  }

  public AuditTrail loadAuditTrail() {
    final SubscriptionUpdate subscriptionUpdate = new SubscriptionUpdate();
    subscriptionUpdate.setAuditTrailUuid(auditTrailUuid);
    return subscriptionUpdate.loadAuditTrail(engine().getContext()).join();
  }

  public void setIsNote(boolean isNote) {
    this.isNote = isNote;
  }

  public boolean getIsNote() {
    return isNote;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
