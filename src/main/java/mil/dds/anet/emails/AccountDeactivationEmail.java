package mil.dds.anet.emails;

import java.util.Map;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;

public class AccountDeactivationEmail implements AnetEmailAction {

	private Person person;

	@Override
	public String getTemplateName() {
		return "/emails/accountDeactivation.tflh";
	}

	@Override
	public String getSubject(Map<String, Object> context) {
		return "ANET Account Deactivation";
	}

	@Override
	public Map<String, Object> buildContext(Map<String, Object> context) {
		Person p = AnetObjectEngine.getInstance().getPersonDao().getByUuid(person.getUuid());
		context.put("person", p);

		return context;
	}

	public Person getPerson() {
		return person;
	}

	public void setPerson(Person person) {
		this.person = Person.createWithUuid(person.getUuid());
	}

}
