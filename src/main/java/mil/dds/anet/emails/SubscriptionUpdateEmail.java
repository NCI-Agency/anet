package mil.dds.anet.emails;

import java.util.Map;

public class SubscriptionUpdateEmail implements AnetEmailAction {

  private String updatedObjectType;
  private String updatedObjectUuid;
  private boolean isNote;

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
    context.put("updatedObjectType", updatedObjectType);
    context.put("updatedObjectUuid", updatedObjectUuid);
    context.put("isNote", isNote);
    return context;
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

  public void setIsNote(boolean isNote) {
    this.isNote = isNote;
  }

  public boolean getIsNote() {
    return isNote;
  }
}
