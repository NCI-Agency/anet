package mil.dds.anet;

import io.dropwizard.core.Application;
import io.dropwizard.core.cli.CheckCommand;
import io.dropwizard.core.setup.Bootstrap;
import mil.dds.anet.config.AnetConfiguration;
import net.sourceforge.argparse4j.inf.Namespace;

public class AnetCheckCommand extends CheckCommand<AnetConfiguration> {

  public AnetCheckCommand(Application<AnetConfiguration> application) {
    super(application);
  }

  @Override
  protected void run(Bootstrap<AnetConfiguration> bootstrap, Namespace namespace,
      AnetConfiguration configuration) throws Exception {
    // Check the dictionary
    configuration.checkDictionary();
    super.run(bootstrap, namespace, configuration);
  }

}
