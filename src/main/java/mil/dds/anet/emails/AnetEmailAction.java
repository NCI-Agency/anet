package mil.dds.anet.emails;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public interface AnetEmailAction {

	static final int MAX_REPORT_INTENT_LENGTH = 50;
	
	Map<String, Object> buildContext(Map<String, Object> context);
	
	@JsonIgnore
	String getTemplateName();
	
	@JsonIgnore
	String getSubject(Map<String, Object> context);
}
