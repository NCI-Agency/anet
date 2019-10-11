package mil.dds.anet;

import io.dropwizard.Application;
import io.dropwizard.cli.EnvironmentCommand;
import io.dropwizard.setup.Environment;
import mil.dds.anet.config.AnetConfiguration;
import net.sourceforge.argparse4j.inf.Namespace;

public class ClearEmptyBiographiesCommand extends EnvironmentCommand<AnetConfiguration> {

  public ClearEmptyBiographiesCommand(Application<AnetConfiguration> application) {
    super(application, "clearEmptyBiographies",
        "Set empty HTML biography field of people to null in the ANET Database");
  }

  @Override
  protected void run(Environment environment, Namespace namespace, AnetConfiguration configuration)
      throws Exception {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    engine.getPersonDao().clearEmptyBiographies();
    System.exit(0);
  }

}
