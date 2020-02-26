package mil.dds.anet.test.integration.utils;

import io.dropwizard.testing.ConfigOverride;
import io.dropwizard.testing.junit5.DropwizardAppExtension;
import io.dropwizard.testing.junit5.DropwizardExtensionsSupport;
import mil.dds.anet.AnetApplication;
import mil.dds.anet.config.AnetConfiguration;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.ExtensionContext;

@ExtendWith(DropwizardExtensionsSupport.class)
public class TestApp implements BeforeAllCallback, AfterAllCallback {

  public static DropwizardAppExtension<AnetConfiguration> app = null;

  @Override
  public void beforeAll(ExtensionContext context) throws Exception {
    app = new DropwizardAppExtension<AnetConfiguration>(AnetApplication.class, "anet.yml",
        ConfigOverride.config("testMode", "true"));
    app.before();
  }

  @Override
  public void afterAll(ExtensionContext context) throws Exception {
    app.after();
    app = null;
  }

}
