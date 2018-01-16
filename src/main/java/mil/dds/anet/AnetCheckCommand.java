package mil.dds.anet;


import net.sourceforge.argparse4j.inf.Namespace;
import mil.dds.anet.config.AnetConfiguration;
import io.dropwizard.Application;
import io.dropwizard.cli.CheckCommand;
import io.dropwizard.setup.Bootstrap;


public class AnetCheckCommand extends CheckCommand<AnetConfiguration> {

	public AnetCheckCommand(Application<AnetConfiguration> application) {
		super(application);
	}

	@Override
	protected void run(Bootstrap<AnetConfiguration> bootstrap,
			Namespace namespace, AnetConfiguration configuration)
			throws Exception {
		// Check the dictionary
		AnetApplication.getDictionary(configuration);
		super.run(bootstrap, namespace, configuration);
	}

}
