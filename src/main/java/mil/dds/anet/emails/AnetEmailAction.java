package mil.dds.anet.emails;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.config.ApplicationContextProvider;

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public interface AnetEmailAction {

  int MAX_REPORT_INTENT_LENGTH = 50;

  Map<String, Object> buildContext(Map<String, Object> context);

  @JsonIgnore
  String getTemplateName();

  @JsonIgnore
  String getSubject(Map<String, Object> context);

  default AnetObjectEngine engine() {
    return ApplicationContextProvider.getEngine();
  }
}
