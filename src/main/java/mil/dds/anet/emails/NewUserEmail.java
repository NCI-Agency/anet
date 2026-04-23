package mil.dds.anet.emails;

import java.util.Map;
import mil.dds.anet.beans.Person;

public class NewUserEmail implements AnetEmailAction {
  private String personUuid;

  @Override
  public String getTemplateName() {
    return "/emails/newUser.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "New ANET user needs approval";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    final Person p = engine().getPersonDao().getByUuid(personUuid);
    if (p == null) {
      return null;
    }

    context.put("person", p);

    return context;
  }

  public String getPersonUuid() {
    return personUuid;
  }

  public void setPersonUuid(String personUuid) {
    this.personUuid = personUuid;
  }
}
