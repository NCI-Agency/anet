package mil.dds.anet.integrationtest.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import java.io.File;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AnetITConfiguration {
  private static final HashMap<String, Object> config;
  private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
  private static final File configFile =
      new File("src/integration-test/resources/anet-integration.yml");

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  static {
    config = loadConfiguration();
  }

  public static HashMap<String, Object> getConfiguration() throws Exception {
    // Failed to read configuration
    if (config == null) {
      throw new Exception("Failed to load IT test configuration.");
    }

    return config;
  }

  @SuppressWarnings("unchecked")
  private static HashMap<String, Object> loadConfiguration() {
    try {
      return yamlMapper.readValue(configFile, HashMap.class);
    } catch (IOException e) {
      logger.error("Failed to read IT test configuration. Reason: " + e.getMessage());
      return null;
    }
  }
}
