package mil.dds.anet.emails;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public interface AnetEmailAction {

	static final int MAX_REPORT_INTENT_LENGTH = 50;
	
	void buildContext(Map<String,Object> context);
	
	String getTemplateName();
	
	String getSubject(Map<String,Object> context);
}
