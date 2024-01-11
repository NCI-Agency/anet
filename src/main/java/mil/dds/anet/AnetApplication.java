package mil.dds.anet;

import com.codahale.metrics.MetricRegistry;
import com.google.inject.Injector;
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
import io.dropwizard.forms.MultiPartBundle;
import io.dropwizard.migrations.MigrationsBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import io.dropwizard.views.ViewBundle;
import java.lang.invoke.MethodHandles;
import java.security.Principal;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import javax.servlet.DispatcherType;
import javax.servlet.http.HttpServletRequest;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetKeycloakConfiguration;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.StatementLogger;
import mil.dds.anet.resources.AdminResource;
import mil.dds.anet.resources.ApprovalStepResource;
import mil.dds.anet.resources.AttachmentResource;
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
import mil.dds.anet.resources.SubscriptionResource;
import mil.dds.anet.resources.SubscriptionUpdateResource;
import mil.dds.anet.resources.TaskResource;
import mil.dds.anet.threads.AccountDeactivationWorker;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.FutureEngagementWorker;
import mil.dds.anet.threads.MaterializedViewRefreshWorker;
import mil.dds.anet.threads.PendingAssessmentsNotificationWorker;
import mil.dds.anet.threads.ReportApprovalWorker;
import mil.dds.anet.threads.ReportPublicationWorker;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.HttpsRedirectFilter;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.RequestLoggingFilter;
import mil.dds.anet.views.ViewRequestFilter;
import mil.dds.anet.views.ViewResponseFilter;
import org.eclipse.jetty.server.session.SessionHandler;
import org.eclipse.jetty.servlet.FilterHolder;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.jdbi.v3.postgres.PostgresPlugin;
import org.keycloak.KeycloakSecurityContext;
import org.keycloak.representations.AccessToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.dropwizard.guice.GuiceBundle;
import ru.vyarus.dropwizard.guice.injector.lookup.InjectorLookup;
import ru.vyarus.guicey.jdbi3.JdbiBundle;

