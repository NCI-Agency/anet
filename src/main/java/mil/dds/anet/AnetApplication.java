package mil.dds.anet;

import com.codahale.metrics.MetricRegistry;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.inject.Injector;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import de.ahus1.keycloak.dropwizard.AbstractKeycloakAuthenticator;
import de.ahus1.keycloak.dropwizard.KeycloakBundle;
import de.ahus1.keycloak.dropwizard.KeycloakConfiguration;
import freemarker.template.Configuration;
import freemarker.template.Version;
import io.dropwizard.Application;
import io.dropwizard.auth.AuthValueFactoryProvider;
import io.dropwizard.auth.Authorizer;
import io.dropwizard.bundles.assets.ConfiguredAssetsBundle;
import io.dropwizard.cli.ServerCommand;
import io.dropwizard.configuration.EnvironmentVariableSubstitutor;
import io.dropwizard.configuration.SubstitutingSourceProvider;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.migrations.MigrationsBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import io.dropwizard.views.ViewBundle;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.security.Principal;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import javax.servlet.DispatcherType;
import javax.servlet.http.HttpServletRequest;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetKeycloakConfiguration;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.StatementLogger;
import mil.dds.anet.resources.AdminResource;
import mil.dds.anet.resources.ApprovalStepResource;
import mil.dds.anet.resources.AuthorizationGroupResource;
import mil.dds.anet.resources.GraphQlResource;
import mil.dds.anet.resources.HomeResource;
import mil.dds.anet.resources.LocationResource;
import mil.dds.anet.resources.LoggingResource;
import mil.dds.anet.resources.NoteResource;
import mil.dds.anet.resources.OrganizationResource;
import mil.dds.anet.resources.PersonResource;
import mil.dds.anet.resources.PositionResource;
import mil.dds.anet.resources.ReportResource;
import mil.dds.anet.resources.SavedSearchResource;
import mil.dds.anet.resources.TagResource;
import mil.dds.anet.resources.TaskResource;
import mil.dds.anet.threads.AccountDeactivationWorker;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.FutureEngagementWorker;
import mil.dds.anet.threads.MaterializedViewRefreshWorker;
import mil.dds.anet.threads.ReportApprovalWorker;
import mil.dds.anet.threads.ReportPublicationWorker;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.HttpsRedirectFilter;
import mil.dds.anet.views.ViewResponseFilter;
import org.eclipse.jetty.server.session.SessionHandler;
import org.eclipse.jetty.servlet.FilterHolder;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.keycloak.KeycloakSecurityContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.dropwizard.guice.GuiceBundle;
import ru.vyarus.dropwizard.guice.injector.lookup.InjectorLookup;
import ru.vyarus.guicey.jdbi3.JdbiBundle;

