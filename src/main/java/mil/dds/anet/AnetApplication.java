package mil.dds.anet;

import java.lang.invoke.MethodHandles;
import java.util.EnumSet;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.servlet.DispatcherType;
import javax.servlet.Filter;
import javax.servlet.FilterRegistration;

import org.eclipse.jetty.server.session.SessionHandler;
import org.eclipse.jetty.servlet.FilterHolder;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.glassfish.jersey.server.filter.RolesAllowedDynamicFeature;
import org.json.JSONObject;
import org.skife.jdbi.v2.DBI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.collect.ImmutableList;

import io.dropwizard.Application;
import io.dropwizard.assets.AssetsBundle;
import io.dropwizard.auth.AuthDynamicFeature;
import io.dropwizard.auth.AuthValueFactoryProvider;
import io.dropwizard.auth.basic.BasicCredentialAuthFilter;
import io.dropwizard.configuration.EnvironmentVariableSubstitutor;
import io.dropwizard.configuration.SubstitutingSourceProvider;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.jdbi.DBIFactory;
import io.dropwizard.migrations.MigrationsBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import io.dropwizard.views.ViewBundle;
import mil.dds.anet.auth.AnetAuthenticationFilter;
import mil.dds.anet.auth.AnetDevAuthenticator;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.resources.AdminResource;
import mil.dds.anet.resources.ApprovalStepResource;
import mil.dds.anet.resources.GraphQLResource;
import mil.dds.anet.resources.HomeResource;
import mil.dds.anet.resources.LocationResource;
import mil.dds.anet.resources.OrganizationResource;
import mil.dds.anet.resources.PersonResource;
import mil.dds.anet.resources.PoamResource;
import mil.dds.anet.resources.PositionResource;
import mil.dds.anet.resources.ReportResource;
import mil.dds.anet.resources.SavedSearchResource;
import mil.dds.anet.resources.TagResource;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.FutureEngagementWorker;
import mil.dds.anet.utils.AnetDbLogger;
import mil.dds.anet.utils.HttpsRedirectFilter;
import mil.dds.anet.views.ViewResponseFilter;
import waffle.servlet.NegotiateSecurityFilter;

public class AnetApplication extends Application<AnetConfiguration> {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	public static void main(String[] args) throws Exception {
		new AnetApplication().run(args);
	}

	@Override
	public String getName() {
		return "anet";
	}

	@Override
	public void initialize(Bootstrap<AnetConfiguration> bootstrap) {
		//Allow the anet.yml configuration to pull from Environment Variables. 
		bootstrap.setConfigurationSourceProvider(
			new SubstitutingSourceProvider(
				bootstrap.getConfigurationSourceProvider(),
				new EnvironmentVariableSubstitutor(false)
			)
		);

		//Add the db migration commands
		bootstrap.addBundle(new MigrationsBundle<AnetConfiguration>() {
			@Override
			public DataSourceFactory getDataSourceFactory(AnetConfiguration configuration) {
				logger.info("datasource url: {}", configuration.getDataSourceFactory().getUrl());
				return configuration.getDataSourceFactory();
	        }
	    });
		
		//Add the init command
		bootstrap.addCommand(new InitializationCommand());

		//Serve assets on /assets
		bootstrap.addBundle(new AssetsBundle("/assets", "/assets", "index.html"));
		bootstrap.addBundle(new AssetsBundle("/imagery", "/imagery", null, "imagery"));

		//Use Freemarker to handle rendering TEXT_HTML views. 
		bootstrap.addBundle(new ViewBundle<AnetConfiguration>() {
			@Override
			public Map<String, Map<String, String>> getViewConfiguration(AnetConfiguration configuration) {
				return configuration.getViews();
			}
		});
		
	}

