package mil.dds.anet.emails;

import java.util.Map;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Tenant;

public class TenantAccessRequestEmail implements AnetEmailAction {
  private String tenantUuid;
  private String personUuid;

  @Override
  public String getTemplateName() {
    return "/emails/tenantAccessRequest.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "An ANET user requests access to your tenant";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    final Tenant t = engine().getTenantDao().getByUuid(tenantUuid);
    if (t == null) {
      return null;
    }

    final Person p = engine().getPersonDao().getByUuid(personUuid);
    if (p == null) {
      return null;
    }

    context.put("tenant", t);
    context.put("person", p);

    return context;
  }

  public String getTenantUuid() {
    return tenantUuid;
  }

  public void setTenantUuid(String tenantUuid) {
    this.tenantUuid = tenantUuid;
  }

  public String getPersonUuid() {
    return personUuid;
  }

  public void setPersonUuid(String personUuid) {
    this.personUuid = personUuid;
  }
}
