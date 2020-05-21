package mil.dds.anet.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.google.common.collect.ImmutableMap;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import io.dropwizard.Configuration;
import io.dropwizard.bundles.assets.AssetsBundleConfiguration;
import io.dropwizard.bundles.assets.AssetsConfiguration;
import io.dropwizard.db.DataSourceFactory;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.yaml.snakeyaml.Yaml;

public class AnetConfiguration extends Configuration implements AssetsBundleConfiguration {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private boolean testMode;
  private boolean developmentMode;
  private boolean redirectToHttps = false;

  private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
  private static final ObjectMapper jsonMapper = new ObjectMapper();

  @Valid
  @NotNull
  private SmtpConfiguration smtp;

  private String emailFromAddr;
  private String serverUrl;

  private Map<String, Object> dictionary;

  private boolean timeWaffleRequests;

  @Valid
  @NotNull
  @JsonProperty
  private final AssetsConfiguration assets = AssetsConfiguration.builder().build();

  @NotNull
  private Map<String, String> waffleConfig = new HashMap<>();

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
    this.dictionary = Collections.unmodifiableMap(dictionary);
  }

  @SuppressWarnings("unchecked")
  public void loadDictionary() {
    // Read and set anet-dictionary
    Yaml yaml = new Yaml();
    InputStream in = AnetConfiguration.class.getResourceAsStream("/anet-dictionary.yml");
    Map<String, Object> dictionary = yaml.loadAs(in, Map.class);
    this.setDictionary(dictionary);

    // Check the dictionary
    final JsonNode jsonNodeDictionary = checkDictionary();
    try {
      logger.info("dictionary: {}", yamlMapper.writeValueAsString(jsonNodeDictionary));
    } catch (JsonProcessingException exception) {
      logger.info("Could not serialize dictionary");
    }
  }

  public JsonNode checkDictionary() throws IllegalArgumentException {
    try (final InputStream inputStream =
        AnetConfiguration.class.getResourceAsStream("/anet-schema.yml")) {
      if (inputStream == null) {
        logger.error("ANET schema [anet-schema.yml] not found");
      } else {
        JsonSchemaFactory factory =
            JsonSchemaFactory.builder(JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7))
                .objectMapper(yamlMapper).build();

        JsonSchema schema = factory.getSchema(inputStream);
        final JsonNode dictionary = jsonMapper.valueToTree(getDictionary());
        Set<ValidationMessage> errors = schema.validate(dictionary);
        for (ValidationMessage error : errors) {
          logger.error(error.getMessage());
        }
        if (!errors.isEmpty()) {
          throw new IllegalArgumentException("Invalid dictionary in the configuration");
        }
        return dictionary;
      }
    } catch (IOException e) {
      logger.error("Error closing ANET schema", e);
    }
    throw new IllegalArgumentException("Missing dictionary in the configuration");
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
    @NotNull
    private String hostname;
    private Integer port = 587;
    private String username;
    private String password;
    private Boolean startTls = true;
    private boolean disabled = false;
    private Integer nbOfHoursForStaleEmails;
    private String sslTrust;

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

    public String getSslTrust() {
      return (sslTrust != null) ? sslTrust : hostname;
    }

    public void setSslTrust(String sslTrust) {
      this.sslTrust = sslTrust;
    }
  }

}
