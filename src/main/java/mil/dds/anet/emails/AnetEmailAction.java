package mil.dds.anet.emails;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Report;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.utils.Utils;

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public interface AnetEmailAction {

  Map<String, Object> buildContext(Map<String, Object> context);

  @JsonIgnore
  String getTemplateName();

  @JsonIgnore
  String getSubject(Map<String, Object> context);

  @JsonIgnore
  default String getReportLabel(Report r) {
    return Utils.getReportLabel(ApplicationContextProvider.getDictionary(), r);
  }

  default AnetObjectEngine engine() {
    return ApplicationContextProvider.getEngine();
  }
}
