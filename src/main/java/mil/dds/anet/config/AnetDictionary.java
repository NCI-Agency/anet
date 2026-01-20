package mil.dds.anet.config;

import com.networknt.schema.Error;
import com.networknt.schema.Schema;
import com.networknt.schema.SchemaLocation;
import com.networknt.schema.SchemaRegistry;
import com.networknt.schema.SchemaRegistryConfig;
import com.networknt.schema.SpecificationVersion;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.dataformat.yaml.YAMLMapper;

@Component
public class AnetDictionary {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String SCHEMA_ID_PREFIX =
      "https://raw.githubusercontent.com/NCI-Agency/anet/main/src/main/resources";
  private static final ObjectMapper yamlMapper = new YAMLMapper();
  private static final ObjectMapper jsonMapper = new JsonMapper();

  private final AnetConfig config;

  private Map<String, Object> dictionary;

  public AnetDictionary(AnetConfig config) {
    this.config = config;
  }

  @PostConstruct
  public void init() throws IOException {
    logger.info("Loading dictionary...");
    Map<String, Object> dictionaryData = this.loadDictionary();

    logger.info("Validating dictionary...");
    this.checkDictionary(dictionaryData);

    this.setDictionary(dictionaryData);
    logger.info("Dictionary validated");
  }

  public Map<String, Object> getDictionary() {
    return dictionary;
  }

  public void setDictionary(Map<String, Object> dictionary) {
    this.dictionary = Collections.unmodifiableMap(dictionary);
  }

  /**
   * Tries to load the dictionary, designed to be used runtime. If suppresses errors, and returns
   * false if it failed to load the dictionary
   */
  public boolean tryLoadDictionary() {
    // Read and set anet-dictionary
    final Map<String, Object> dictionaryMap;
    try {
      dictionaryMap = loadDictionary();
    } catch (IOException e) {
      logger.warn("Loading the dictionary failed");
      return false;
    }
    if (this.isValid(dictionaryMap)) {
      this.setDictionary(dictionaryMap);
      return true;
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

  private Map<String, Object> loadDictionary() throws IOException {
    // scan:ignore — false positive, we *want* to load the user-provided dictionary file
    final File file = new File(config.getAnetDictionaryName());
    try (final InputStream inputStream = new FileInputStream(file)) {
      return addKeycloakConfiguration(
          yamlMapper.readValue(inputStream, new TypeReference<Map<String, Object>>() {}));
    }
  }

  private boolean isValid(final Map<String, Object> dictionaryMap) throws IllegalArgumentException {
    try {
      this.checkDictionary(dictionaryMap);
      return true;
    } catch (final IllegalArgumentException e) {
      return false;
    }
  }

  private void checkDictionary(final Map<String, Object> dictionaryMap)
      throws IllegalArgumentException {
    final List<Error> errors;
    try {
      final SchemaRegistryConfig schemaRegistryConfig =
          SchemaRegistryConfig.builder().formatAssertionsEnabled(true).build();
      final SchemaRegistry schemaRegistry = SchemaRegistry.withDefaultDialect(
          SpecificationVersion.DRAFT_2019_09,
          builder -> builder.schemaRegistryConfig(schemaRegistryConfig).schemaIdResolvers(
              schemaIdResolvers -> schemaIdResolvers.mapPrefix(SCHEMA_ID_PREFIX, "classpath:/")));
      final Schema schema =
          schemaRegistry.getSchema(SchemaLocation.of(SCHEMA_ID_PREFIX + "/anet-schema.yml"));
      schema.initializeValidators();
      final JsonNode anetDictionary = jsonMapper.valueToTree(dictionaryMap);
      errors = schema.validate(anetDictionary);
    } catch (final Exception e) {
      logger.error("Malformed ANET schema", e);
      throw new IllegalArgumentException("Malformed ANET schema", e);
    }
    if (!errors.isEmpty()) {
      for (final Error error : errors) {
        logger.error("Dictionary error: {}", error);
      }
      throw new IllegalArgumentException("Invalid dictionary");
    }
    logger.atInfo().log("dictionary: {}", yamlMapper.writeValueAsString(dictionaryMap));
  }

  private Map<String, Object> addKeycloakConfiguration(Map<String, Object> dictionaryMap) {
    // Add client-side Keycloak configuration to the dictionary
    final Map<String, Object> clientConfig = new HashMap<>();
    final AnetConfig.KeycloakConfiguration kcConfig = config.getKeycloakConfiguration();
    clientConfig.put("realm", kcConfig.getRealm());
    clientConfig.put("url", kcConfig.getAuthServerUrl());
    clientConfig.put("clientId", kcConfig.getResource());
    clientConfig.put("showLogoutLink", kcConfig.isShowLogoutLink());
    final Map<String, Object> updatedDictionaryMap = new HashMap<>(dictionaryMap);
    updatedDictionaryMap.put("keycloakConfiguration", clientConfig);
    return updatedDictionaryMap;
  }

}
