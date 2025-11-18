package mil.dds.anet.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
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

@Component
public class AnetDictionary {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String SCHEMA_ID_PREFIX =
      "https://raw.githubusercontent.com/NCI-Agency/anet/main/src/main/resources";
  private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
  private static final ObjectMapper jsonMapper = new ObjectMapper();

  private final AnetConfig config;

  private Map<String, Object> dictionary;

  public AnetDictionary(AnetConfig config) {
    this.config = config;
  }

  @PostConstruct
  public void init() throws IOException {
    loadDictionary();
  }

  public Map<String, Object> getDictionary() {
    return dictionary;
  }

  public void setDictionary(Map<String, Object> dictionary) {
    this.dictionary = Collections.unmodifiableMap(dictionary);
  }

  // This method is also called from AdminResource
  public void loadDictionary() throws IOException, IllegalArgumentException {
    // Read and set anet-dictionary
    // scan:ignore — false positive, we *want* to load the user-provided dictionary file
    final File file = new File(config.getAnetDictionaryName());
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
  public boolean checkDictionary() throws IOException {
    return this.isValid(this.getDictionary());
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

  private boolean isValid(final Map<String, Object> dictionaryMap)
      throws IOException, IllegalArgumentException {
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
      final List<Error> errors = schema.validate(anetDictionary);
      if (!errors.isEmpty()) {
        for (final Error error : errors) {
          logger.error("Dictionary error: {}", error);
        }
        throw new IllegalArgumentException("Invalid dictionary in the configuration");
      }
      logger.atInfo().log("dictionary: {}", yamlMapper.writeValueAsString(dictionaryMap));
      return true;
    } catch (final Exception e) {
      logger.error("Malformed ANET schema", e);
    }
    return false;
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