public class AnetApplication extends Application<AnetConfiguration> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

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
    bootstrap.addBundle(new ConfiguredAssetsBundle(
        Map.of("/assets/", "/assets/", "/imagery/", "/imagery/", "/data/", "/data/"),
        "index.html"));

    // Use Freemarker to handle rendering TEXT_HTML views.
    bootstrap.addBundle(new ViewBundle<AnetConfiguration>() {
      @Override
      public Map<String, Map<String, String>> getViewConfiguration(
          AnetConfiguration configuration) {
        return configuration.getViews();
      }
    });

    // Add Multipart for stream attachment content
    bootstrap.addBundle(new MultiPartBundle());

    // Add Dropwizard-Keycloak
    bootstrap.addBundle(new KeycloakBundle<>() {
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
            final AccessToken token = securityContext.getToken();
            // Call non-synchronized method first
            Person person = findUser(dao, token);
            if (person == null) {
              // Call synchronized method
              person = findOrCreateUser(dao, token);
            }
            return person;
          }

          // Non-synchronized method, safe to run multiple times in parallel
          private Person findUser(final PersonDao dao, final AccessToken token) {
            final String openIdSubject = token.getSubject();
            final List<Person> p = dao.findByOpenIdSubject(openIdSubject);
            if (!p.isEmpty()) {
              final Person existingPerson = p.get(0);
              logger.trace("found existing user={} by openIdSubject={}", existingPerson,
                  openIdSubject);
              return existingPerson;
            }

            return null;
          }

          // Synchronized method, so we create/update at most one user in the face of multiple
          // simultaneous authentication requests
          private synchronized Person findOrCreateUser(final PersonDao dao,
              final AccessToken token) {
            final Person person = findUser(dao, token);
            if (person != null) {
              return person;
            }

            // Might be user from before Keycloak integration, try username
            final String username = token.getPreferredUsername();
            final String openIdSubject = token.getSubject();
            List<Person> p = dao.findByDomainUsername(username);
            if (!p.isEmpty()) {
              final Person existingPerson = p.get(0);
              logger.trace(
                  "found existing user={} by domainUsername={}; setting openIdSubject={} (was {})",
                  existingPerson, username, openIdSubject, existingPerson.getOpenIdSubject());
              existingPerson.setOpenIdSubject(openIdSubject);
              dao.updateAuthenticationDetails(existingPerson);
              return existingPerson;
            }

            // Fall back to email
            final String email = token.getEmail();
            p = dao.findByEmailAddress(email);
            if (!p.isEmpty()) {
              final Person existingPerson = p.get(0);
              logger.trace(
                  "found existing user={} by emailAddress={}; setting openIdSubject={} (was {})",
                  existingPerson, email, openIdSubject, existingPerson.getOpenIdSubject());
              existingPerson.setOpenIdSubject(openIdSubject);
              dao.updateAuthenticationDetails(existingPerson);
              return existingPerson;
            }

            // Not found, first time this user has ever logged in
            final Person newPerson = new Person();
            logger.trace("creating new user with domainUsername={}, email={} and openIdSubject={}",
                username, email, openIdSubject);
            newPerson.setRole(Role.ADVISOR);
            newPerson.setPendingVerification(true);
            // Copy some data from the authentication token
            newPerson.setOpenIdSubject(openIdSubject);
            newPerson.setDomainUsername(username);
            newPerson.setEmailAddress(email);
            newPerson.setName(getCombinedName(token));
            /*
             * Note: there's also token.getGender(), but that's not generally available in AD/LDAP,
             * and token.getPhoneNumber(), but that requires scope="openid phone" on the
             * authentication request, which is hard to accomplish with current Keycloak code.
             */
            return dao.insert(newPerson);
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

      private String getCombinedName(AccessToken token) {
        final StringBuilder combinedName = new StringBuilder();
        // Try to combine FAMILYNAME, GivenName MiddleName
        final String fn = Utils.trimStringReturnNull(token.getFamilyName());
        if (!Utils.isEmptyOrNull(fn)) {
          combinedName.append(fn.toUpperCase());
          final String gn = Utils.trimStringReturnNull(token.getGivenName());
          if (!Utils.isEmptyOrNull(gn)) {
            combinedName.append(", ");
            combinedName.append(gn);
          }
          final String mn = Utils.trimStringReturnNull(token.getMiddleName());
          if (!Utils.isEmptyOrNull(mn)) {
            combinedName.append(" ");
            combinedName.append(mn);
          }
        }
        if (combinedName.isEmpty() && !Utils.isEmptyOrNull(token.getName())) {
          // Fall back to just the name
          combinedName.append(token.getName());
        }
        return combinedName.toString();
      }
    });

    // Add Dropwizard-Guicey
    bootstrap
        .addBundle(GuiceBundle.builder()
            .bundles(JdbiBundle
                .<AnetConfiguration>forDatabase((conf, env) -> conf.getDataSourceFactory())
                // For supporting PostgreSQL large objects
                .withPlugins(new PostgresPlugin()))
            .build());

    metricRegistry = bootstrap.getMetricRegistry();
  }

  @Override
  public void run(AnetConfiguration configuration, Environment environment)
      throws IllegalArgumentException {
    // Get the Database connection up and running
    final String dbUrl = configuration.getDataSourceFactory().getUrl();
    logger.info("datasource url: {}", dbUrl);

    // We want to use our own custom DB logger in order to clean up the logs a bit.
    final Injector injector = InjectorLookup.getInjector(this).get();
    injector.getInstance(StatementLogger.class);

    // The Object Engine is the core place where we store all of the Dao's
    // You can always grab the engine from anywhere with AnetObjectEngine.getInstance()
    final AnetObjectEngine engine =
        new AnetObjectEngine(dbUrl, this, configuration, metricRegistry);
    environment.servlets().setSessionHandler(new SessionHandler());

    if (configuration.getRedirectToHttps()) {
      forwardToHttps(environment.getApplicationContext());
    }

    // If you want to use @Auth to inject a custom Principal type into your resource
    environment.jersey().register(new AuthValueFactoryProvider.Binder<>(Person.class));
    // We no longer use @RolesAllowed to do authorization
    // environment.jersey().register(RolesAllowedDynamicFeature.class);
    environment.jersey().register(new WebExceptionMapper());
    environment.jersey().register(new ConnectionExceptionMapper());

    if (configuration.isTestMode()) {
      logger.info("AnetApplication is in testMode, skipping scheduled workers");
    } else {
      logger.info("AnetApplication is starting scheduled workers");
      // Schedule any tasks that need to run on an ongoing basis.
      final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

      // Check for any reports that need to be published every 5 minutes.
      // And run once in 5 seconds from boot-up. (give the server time to boot up).
      final ReportPublicationWorker reportPublicationWorker =
          new ReportPublicationWorker(configuration, engine.getReportDao());
      scheduler.scheduleAtFixedRate(reportPublicationWorker, 5, 5, TimeUnit.MINUTES);
      scheduler.schedule(reportPublicationWorker, 5, TimeUnit.SECONDS);

      // Check for any emails that need to be sent every 5 minutes.
      // And run once in 10 seconds from boot-up. (give the server time to boot up).
      final AnetEmailWorker emailWorker = new AnetEmailWorker(configuration, engine.getEmailDao());
      scheduler.scheduleAtFixedRate(emailWorker, 5, 5, TimeUnit.MINUTES);
      scheduler.schedule(emailWorker, 10, TimeUnit.SECONDS);

      // Check for any future engagements every 3 hours.
      // And run once in 15 seconds from boot-up. (give the server time to boot up).
      final FutureEngagementWorker futureWorker =
          new FutureEngagementWorker(configuration, engine.getReportDao());
      scheduler.scheduleAtFixedRate(futureWorker, 0, 3, TimeUnit.HOURS);
      scheduler.schedule(futureWorker, 15, TimeUnit.SECONDS);

      // Check for any reports that need to be approved every 5 minutes.
      // And run once in 20 seconds from boot-up. (give the server time to boot up).
      final ReportApprovalWorker reportApprovalWorker =
          new ReportApprovalWorker(configuration, engine.getReportDao());
      scheduler.scheduleAtFixedRate(reportApprovalWorker, 5, 5, TimeUnit.MINUTES);
      scheduler.schedule(reportApprovalWorker, 5, TimeUnit.SECONDS);

      runAccountDeactivationWorker(configuration, scheduler, engine);

      // Check for any missing pending assessments every 6 hours.
      // And run once in 25 seconds from boot-up. (give the server time to boot up).
      final PendingAssessmentsNotificationWorker pendingAssessmentsNotificationWorker =
          new PendingAssessmentsNotificationWorker(configuration);
      scheduler.scheduleAtFixedRate(pendingAssessmentsNotificationWorker, 6, 6, TimeUnit.HOURS);
      scheduler.schedule(pendingAssessmentsNotificationWorker, 25, TimeUnit.SECONDS);

      if (DaoUtils.isPostgresql()) {
        // Wait 60 seconds between updates of PostgreSQL materialized views,
        // starting 30 seconds after boot-up.
        final MaterializedViewRefreshWorker materializedViewRefreshWorker =
            new MaterializedViewRefreshWorker(configuration, engine.getAdminDao());
        scheduler.scheduleWithFixedDelay(materializedViewRefreshWorker, 30, 60, TimeUnit.SECONDS);
      }
    }

    // Create all of the HTTP Resources.
    final LoggingResource loggingResource = new LoggingResource();
    final PersonResource personResource = new PersonResource(engine, configuration);
    final TaskResource taskResource = new TaskResource(engine, configuration);
    final LocationResource locationResource = new LocationResource(engine);
    final OrganizationResource orgResource = new OrganizationResource(engine);
    final PositionResource positionResource = new PositionResource(engine);
    final ReportResource reportResource = new ReportResource(engine, configuration);
    final AdminResource adminResource = new AdminResource(engine, configuration);
    final HomeResource homeResource = new HomeResource(engine, configuration);
    final SavedSearchResource savedSearchResource = new SavedSearchResource(engine);
    final AuthorizationGroupResource authorizationGroupResource =
        new AuthorizationGroupResource(engine);
    final NoteResource noteResource = new NoteResource(engine);
    final ApprovalStepResource approvalStepResource = new ApprovalStepResource(engine);
    final SubscriptionResource subscriptionResource = new SubscriptionResource(engine);
    final SubscriptionUpdateResource subscriptionUpdateResource =
        new SubscriptionUpdateResource(engine);
    final AttachmentResource attachmentResource = new AttachmentResource(engine);
    final GraphQlResource graphQlResource = injector.getInstance(GraphQlResource.class);
    graphQlResource.initialise(engine, configuration,
        List.of(reportResource, personResource, positionResource, locationResource, orgResource,
            taskResource, adminResource, savedSearchResource, authorizationGroupResource,
            noteResource, approvalStepResource, subscriptionResource, subscriptionUpdateResource,
            attachmentResource),
        metricRegistry);

    // Register all of the HTTP Resources
    environment.jersey().register(loggingResource);
    environment.jersey().register(adminResource);
    environment.jersey().register(homeResource);
    environment.jersey().register(graphQlResource);
    environment.jersey().register(attachmentResource);
    environment.jersey().register(new RequestLoggingFilter(engine));
    environment.jersey().register(ViewRequestFilter.class);
    environment.jersey().register(ViewResponseFilter.class);
  }

  private void runAccountDeactivationWorker(final AnetConfiguration configuration,
      final ScheduledExecutorService scheduler, final AnetObjectEngine engine) {
    // Check whether the application is configured to auto-check for account deactivation.
    // NOTE: if you change this, reloading the dictionary from the admin interface is *not*
    // sufficient, you will have to restart ANET for this change to be reflected
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

  /*
   * Adds a Request filter that looks for any HTTP requests and redirects them to HTTPS
   */
  public void forwardToHttps(ServletContextHandler handler) {
    handler.addFilter(new FilterHolder(new HttpsRedirectFilter()), "/*",
        EnumSet.of(DispatcherType.REQUEST));
  }

}
