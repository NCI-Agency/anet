package mil.dds.anet.emails;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public abstract class AnetEmailAction {

	protected static final int MAX_REPORT_INTENT_LENGTH = 50;

	String templateName;
	String subject;
	
	public abstract Map<String,Object> execute();
	
	public String getTemplateName() {
		return templateName;
	}
	
	public void setTemplateName(String templateName) {
		this.templateName = templateName;
	}
	
	public String getSubject() {
		return subject;
	}
	
	public void setSubject(String subject) {
		this.subject = subject;
	}
}
