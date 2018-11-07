package mil.dds.anet;

import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.util.Arrays;
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
import org.everit.json.schema.Schema;
import org.everit.json.schema.ValidationException;
import org.everit.json.schema.loader.SchemaLoader;
import org.glassfish.jersey.server.filter.RolesAllowedDynamicFeature;
import org.json.JSONObject;
import org.json.JSONTokener;

import com.codahale.metrics.MetricRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.statement.SqlStatements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import waffle.servlet.NegotiateSecurityFilter;

import com.google.common.collect.ImmutableList;

import io.dropwizard.Application;
import io.dropwizard.assets.AssetsBundle;
import io.dropwizard.auth.AuthDynamicFeature;
import io.dropwizard.auth.AuthFilter;
import io.dropwizard.auth.AuthValueFactoryProvider;
import io.dropwizard.auth.basic.BasicCredentialAuthFilter;
import io.dropwizard.auth.chained.ChainedAuthFilter;
import io.dropwizard.cli.ServerCommand;
import io.dropwizard.configuration.EnvironmentVariableSubstitutor;
import io.dropwizard.configuration.SubstitutingSourceProvider;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.jdbi3.JdbiFactory;
import io.dropwizard.migrations.MigrationsBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import io.dropwizard.views.ViewBundle;
import mil.dds.anet.auth.AnetAuthenticationFilter;
import mil.dds.anet.auth.AnetDevAuthenticator;
import mil.dds.anet.auth.TimedNegotiateSecurityFilter;
import mil.dds.anet.auth.UrlParamsAuthFilter;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.resources.AdminResource;
import mil.dds.anet.resources.AuthorizationGroupResource;
import mil.dds.anet.resources.GraphQLResource;
import mil.dds.anet.resources.HomeResource;
import mil.dds.anet.resources.LocationResource;
import mil.dds.anet.resources.LoggingResource;
import mil.dds.anet.resources.OrganizationResource;
import mil.dds.anet.resources.PersonResource;
import mil.dds.anet.resources.TaskResource;
import mil.dds.anet.resources.PositionResource;
import mil.dds.anet.resources.ReportResource;
import mil.dds.anet.resources.SavedSearchResource;
import mil.dds.anet.resources.TagResource;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.FutureEngagementWorker;
import mil.dds.anet.utils.AnetDbLogger;
import mil.dds.anet.utils.HttpsRedirectFilter;
import mil.dds.anet.views.ViewResponseFilter;

public class AnetApplication extends Application<AnetConfiguration> {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
	private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
	private static final ObjectMapper jsonMapper = new ObjectMapper();

	private MetricRegistry metricRegistry;

	public static void main(String[] args) throws Exception {
		new AnetApplication().run(args);
	}

	@Override
	public String getName() {
		return "anet";
	}

	@Override
	protected void addDefaultCommands(Bootstrap<AnetConfiguration> bootstrap) {
		bootstrap.addCommand(new ServerCommand<>(this));
		bootstrap.addCommand(new AnetCheckCommand(this));
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

		//Add the waitForDB command
		bootstrap.addCommand(new WaitForDBCommand());

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

		//Add the datbase script command
		bootstrap.addCommand(new DatabaseScriptCommand());

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

		metricRegistry = bootstrap.getMetricRegistry();
	}

