package mil.dds.anet.views;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import mil.dds.anet.beans.Person;
import org.apache.commons.text.StringEscapeUtils;

public class IndexView extends SimpleView {
  private Person currentUser;
  private String securityBannerText;
  private String securityBannerColor;
  private Map<String, Object> dictionary;

  public IndexView(String path) {
    super(path);
  }

  public Person getCurrentUser() {
    return currentUser;
  }

  public void setCurrentUser(Person currentUser) {
    this.currentUser = currentUser;
  }

  public String getSecurityBannerText() {
    return securityBannerText;
  }

  public void setSecurityBannerText(String securityBannerText) {
    this.securityBannerText = securityBannerText;
  }

  public String getSecurityBannerColor() {
    return securityBannerColor;
  }

  public void setSecurityBannerColor(String securityBannerColor) {
    this.securityBannerColor = securityBannerColor;
  }

  public Map<String, Object> getDictionary() {
    return dictionary;
  }

  public void setDictionary(Map<String, Object> dictionary) {
    this.dictionary = dictionary;
  }

  // TODO: should try to pass the dictionary to the client as literal JSON instead of serializing it
  // to a string
  public String getSerializedDictionary() throws JsonProcessingException {
    final ObjectMapper jsonMapper = new ObjectMapper();
    return StringEscapeUtils.escapeEcmaScript(jsonMapper.writeValueAsString(dictionary));
  }

}
