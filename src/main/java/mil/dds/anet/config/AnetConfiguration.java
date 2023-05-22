package mil.dds.anet.config;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.google.common.collect.ImmutableMap;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaException;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import io.dropwizard.Configuration;
import io.dropwizard.bundles.assets.AssetsBundleConfiguration;
import io.dropwizard.bundles.assets.AssetsConfiguration;
import io.dropwizard.db.DataSourceFactory;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import mil.dds.anet.utils.AnetConstants;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AnetConfiguration extends Configuration implements AssetsBundleConfiguration {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
  private static final ObjectMapper jsonMapper = new ObjectMapper();

  private boolean testMode;
  private boolean developmentMode;
  private boolean redirectToHttps = false;
  private Long graphQlRequestTimeoutMs;

  private final Object versionLock = new Object();

  @Valid
  @NotNull
  private SmtpConfiguration smtp;

  private String emailFromAddr;
  private String serverUrl;

  @JsonIgnore
  private Map<String, Object> dictionary;

  private String anetDictionaryName;

  private String version;

  @Valid
  @NotNull
  @JsonProperty
  private final AssetsConfiguration assets = AssetsConfiguration.builder().build();

  @NotNull
  private AnetKeycloakConfiguration keycloakConfiguration = new AnetKeycloakConfiguration();

  @Valid
  @NotNull
  private DataSourceFactory database = new DataSourceFactory();

  @NotNull
  private Map<String, Map<String, String>> views = Collections.emptyMap();

  @Override
  public AssetsConfiguration getAssetsConfiguration() {
    return assets;
  }

  @JsonProperty("database")
  public void setDataSourceFactory(DataSourceFactory factory) {
    this.database = factory;
  }

  @JsonProperty("database")
  public DataSourceFactory getDataSourceFactory() {
    return database;
  }

  public boolean isTestMode() {
    return testMode;
  }

  public void setTestMode(boolean testMode) {
    this.testMode = testMode;
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

  public Long getGraphQlRequestTimeoutMs() {
    return graphQlRequestTimeoutMs;
  }

  public void setGraphQlRequestTimeoutMs(Long graphQlRequestTimeoutMs) {
    this.graphQlRequestTimeoutMs = graphQlRequestTimeoutMs;
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

  public AnetKeycloakConfiguration getKeycloakConfiguration() {
    return keycloakConfiguration;
  }

  public void setKeycloakConfiguration(AnetKeycloakConfiguration keycloakConfiguration) {
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
   * The AnetConfiguration class is used as the object representation of the YAML configuration
   * file. During start-up phase, parametric values are read from the anet.yml file and their set
   * methods are called automatically. The parameter to be set when this method is called is the
   * anetDictionaryName which is read from the anet.yml file. This parameter shows the full path to
   * the dictionary to be loaded. Therefore, as soon as the parameter is set,we can call
   * loadDictionary method in here to fill and set the dictionary to be used.
   *
   * @param anetDictionaryName Full path of the dictionary to be loaded ,read from anet.yml
   * @throws IOException When an error occurs while trying to load dictionary
   * @throws IllegalArgumentException In case of invalid dictionary in the configuration
   */
  public void setAnetDictionaryName(String anetDictionaryName)
      throws IOException, IllegalArgumentException {
    this.anetDictionaryName = anetDictionaryName;
    this.loadDictionary();
  }

  public Map<String, Object> getDictionary() {
    return dictionary;
  }

  public void setDictionary(Map<String, Object> dictionary) {
    this.dictionary = Collections.unmodifiableMap(dictionary);
  }

  public void loadDictionary() throws IOException, IllegalArgumentException {
    // Read and set anet-dictionary
    // scan:ignore — false positive, we *want* to load the user-provided dictionary file
    final File file = new File(System.getProperty("user.dir"), getAnetDictionaryName());
    try (final InputStream inputStream = new FileInputStream(file)) {
      @SuppressWarnings("unchecked")
      final Map<String, Object> dictionaryMap =
          addKeycloakConfiguration(yamlMapper.readValue(inputStream, Map.class));
      // Check and then set dictionary if it is valid
      if (isValid(dictionaryMap)) {
        this.setDictionary(dictionaryMap);
      }
    } catch (IOException | IllegalArgumentException e) {
      logger.error("Error while trying to load dictionary");
      throw e;
    }
  }

  // This method is called from AnetCheckCommand
  public void checkDictionary() throws IOException {
    this.isValid(this.getDictionary());
  }

  // Before setting the dictionary with the dictionaryMap value,
  // check the dictionaryMap value if it is valid
  public boolean isValid(final Map<String, Object> dictionaryMap)
      throws IOException, IllegalArgumentException {
    try (final InputStream inputStream =
        AnetConfiguration.class.getResourceAsStream("/anet-schema.yml")) {
      if (inputStream == null) {
        logger.error("ANET schema [anet-schema.yml] not found");
        throw new IOException("ANET schema [anet-schema.yml] not found");
      } else {
        final JsonSchemaFactory factory = JsonSchemaFactory
            .builder(JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V201909))
            .objectMapper(yamlMapper).build();
        final JsonSchema schema = factory.getSchema(inputStream);
        final JsonNode anetDictionary = jsonMapper.valueToTree(dictionaryMap);
        final Set<ValidationMessage> errors = schema.validate(anetDictionary);
        if (!errors.isEmpty()) {
          for (ValidationMessage error : errors) {
            logger.error("Dictionary error: {}", error.getMessage());
          }
          throw new IllegalArgumentException("Invalid dictionary in the configuration");
        }
        logger.info("dictionary: {}", yamlMapper.writeValueAsString(dictionaryMap));
        return true;
      }
    } catch (final JsonSchemaException e) {
      logger.error("Malformed ANET schema", e);
    }
    return false;
  }

  @SuppressWarnings("unchecked")
  public Object getDictionaryEntry(String keyPath) {
    if (Utils.isEmptyOrNull(keyPath)) {
      return null;
    }
    Object elem = dictionary;
    for (final String key : keyPath.split("\\.")) {
      elem = ((Map<String, Object>) elem).get(key);
      if (elem == null) {
        break;
      }
    }
    return elem;
  }

  public static class SmtpConfiguration {
    @NotNull
    private String hostname;
    @Positive
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
            AnetConfiguration.class.getResourceAsStream("/version.properties")) {
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

  private Map<String, Object> addKeycloakConfiguration(Map<String, Object> dictionaryMap) {
    // Add client-side Keycloak configuration to the dictionary
    final Map<String, Object> clientConfig = new HashMap<>();
    final AnetKeycloakConfiguration keycloakConfiguration = getKeycloakConfiguration();
    clientConfig.put("realm", keycloakConfiguration.getRealm());
    clientConfig.put("url", keycloakConfiguration.getAuthServerUrl());
    clientConfig.put("clientId", keycloakConfiguration.getResource() + "-public");
    clientConfig.put("showLogoutLink", keycloakConfiguration.isShowLogoutLink());
    final Map<String, Object> updatedDictionaryMap = new HashMap<>(dictionaryMap);
    updatedDictionaryMap.put("keycloakConfiguration", clientConfig);
    return updatedDictionaryMap;
  }

}