	@Override
	public void run(AnetConfiguration configuration, Environment environment) {
		//Get the Database connection up and running
		logger.info("datasource url: {}", configuration.getDataSourceFactory().getUrl());
		final JdbiFactory factory = new JdbiFactory();
		final Jdbi jdbi = factory.build(environment, configuration.getDataSourceFactory(), "anet-data-layer");

		// Check the dictionary
		final JSONObject dictionary = getDictionary(configuration);
		logger.info("dictionary: {}", dictionary.toString(2));
		
		//We want to use our own custom DB logger in order to clean up the logs a bit. 
		final SqlStatements sqlStatements = jdbi.getConfig(SqlStatements.class);
		sqlStatements.setSqlLogger(new AnetDbLogger());

		//The Object Engine is the core place where we store all of the Dao's
		//You can always grab the engine from anywhere with AnetObjectEngine.getInstance()
		final AnetObjectEngine engine = new AnetObjectEngine(jdbi);
		environment.servlets().setSessionHandler(new SessionHandler());
		
		if (configuration.isDevelopmentMode()) {
			// In development mode chain URL params (used during testing) and basic HTTP Authentication
			final UrlParamsAuthFilter<Person> urlParamsAuthFilter = new UrlParamsAuthFilter.Builder<Person>()
				.setAuthenticator(new AnetDevAuthenticator(engine, metricRegistry))
				.setAuthorizer(new AnetAuthenticationFilter(engine, metricRegistry)) //Acting only as Authz.
				.setRealm("ANET")
				.buildAuthFilter();
			final BasicCredentialAuthFilter<Person> basicAuthFilter = new BasicCredentialAuthFilter.Builder<Person>()
				.setAuthenticator(new AnetDevAuthenticator(engine, metricRegistry))
				.setAuthorizer(new AnetAuthenticationFilter(engine, metricRegistry)) //Acting only as Authz.
				.setRealm("ANET")
				.buildAuthFilter();
			environment.jersey().register(new AuthDynamicFeature(
				new ChainedAuthFilter<>(Arrays.asList(new AuthFilter[] {urlParamsAuthFilter, basicAuthFilter}))));
		} else { 
			//In Production require Windows AD Authentication.
			final Filter nsf = configuration.isTimeWaffleRequests()
					? new TimedNegotiateSecurityFilter(metricRegistry)
					: new NegotiateSecurityFilter();
			final FilterRegistration nsfReg = environment.servlets().addFilter("NegotiateSecurityFilter", nsf);
			nsfReg.setInitParameters(configuration.getWaffleConfig());
			nsfReg.addMappingForUrlPatterns(EnumSet.of(DispatcherType.REQUEST), true, "/*");
			environment.jersey().register(new AuthDynamicFeature(new AnetAuthenticationFilter(engine, metricRegistry)));
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
		AnetEmailWorker emailWorker = new AnetEmailWorker(engine.getEmailDao(), configuration, scheduler);
		FutureEngagementWorker futureWorker = new FutureEngagementWorker(engine.getReportDao());
		
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
		LoggingResource loggingResource = new LoggingResource();
		PersonResource personResource = new PersonResource(engine, configuration);
		TaskResource taskResource =  new TaskResource(engine);
		LocationResource locationResource = new LocationResource(engine);
		OrganizationResource orgResource = new OrganizationResource(engine);
		PositionResource positionResource = new PositionResource(engine);
		ReportResource reportResource = new ReportResource(engine, configuration);
		AdminResource adminResource = new AdminResource(engine, configuration);
		HomeResource homeResource = new HomeResource(engine);
		SavedSearchResource savedSearchResource = new SavedSearchResource(engine);
		final TagResource tagResource = new TagResource(engine);
		final AuthorizationGroupResource authorizationGroupResource = new AuthorizationGroupResource(engine);

		//Register all of the HTTP Resources
		environment.jersey().register(loggingResource);
		environment.jersey().register(personResource);
		environment.jersey().register(taskResource);
		environment.jersey().register(locationResource);
		environment.jersey().register(orgResource);
		environment.jersey().register(positionResource);
		environment.jersey().register(reportResource);
		environment.jersey().register(adminResource);
		environment.jersey().register(homeResource);
		environment.jersey().register(savedSearchResource);
		environment.jersey().register(tagResource);
		environment.jersey().register(authorizationGroupResource);
		environment.jersey().register(new ViewResponseFilter(configuration));
		environment.jersey().register(new GraphQLResource(engine,
				ImmutableList.of(reportResource, personResource,
						positionResource, locationResource,
						orgResource, taskResource,
						adminResource, savedSearchResource, tagResource, authorizationGroupResource),
						metricRegistry, configuration.isDevelopmentMode()));
	}

	protected static JSONObject getDictionary(AnetConfiguration configuration)
			throws IllegalArgumentException {
		try (final InputStream inputStream = AnetApplication.class.getResourceAsStream("/anet-schema.yml")) {
			if (inputStream == null) {
				logger.error("ANET schema [anet-schema.yml] not found");
			}
			else {
				final Object obj = yamlMapper.readValue(inputStream, Object.class);
				final JSONObject rawSchema = new JSONObject(new JSONTokener(jsonMapper.writeValueAsString(obj)));
				final Schema schema = SchemaLoader.load(rawSchema);
				final JSONObject dictionary = new JSONObject(configuration.getDictionary());
				schema.validate(dictionary);
				return dictionary;
			}
		} catch (IOException e) {
			logger.error("Error closing ANET schema", e);
		} catch (ValidationException e) {
			logger.error("Dictionary invalid against ANET schema:");
			logValidationErrors(e);
		}
		throw new IllegalArgumentException("Missing or invalid dictionary in the configuration");
	}

	private static void logValidationErrors(ValidationException e) {
		logger.error(e.getMessage());
		e.getCausingExceptions().stream().forEach(AnetApplication::logValidationErrors);
	}

	/*
	 * Adds a Request filter that looks for any HTTP requests and redirects them to HTTPS
	 */
	public void forwardToHttps(ServletContextHandler handler) {
		handler.addFilter(new FilterHolder(new HttpsRedirectFilter()), "/*",  EnumSet.of(DispatcherType.REQUEST));
	}
	
}
