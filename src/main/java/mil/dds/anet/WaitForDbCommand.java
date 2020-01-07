package mil.dds.anet;

import io.dropwizard.cli.ConfiguredCommand;
import io.dropwizard.jdbi3.JdbiFactory;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import mil.dds.anet.config.AnetConfiguration;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;
import org.jdbi.v3.core.Jdbi;

public class WaitForDbCommand extends ConfiguredCommand<AnetConfiguration> {

  public WaitForDbCommand() {
    super("waitForDB", "Waits until DB is ready for connection");
  }

  @Override
  public void configure(Subparser subparser) {
    subparser.addArgument("-n", "--nbAttempts").dest("dbConnectionNbAttempts").type(Integer.class)
        .required(false).setDefault(20).help("Nb of attempts before giving up. 20 by default");

    subparser.addArgument("-d", "--delay").dest("dbConnectionDelay").type(Integer.class)
        .required(false).setDefault(500).help("Delay in ms between attempts. 500 by default");

    super.configure(subparser);
  }

  @Override
  protected void run(Bootstrap<AnetConfiguration> bootstrap, Namespace namespace,
      AnetConfiguration configuration) throws Exception {
    final JdbiFactory factory = new JdbiFactory();
    final Environment environment = new Environment(bootstrap.getApplication().getName(),
        bootstrap.getObjectMapper(), bootstrap.getValidatorFactory(), bootstrap.getMetricRegistry(),
        bootstrap.getClassLoader(), bootstrap.getHealthCheckRegistry(), configuration);
    final Jdbi jdbi = factory.build(environment, configuration.getDataSourceFactory(), "mssql");

    // We want to possibly wait for the database to be ready, and keep trying to connect
    int remainingTries = namespace.getInt("dbConnectionNbAttempts").intValue();
    final int delay = namespace.getInt("dbConnectionDelay").intValue();
    while (remainingTries-- > 0) {
      try {
        jdbi.open().close();
        break;
      } catch (Throwable exception) {
        if (remainingTries == 0) {
          throw new RuntimeException(exception);
        }
      }
      try {
        Thread.sleep(delay);
      } catch (InterruptedException exception) {
        throw new RuntimeException(exception);
      }
    }
  }
}
