package mil.dds.anet.emails;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;

public class AccountDeactivationWarningEmail implements AnetEmailAction {

  private Person person;

  private Instant nextReminder;

  private static final String nextEmailTemplate =
      "Another friendly email reminder will be sent on %s.\n";

  @Override
  public String getTemplateName() {
    return "/emails/deactivationWarning.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "ANET Upcoming Account Inactivation";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    Person p = AnetObjectEngine.getInstance().getPersonDao().getByUuid(person.getUuid());
    context.put("person", p);
    context.put("nextEmailRemainder", nextEmailRemainder(context));

    return context;
  }

  private String nextEmailRemainder(Map<String, Object> context) {
    return this.nextReminder == null ? ""
        : String.format(nextEmailTemplate, this.formatDate(context, this.nextReminder));
  }

  private String formatDate(Map<String, Object> context, Instant date) {
    DateTimeFormatter dtf = (DateTimeFormatter) context.get("dateFormatter");
    return dtf.format(date);
  }

  public Person getPerson() {
    return person;
  }

  public void setPerson(Person person) {
    this.person = Person.createWithUuid(person.getUuid());
  }

  public Instant getNextReminder() {
    return this.nextReminder;
  }

  public void setNextReminder(Instant nextReminder) {
    this.nextReminder = nextReminder;
  }
}
