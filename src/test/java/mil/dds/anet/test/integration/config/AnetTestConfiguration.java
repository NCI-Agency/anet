package mil.dds.anet.test.integration.config;

import java.io.File;
import java.lang.invoke.MethodHandles;
import java.net.URL;
import java.util.HashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.dataformat.yaml.YAMLMapper;

public class AnetTestConfiguration {
  private static final HashMap<String, Object> config;

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  static {
    final ObjectMapper yamlMapper = new YAMLMapper();
    final URL configUrl =
        AnetTestConfiguration.class.getResource("/integration/anet-integrationtest.yml");
    final File configFile = new File(configUrl.getFile());
    config = loadConfiguration(yamlMapper, configFile);
  }

  public static HashMap<String, Object> getConfiguration() throws Exception {
    // Failed to read configuration
    if (config == null) {
      throw new Exception("Failed to load integration test configuration.");
    }

    return config;
  }

  @SuppressWarnings("unchecked")
  private static HashMap<String, Object> loadConfiguration(final ObjectMapper yamlMapper,
      final File configFile) {
    try {
      return yamlMapper.readValue(configFile, HashMap.class);
    } catch (final JacksonException e) {
      logger.error("Failed to read integration test configuration. Reason: {}", e.getMessage());
      return null;
    }
  }
}
