package mil.dds.anet.config;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.util.Map;
import mil.dds.anet.utils.AnetConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "anet")
@EnableConfigurationProperties
public class AnetConfig {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

  private final Object versionLock = new Object();

  private boolean redirectToHttps = false;
  private Long graphqlRequestTimeoutMs;
  private boolean automaticallyInactivateUsers;

  private SmtpConfiguration smtp;

  private String emailFromAddr;
  private String serverUrl;

  private String anetDictionaryName;

  private String imageryPath;
  private String dashboardsPath;

  @JsonIgnore
  private String version;

  private KeycloakConfiguration keycloakConfiguration = new KeycloakConfiguration();

  public boolean getRedirectToHttps() {
    return redirectToHttps;
  }

  public void setRedirectToHttps(boolean redirectToHttps) {
    this.redirectToHttps = redirectToHttps;
  }

  public Long getGraphqlRequestTimeoutMs() {
    return graphqlRequestTimeoutMs;
  }

  public void setGraphqlRequestTimeoutMs(Long graphqlRequestTimeoutMs) {
    this.graphqlRequestTimeoutMs = graphqlRequestTimeoutMs;
  }

  public boolean isAutomaticallyInactivateUsers() {
    return automaticallyInactivateUsers;
  }

  public void setAutomaticallyInactivateUsers(boolean automaticallyInactivateUsers) {
    this.automaticallyInactivateUsers = automaticallyInactivateUsers;
  }

  public KeycloakConfiguration getKeycloakConfiguration() {
    return keycloakConfiguration;
  }

  public void setKeycloakConfiguration(KeycloakConfiguration keycloakConfiguration) {
    this.keycloakConfiguration = keycloakConfiguration;
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

  public String getAnetDictionaryName() {
    return anetDictionaryName;
  }

  /**
   * The AnetConfig class is used as the object representation of the YAML configuration file.
   * During start-up phase, parametric values are read from the application.yml file and their set
   * methods are called automatically. The parameter to be set when this method is called is the
   * anetDictionaryName which is read from the application.yml file. This parameter shows the full
   * path to the dictionary to be loaded.
   *
   * @param anetDictionaryName Full path of the dictionary to be loaded, read from application.yml
   */
  public void setAnetDictionaryName(String anetDictionaryName) {
    this.anetDictionaryName = anetDictionaryName;
  }

  public String getImageryPath() {
    return imageryPath;
  }

  public void setImageryPath(String imageryPath) {
    this.imageryPath = imageryPath;
  }

  public String getDashboardsPath() {
    return dashboardsPath;
  }

  public void setDashboardsPath(String dashboardsPath) {
    this.dashboardsPath = dashboardsPath;
  }

  public static class KeycloakConfiguration {
    private String realm;
    private String authServerUrl;
    private String resource;
    private boolean showLogoutLink;

    public String getRealm() {
      return this.realm;
    }

    public void setRealm(String realm) {
      this.realm = realm;
    }

    public String getAuthServerUrl() {
      return this.authServerUrl;
    }

    public void setAuthServerUrl(String authServerUrl) {
      this.authServerUrl = authServerUrl;
    }

    public String getResource() {
      return this.resource;
    }

    public void setResource(String resource) {
      this.resource = resource;
    }

    public boolean isShowLogoutLink() {
      return showLogoutLink;
    }

    public void setShowLogoutLink(boolean showLogoutLink) {
      this.showLogoutLink = showLogoutLink;
    }
  }

  public static class SmtpConfiguration {
    private String hostname;
    private int port = 587;
    private String username;
    private String password;
    private boolean startTls = true;
    private boolean disabled;
    private Integer nbOfHoursForStaleEmails;
    private String sslTrust;

    public String getHostname() {
      return hostname;
    }

    public void setHostname(String hostname) {
      this.hostname = hostname;
    }

    public int getPort() {
      return port;
    }

    public void setPort(int port) {
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

    public boolean getStartTls() {
      return startTls;
    }

    public void setStartTls(boolean startTls) {
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

    public String getSslTrust() {
      return (sslTrust != null) ? sslTrust : hostname;
    }

    public void setSslTrust(String sslTrust) {
      this.sslTrust = sslTrust;
    }
  }

  public String getVersion() {
    synchronized (versionLock) {
      if (version == null) {
        try (final InputStream inputStream =
            this.getClass().getResourceAsStream("/version.properties")) {
          @SuppressWarnings("unchecked")
          final Map<String, String> props = yamlMapper.readValue(inputStream, Map.class);
          version = props.getOrDefault("projectVersion", "unknown");
        } catch (IOException e) {
          logger.error(AnetConstants.VERSION_INFORMATION_ERROR_MESSAGE, e);
          version = "!error!";
        }
      }
      return version;
    }
  }
}
