package mil.dds.anet;

import io.dropwizard.Application;
import io.dropwizard.cli.EnvironmentCommand;
import io.dropwizard.setup.Environment;
import java.lang.invoke.MethodHandles;
import mil.dds.anet.config.AnetConfiguration;
import net.sourceforge.argparse4j.impl.Arguments;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MaintenanceCommand extends EnvironmentCommand<AnetConfiguration> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public MaintenanceCommand(Application<AnetConfiguration> application) {
    super(application, "maintenance", "Various helpful maintenance commands for the ANET Database");
  }

  @Override
  public void configure(Subparser subparser) {
    subparser.addArgument("-ceb", "--clearEmptyBiographies").action(Arguments.storeTrue())
        .required(false).help(
            "Clears empty biographies (blank or empty HTML tags) by replacing them with a NULL value");

    super.configure(subparser);
  }

  @Override
  protected void run(Environment environment, Namespace namespace, AnetConfiguration configuration)
      throws Exception {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();

    if (Boolean.TRUE.equals(namespace.getBoolean("clearEmptyBiographies"))) {
      clearEmptyBiographies(engine);
    }

    System.exit(0);
  }

  private void clearEmptyBiographies(AnetObjectEngine engine) {
    logger.info("Clearing empty biographies");
    engine.getPersonDao().clearEmptyBiographies();
  }
}
