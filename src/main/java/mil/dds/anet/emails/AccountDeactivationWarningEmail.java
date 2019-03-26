package mil.dds.anet.emails;

import java.util.Map;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;

public class AccountDeactivationWarningEmail implements AnetEmailAction {

	private Person person;

	private int daysUntilEndOfTour;

	@Override
	public String getTemplateName() {
		return "/emails/deactivationWarning.tflh";
	}

	@Override
	public String getSubject(Map<String, Object> context) {
		return "ANET Upcoming Account Deactivation";
	}

	@Override
	public Map<String, Object> buildContext(Map<String, Object> context) {
		Person p = AnetObjectEngine.getInstance().getPersonDao().getByUuid(person.getUuid());
		context.put("person", p);
		context.put("daysUntilEndOfTour", daysUntilEndOfTour);

		return context;
	}

	public Person getPerson() {
		return person;
	}

	public void setPerson(Person person) {
		this.person = Person.createWithUuid(person.getUuid());
	}

	public int getDaysUntilEndOfTour() {
		return daysUntilEndOfTour;
	}

	public void setDaysUntilEndOfTour(int daysUntilEndOfTour) {
		this.daysUntilEndOfTour = daysUntilEndOfTour;
	}

}
