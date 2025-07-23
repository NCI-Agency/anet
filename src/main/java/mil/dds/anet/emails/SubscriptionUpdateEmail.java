package mil.dds.anet.emails;

import java.util.Map;

public class SubscriptionUpdateEmail implements AnetEmailAction {

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
    // TODO decide on email content, linked to the AuditLog implementation
    return context;
  }
}
