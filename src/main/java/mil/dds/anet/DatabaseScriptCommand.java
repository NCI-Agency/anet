package mil.dds.anet;

import java.io.IOException;
import org.jdbi.v3.core.Handle;
import io.dropwizard.cli.ConfiguredCommand;
import io.dropwizard.jdbi3.JdbiFactory;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import mil.dds.anet.config.AnetConfiguration;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;
import java.nio.file.Files;
import java.nio.file.Paths;

public class DatabaseScriptCommand extends ConfiguredCommand<AnetConfiguration> {

	public DatabaseScriptCommand() { 
		super("dbScript", "Executes a SQL script");
	}

	@Override
	public void configure(Subparser subparser) {
		subparser.addArgument("-S", "--sqlFile")
			.dest("sqlFile")
			.type(String.class)
			.required(true)
			.help("The sql file");
			
		super.configure(subparser);
	}

	@Override
	protected void run(Bootstrap<AnetConfiguration> bootstrap, Namespace namespace, AnetConfiguration configuration) throws Exception {
		final JdbiFactory factory = new JdbiFactory();
		final Environment environment = new Environment(bootstrap.getApplication().getName(),
				bootstrap.getObjectMapper(),
				bootstrap.getValidatorFactory().getValidator(),
				bootstrap.getMetricRegistry(),
				bootstrap.getClassLoader(),
				bootstrap.getHealthCheckRegistry());

		final String sqlFilePath = namespace.getString("sqlFile");

		Handle jdbiHandle = null;

		try { 
			final String sqlScript = new String(Files.readAllBytes(Paths.get(sqlFilePath))); 
			jdbiHandle = factory.build(environment, configuration.getDataSourceFactory(), "database-script").open();
			jdbiHandle.createScript(sqlScript).execute();
		} 
		catch (IOException e) { 
			e.printStackTrace(); 
		}
		finally {
			if (jdbiHandle != null) {
				jdbiHandle.close();
			}
		}
	}
}
