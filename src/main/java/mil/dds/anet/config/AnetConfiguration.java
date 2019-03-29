package mil.dds.anet.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.collect.ImmutableMap;
import io.dropwizard.Configuration;
import io.dropwizard.db.DataSourceFactory;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import mil.dds.anet.utils.Utils;

public class AnetConfiguration extends Configuration {

  private boolean developmentMode;
  private boolean redirectToHttps = false;

  private SmtpConfiguration smtp;
  private String emailFromAddr;
  private String serverUrl;

  private Map<String, Object> dictionary;

  private boolean timeWaffleRequests;

  @NotNull
  private Map<String, String> waffleConfig = new HashMap<String, String>();

  @Valid
  @NotNull
  private DataSourceFactory database = new DataSourceFactory();

  @NotNull
  private Map<String, Map<String, String>> views = Collections.emptyMap();

  @JsonProperty("database")
  public void setDataSourceFactory(DataSourceFactory factory) {
    this.database = factory;
  }

  @JsonProperty("database")
  public DataSourceFactory getDataSourceFactory() {
    return database;
  }

  public boolean isDevelopmentMode() {
    return developmentMode;
  }

  public void setDevelopmentMode(boolean developmentMode) {
    this.developmentMode = developmentMode;
  }

  public boolean getRedirectToHttps() {
    return redirectToHttps;
  }

  public void setRedirectToHttps(boolean redirectToHttps) {
    this.redirectToHttps = redirectToHttps;
  }

  @JsonProperty("views")
  public Map<String, Map<String, String>> getViews() {
    return views;
  }

  @JsonProperty("views")
  public void setViews(Map<String, Map<String, String>> views) {
    final ImmutableMap.Builder<String, Map<String, String>> builder = ImmutableMap.builder();
    for (Map.Entry<String, Map<String, String>> entry : views.entrySet()) {
      builder.put(entry.getKey(), ImmutableMap.copyOf(entry.getValue()));
    }
    this.views = builder.build();
  }

  public boolean isTimeWaffleRequests() {
    return timeWaffleRequests;
  }

  public void setTimeWaffleRequests(boolean timeWaffleRequests) {
    this.timeWaffleRequests = timeWaffleRequests;
  }

  public Map<String, String> getWaffleConfig() {
    return waffleConfig;
  }

  public void setWaffleConfig(Map<String, String> config) {
    this.waffleConfig = config;
  }

  public SmtpConfiguration getSmtp() {
    return smtp;
  }

  public void setSmtp(SmtpConfiguration smtp) {
    this.smtp = smtp;
  }

  public String getEmailFromAddr() {
    return emailFromAddr;
  }

  public void setEmailFromAddr(String emailFromAddr) {
    this.emailFromAddr = emailFromAddr;
  }

  public String getServerUrl() {
    return serverUrl;
  }

  public void setServerUrl(String serverUrl) {
    this.serverUrl = serverUrl;
  }

  public Map<String, Object> getDictionary() {
    return dictionary;
  }

  public void setDictionary(Map<String, Object> dictionary) {
    this.dictionary = dictionary;
  }

  @SuppressWarnings("unchecked")
  public Object getDictionaryEntry(String keyPath) {
    if (Utils.isEmptyOrNull(keyPath)) {
      return null;
    }
    Object elem = dictionary;
    for (final String key : keyPath.split("\\.")) {
      elem = ((Map<String, Object>) elem).get(key);
    }
    return elem;
  }

  public static class SmtpConfiguration {
    private String hostname;
    private Integer port = 587;
    private String username;
    private String password;
    private Boolean startTls = true;
    private boolean disabled = false;
    private Integer nbOfHoursForStaleEmails;

    public String getHostname() {
      return hostname;
    }

    public void setHostname(String hostname) {
      this.hostname = hostname;
    }

    public Integer getPort() {
      return port;
    }

    public void setPort(Integer port) {
      this.port = port;
    }

    public String getUsername() {
      return username;
    }

    public void setUsername(String username) {
      this.username = username;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }

    public Boolean getStartTls() {
      return startTls;
    }

    public void setStartTls(Boolean startTls) {
      this.startTls = startTls;
    }

    public boolean isDisabled() {
      return disabled;
    }

    public void setDisabled(boolean disabled) {
      this.disabled = disabled;
    }

    public Integer getNbOfHoursForStaleEmails() {
      return nbOfHoursForStaleEmails;
    }

    public void setNbOfHoursForStaleEmails(Integer hours) {
      this.nbOfHoursForStaleEmails = hours;
    }
  }


}
