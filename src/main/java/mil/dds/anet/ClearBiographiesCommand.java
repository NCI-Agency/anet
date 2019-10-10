package mil.dds.anet;

import io.dropwizard.Application;
import io.dropwizard.cli.EnvironmentCommand;
import io.dropwizard.setup.Environment;
import mil.dds.anet.config.AnetConfiguration;
import net.sourceforge.argparse4j.inf.Namespace;

public class ClearBiographiesCommand extends EnvironmentCommand<AnetConfiguration> {

  public ClearBiographiesCommand(Application<AnetConfiguration> application) {
    super(application, "clearBiographies",
        "Set empty HTML biography field of people to null in the ANET Database");
  }

  @Override
  protected void run(Environment environment, Namespace namespace, AnetConfiguration configuration)
      throws Exception {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    engine.getPersonDao().clearBiographies();
    System.exit(0);
  }

}