public class AnetApplication extends Application<AnetConfiguration> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
  private static final ObjectMapper jsonMapper = new ObjectMapper();

  public static final Version FREEMARKER_VERSION = Configuration.VERSION_2_3_30;

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
    // Allow the anet.yml configuration to pull from Environment Variables.
    bootstrap.setConfigurationSourceProvider(new SubstitutingSourceProvider(
        bootstrap.getConfigurationSourceProvider(), new EnvironmentVariableSubstitutor(false)));

    // Add the waitForDB command
    bootstrap.addCommand(new WaitForDbCommand());

    // Add the db migration commands
    bootstrap.addBundle(new MigrationsBundle<AnetConfiguration>() {
      @Override
      public DataSourceFactory getDataSourceFactory(AnetConfiguration configuration) {
        logger.info("datasource url: {}", configuration.getDataSourceFactory().getUrl());
        return configuration.getDataSourceFactory();
      }
    });

    // Add the init command
    bootstrap.addCommand(new InitializationCommand(this));

    // Add the database script command
    bootstrap.addCommand(new DatabaseScriptCommand());

    // Add the database maintenance command
    bootstrap.addCommand(new MaintenanceCommand(this));

    // Serve assets on /assets
    bootstrap.addBundle(new ConfiguredAssetsBundle(ImmutableMap.<String, String>builder()
        .put("/assets/", "/assets/").put("/imagery/", "/imagery/").put("/data/", "/data/").build(),
        "index.html"));

    // Use Freemarker to handle rendering TEXT_HTML views.
    bootstrap.addBundle(new ViewBundle<AnetConfiguration>() {
      @Override
      public Map<String, Map<String, String>> getViewConfiguration(
          AnetConfiguration configuration) {
        return configuration.getViews();
      }
    });

    // Add Dropwizard-Keycloak
    bootstrap.addBundle(new KeycloakBundle<AnetConfiguration>() {
      @Override
      public void run(AnetConfiguration configuration, Environment environment) {
        // Add client-side Keycloak configuration to the dictionary
        final Map<String, Object> clientConfig = new HashMap<>();
        final AnetKeycloakConfiguration keycloakConfiguration =
            getKeycloakConfiguration(configuration);
        clientConfig.put("realm", keycloakConfiguration.getRealm());
        clientConfig.put("url", keycloakConfiguration.getAuthServerUrl());
        clientConfig.put("clientId", keycloakConfiguration.getResource() + "-public");
        clientConfig.put("showLogoutLink", keycloakConfiguration.isShowLogoutLink());
        final Map<String, Object> dictionary = new HashMap<>(configuration.getDictionary());
        dictionary.put("keycloakConfiguration", clientConfig);
        configuration.setDictionary(dictionary);

        super.run(configuration, environment);
      }

      @Override
      protected AnetKeycloakConfiguration getKeycloakConfiguration(
          AnetConfiguration configuration) {
        return configuration.getKeycloakConfiguration();
      }

      @Override
      protected Class<? extends Principal> getUserClass() {
        return Person.class;
      }

      @Override
      protected AbstractKeycloakAuthenticator<Person> createAuthenticator(
          KeycloakConfiguration configuration) {
        return new AbstractKeycloakAuthenticator<Person>(configuration) {
          @Override
          protected Person prepareAuthentication(KeycloakSecurityContext securityContext,
              HttpServletRequest request, KeycloakConfiguration keycloakConfiguration) {
            final PersonDao dao = AnetObjectEngine.getInstance().getPersonDao();
            final String username = securityContext.getToken().getPreferredUsername();
            final List<Person> p = dao.findByDomainUsername(username);
            if (p.isEmpty()) {
              // First time this user has ever logged in.
              final Person person = new Person();
              person.setDomainUsername(username);
              person.setName("");
              person.setRole(Role.ADVISOR);
              person.setStatus(PersonStatus.NEW_USER);
              return dao.insert(person);
            }
            return p.get(0);
          }
        };
      }

      @Override
      protected Authorizer<Person> createAuthorizer() {
        return new Authorizer<Person>() {
          @Override
          public boolean authorize(Person principal, String role) {
            // We don't use @RolesAllowed type authorizations
            return false;
          }
        };
      }
    });

    // Add Dropwizard-Guicey
    bootstrap.addBundle(GuiceBundle.builder()
        .bundles(
            JdbiBundle.<AnetConfiguration>forDatabase((conf, env) -> conf.getDataSourceFactory()))
        .build());

    metricRegistry = bootstrap.getMetricRegistry();
  }

  @Override
  public void run(AnetConfiguration configuration, Environment environment)
      throws IllegalArgumentException {
    // Get the Database connection up and running
    final String dbUrl = configuration.getDataSourceFactory().getUrl();
    logger.info("datasource url: {}", dbUrl);

    // Check the dictionary
    final JsonNode dictionary = getDictionary(configuration);
    try {
      logger.info("dictionary: {}", yamlMapper.writeValueAsString(dictionary));
    } catch (JsonProcessingException exception) {
    }

    // We want to use our own custom DB logger in order to clean up the logs a bit.
    final Injector injector = InjectorLookup.getInjector(this).get();
    injector.getInstance(StatementLogger.class);

    // The Object Engine is the core place where we store all of the Dao's
    // You can always grab the engine from anywhere with AnetObjectEngine.getInstance()
    final AnetObjectEngine engine = new AnetObjectEngine(dbUrl, this, metricRegistry);
    environment.servlets().setSessionHandler(new SessionHandler());

    if (configuration.getRedirectToHttps()) {
      forwardToHttps(environment.getApplicationContext());
    }

    // If you want to use @Auth to inject a custom Principal type into your resource
    environment.jersey().register(new AuthValueFactoryProvider.Binder<>(Person.class));
    // We no longer use @RolesAllowed to do authorization
    // environment.jersey().register(RolesAllowedDynamicFeature.class);
    environment.jersey().register(new WebExceptionMapper());

    if (configuration.isTestMode()) {
      logger.info("AnetApplication is in testMode, skipping scheduled workers");
    } else {
      logger.info("AnetApplication is starting scheduled workers");
      // Schedule any tasks that need to run on an ongoing basis.
      ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
      AnetEmailWorker emailWorker = new AnetEmailWorker(engine.getEmailDao(), configuration);
      FutureEngagementWorker futureWorker = new FutureEngagementWorker(engine.getReportDao());
      ReportPublicationWorker reportPublicationWorker =
          new ReportPublicationWorker(engine.getReportDao(), configuration);
      final ReportApprovalWorker reportApprovalWorker =
          new ReportApprovalWorker(engine.getReportDao(), configuration);

      // Check for any reports that need to be published every 5 minutes.
      // And run once in 5 seconds from boot-up. (give the server time to boot up).
      scheduler.scheduleAtFixedRate(reportPublicationWorker, 5, 5, TimeUnit.MINUTES);
      scheduler.schedule(reportPublicationWorker, 5, TimeUnit.SECONDS);

      // Check for any emails that need to be sent every 5 minutes.
      // And run once in 10 seconds from boot-up. (give the server time to boot up).
      scheduler.scheduleAtFixedRate(emailWorker, 5, 5, TimeUnit.MINUTES);
      scheduler.schedule(emailWorker, 10, TimeUnit.SECONDS);

      // Check for any future engagements every 3 hours.
      // And run once in 15 seconds from boot-up. (give the server time to boot up).
      scheduler.scheduleAtFixedRate(futureWorker, 0, 3, TimeUnit.HOURS);
      scheduler.schedule(futureWorker, 15, TimeUnit.SECONDS);

      // Check for any reports that need to be approved every 5 minutes.
      // And run once in 20 seconds from boot-up. (give the server time to boot up).
      scheduler.scheduleAtFixedRate(reportApprovalWorker, 5, 5, TimeUnit.MINUTES);
      scheduler.schedule(reportApprovalWorker, 5, TimeUnit.SECONDS);

      runAccountDeactivationWorker(configuration, scheduler, engine);

      if (DaoUtils.isPostgresql()) {
        // Wait 60 seconds between updates of PostgreSQL materialized views,
        // starting 30 seconds after boot-up.
        final MaterializedViewRefreshWorker materializedViewRefreshWorker =
            new MaterializedViewRefreshWorker(engine.getAdminDao());
        scheduler.scheduleWithFixedDelay(materializedViewRefreshWorker, 30, 60, TimeUnit.SECONDS);
      }
    }

    // Create all of the HTTP Resources.
    LoggingResource loggingResource = new LoggingResource();
    PersonResource personResource = new PersonResource(engine, configuration);
    TaskResource taskResource = new TaskResource(engine, configuration);
    LocationResource locationResource = new LocationResource(engine);
    OrganizationResource orgResource = new OrganizationResource(engine);
    PositionResource positionResource = new PositionResource(engine);
    ReportResource reportResource = new ReportResource(engine, configuration);
    AdminResource adminResource = new AdminResource(engine, configuration);
    HomeResource homeResource = new HomeResource(engine, configuration);
    SavedSearchResource savedSearchResource = new SavedSearchResource(engine);
    final TagResource tagResource = new TagResource(engine);
    final AuthorizationGroupResource authorizationGroupResource =
        new AuthorizationGroupResource(engine);
    final NoteResource noteResource = new NoteResource(engine);
    final ApprovalStepResource approvalStepResource = new ApprovalStepResource(engine);

    // Register all of the HTTP Resources
    environment.jersey().register(loggingResource);
    environment.jersey().register(adminResource);
    environment.jersey().register(homeResource);
    environment.jersey().register(new ViewResponseFilter(configuration));
    environment.jersey()
        .register(new GraphQlResource(engine, configuration,
            ImmutableList.of(reportResource, personResource, positionResource, locationResource,
                orgResource, taskResource, adminResource, savedSearchResource, tagResource,
                authorizationGroupResource, noteResource, approvalStepResource),
            metricRegistry));
  }

  private void runAccountDeactivationWorker(final AnetConfiguration configuration,
      final ScheduledExecutorService scheduler, final AnetObjectEngine engine)
      throws IllegalArgumentException {
    // Check whether the application is configured to auto-check for account deactivation
    if (configuration.getDictionaryEntry("automaticallyInactivateUsers") != null) {
      // Check for any accounts which are scheduled to be deactivated as they reach the end-of-tour
      // date.
      final Integer accountDeactivationWarningInterval = (Integer) configuration
          .getDictionaryEntry("automaticallyInactivateUsers.checkIntervalInSecs");
      final AccountDeactivationWorker deactivationWarningWorker = new AccountDeactivationWorker(
          configuration, engine.getPersonDao(), accountDeactivationWarningInterval);

      // Run the account deactivation worker at the set interval.
      scheduler.scheduleAtFixedRate(deactivationWarningWorker, accountDeactivationWarningInterval,
          accountDeactivationWarningInterval, TimeUnit.SECONDS);

      // While in development, run the worker once at the start to see whether it works correctly
      if (configuration.isDevelopmentMode()) {
        scheduler.schedule(deactivationWarningWorker, 20, TimeUnit.SECONDS);
      }
    }
  }

  protected static JsonNode getDictionary(AnetConfiguration configuration)
      throws IllegalArgumentException {
    try (final InputStream inputStream =
        AnetApplication.class.getResourceAsStream("/anet-schema.yml")) {
      if (inputStream == null) {
        logger.error("ANET schema [anet-schema.yml] not found");
      } else {
        JsonSchemaFactory factory =
            JsonSchemaFactory.builder(JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7))
                .objectMapper(yamlMapper).build();

        JsonSchema schema = factory.getSchema(inputStream);
        final JsonNode dictionary = jsonMapper.valueToTree(configuration.getDictionary());
        Set<ValidationMessage> errors = schema.validate(dictionary);
        for (ValidationMessage error : errors) {
          logger.error(error.getMessage());
        }
        if (!errors.isEmpty()) {
          throw new IllegalArgumentException("Invalid dictionary in the configuration");
        }
        return dictionary;
      }
    } catch (IOException e) {
      logger.error("Error closing ANET schema", e);
    }
    throw new IllegalArgumentException("Missing dictionary in the configuration");
  }

  /*
   * Adds a Request filter that looks for any HTTP requests and redirects them to HTTPS
   */
  public void forwardToHttps(ServletContextHandler handler) {
    handler.addFilter(new FilterHolder(new HttpsRedirectFilter()), "/*",
        EnumSet.of(DispatcherType.REQUEST));
  }

}