	@Override
	public void run(AnetConfiguration configuration, Environment environment) {
		//Get the Database connection up and running
		logger.info("datasource url: {}", configuration.getDataSourceFactory().getUrl());
		final DBIFactory factory = new DBIFactory();
		final DBI jdbi = factory.build(environment, configuration.getDataSourceFactory(), "mssql");

		logger.info("dictionary: {}", new JSONObject(configuration.getDictionary()).toString(2));
		
		//We want to use our own custom DB logger in order to clean up the logs a bit. 
		jdbi.setSQLLog(new AnetDbLogger());

		//The Object Engine is the core place where we store all of the Dao's
		//You can always grab the engine from anywhere with AnetObjectEngine.getInstance()
		final AnetObjectEngine engine = new AnetObjectEngine(jdbi);
		environment.servlets().setSessionHandler(new SessionHandler());
		
		if (configuration.isDevelopmentMode()) {
			//In development mode just allow basic HTTP Authentication
			environment.jersey().register(new AuthDynamicFeature(
					new BasicCredentialAuthFilter.Builder<Person>()
						.setAuthenticator(new AnetDevAuthenticator(engine))
						.setAuthorizer(new AnetAuthenticationFilter(engine)) //Acting only as Authz.
						.setRealm("ANET")
						.buildAuthFilter()));	
		} else { 
			//In Production require Windows AD Authentication.
			Filter nsf = new NegotiateSecurityFilter();
			FilterRegistration nsfReg = environment.servlets().addFilter("NegotiateSecurityFilter", nsf);
			nsfReg.setInitParameters(configuration.getWaffleConfig());
			nsfReg.addMappingForUrlPatterns(EnumSet.of(DispatcherType.REQUEST), true, "/*");
			environment.jersey().register(new AuthDynamicFeature(new AnetAuthenticationFilter(engine)));
		}
		
		if (configuration.getRedirectToHttps()) { 
			forwardToHttps(environment.getApplicationContext());
		}
		
		//If you want to use @Auth to inject a custom Principal type into your resource
		environment.jersey().register(new AuthValueFactoryProvider.Binder<>(Person.class));
		//If you want to use @RolesAllowed to do authorization.
		environment.jersey().register(RolesAllowedDynamicFeature.class);
		environment.jersey().register(new WebExceptionMapper());

		//Schedule any tasks that need to run on an ongoing basis. 
		ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
		AnetEmailWorker emailWorker = new AnetEmailWorker(jdbi.open(), configuration, scheduler);
		FutureEngagementWorker futureWorker = new FutureEngagementWorker(jdbi.open());
		
		//Check for any emails that need to be sent every 5 minutes. 
		//And run once in 5 seconds from boot-up. (give the server time to boot up).   
		scheduler.scheduleAtFixedRate(emailWorker, 5, 5, TimeUnit.MINUTES);
		scheduler.schedule(emailWorker, 5, TimeUnit.SECONDS);
		
		//Check for any future engagements every 1 hour.
		//And check in 10 seconds (give the server time to boot up)
		if (configuration.isDevelopmentMode()) { 
			scheduler.scheduleAtFixedRate(futureWorker, 0, 1, TimeUnit.MINUTES);
		} else { 
			scheduler.scheduleAtFixedRate(futureWorker, 0, 3, TimeUnit.HOURS);
		}
		scheduler.schedule(futureWorker, 10, TimeUnit.SECONDS);
		
		//Create all of the HTTP Resources.  
		PersonResource personResource = new PersonResource(engine, configuration);
		PoamResource poamResource =  new PoamResource(engine);
		LocationResource locationResource = new LocationResource(engine);
		OrganizationResource orgResource = new OrganizationResource(engine);
		PositionResource positionResource = new PositionResource(engine);
		ApprovalStepResource asResource = new ApprovalStepResource(engine);
		ReportResource reportResource = new ReportResource(engine, configuration);
		AdminResource adminResource = new AdminResource(engine, configuration);
		HomeResource homeResource = new HomeResource(engine);
		SavedSearchResource savedSearchResource = new SavedSearchResource(engine);
		final TagResource tagResource = new TagResource(engine);

		//Register all of the HTTP Resources
		environment.jersey().register(personResource);
		environment.jersey().register(poamResource);
		environment.jersey().register(locationResource);
		environment.jersey().register(orgResource);
		environment.jersey().register(positionResource);
		environment.jersey().register(asResource);
		environment.jersey().register(reportResource);
		environment.jersey().register(adminResource);
		environment.jersey().register(homeResource);
		environment.jersey().register(savedSearchResource);
		environment.jersey().register(tagResource);
		environment.jersey().register(new ViewResponseFilter(configuration));
		environment.jersey().register(new GraphQLResource(
			ImmutableList.of(reportResource, personResource,
				positionResource, locationResource,
				orgResource, asResource, poamResource,
				adminResource, savedSearchResource, tagResource),
			configuration.isDevelopmentMode()));
	}

	/*
	 * Adds a Request filter that looks for any HTTP requests and redirects them to HTTPS
	 */
	public void forwardToHttps(ServletContextHandler handler) {
		handler.addFilter(new FilterHolder(new HttpsRedirectFilter()), "/*",  EnumSet.of(DispatcherType.REQUEST));
	}
	
}
