package mil.dds.anet.config;

import graphql.ExceptionWhileDataFetching;
import graphql.GraphQL;
import graphql.GraphQLContext;
import graphql.execution.SimpleDataFetcherExceptionHandler;
import graphql.schema.GraphQLSchema;
import io.leangen.graphql.ExecutableSchema;
import io.leangen.graphql.GraphQLRuntime;
import io.leangen.graphql.GraphQLSchemaGenerator;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.execution.InvocationContext;
import io.leangen.graphql.execution.ResolutionEnvironment;
import io.leangen.graphql.execution.ResolverInterceptor;
import io.leangen.graphql.generator.mapping.common.ScalarMapper;
import io.leangen.graphql.metadata.strategy.DefaultInclusionStrategy;
import io.leangen.graphql.metadata.strategy.InputFieldInclusionParams;
import io.leangen.graphql.metadata.strategy.query.AnnotatedResolverBuilder;
import io.leangen.graphql.spqr.spring.autoconfigure.SpqrProperties;
import io.leangen.graphql.spqr.spring.web.GraphQLController;
import java.lang.reflect.AnnotatedElement;
import java.util.List;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.graphql.DateTimeMapper;
import mil.dds.anet.graphql.RestrictToAuthorizationGroups;
import mil.dds.anet.resources.AccessTokenResource;
import mil.dds.anet.resources.AdminResource;
import mil.dds.anet.resources.AnetEmailResource;
import mil.dds.anet.resources.ApprovalStepResource;
import mil.dds.anet.resources.AssessmentResource;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.resources.AuthorizationGroupResource;
import mil.dds.anet.resources.EntityAvatarResource;
import mil.dds.anet.resources.EventResource;
import mil.dds.anet.resources.EventSeriesResource;
import mil.dds.anet.resources.LocationResource;
import mil.dds.anet.resources.MartImportedReportsResource;
import mil.dds.anet.resources.NoteResource;
import mil.dds.anet.resources.OrganizationResource;
import mil.dds.anet.resources.PersonResource;
import mil.dds.anet.resources.PositionResource;
import mil.dds.anet.resources.ReportResource;
import mil.dds.anet.resources.SavedSearchResource;
import mil.dds.anet.resources.SubscriptionResource;
import mil.dds.anet.resources.SubscriptionUpdateResource;
import mil.dds.anet.resources.TaskResource;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Component
@EnableWebMvc
public class GraphQLConfig implements WebMvcConfigurer {

  private final AccessTokenResource accessTokenResource;
  private final AdminResource adminResource;
  private final AnetEmailResource anetEmailResource;
  private final ApprovalStepResource approvalStepResource;
  private final AssessmentResource assessmentResource;
  private final AttachmentResource attachmentResource;
  private final AuthorizationGroupResource authorizationGroupResource;
  private final EntityAvatarResource entityAvatarResource;
  private final EventResource eventResource;
  private final EventSeriesResource eventSeriesResource;
  private final LocationResource locationResource;
  private final MartImportedReportsResource martImportedReportsResource;
  private final NoteResource noteResource;
  private final OrganizationResource organizationResource;
  private final PersonResource personResource;
  private final PositionResource positionResource;
  private final ReportResource reportResource;
  private final SavedSearchResource savedSearchResource;
  private final SubscriptionResource subscriptionResource;
  private final SubscriptionUpdateResource subscriptionUpdateResource;
  private final TaskResource taskResource;

  public GraphQLConfig(AccessTokenResource accessTokenResource, AdminResource adminResource,
      AnetEmailResource anetEmailResource, ApprovalStepResource approvalStepResource,
      AssessmentResource assessmentResource, AttachmentResource attachmentResource,
      AuthorizationGroupResource authorizationGroupResource,
      EntityAvatarResource entityAvatarResource, EventResource eventResource,
      EventSeriesResource eventSeriesResource, LocationResource locationResource,
      MartImportedReportsResource martImportedReportsResource, NoteResource noteResource,
      OrganizationResource organizationResource, PersonResource personResource,
      PositionResource positionResource, ReportResource reportResource,
      SavedSearchResource savedSearchResource, SubscriptionResource subscriptionResource,
      SubscriptionUpdateResource subscriptionUpdateResource, TaskResource taskResource) {
    this.accessTokenResource = accessTokenResource;
    this.adminResource = adminResource;
    this.anetEmailResource = anetEmailResource;
    this.approvalStepResource = approvalStepResource;
    this.assessmentResource = assessmentResource;
    this.attachmentResource = attachmentResource;
    this.authorizationGroupResource = authorizationGroupResource;
    this.entityAvatarResource = entityAvatarResource;
    this.eventResource = eventResource;
    this.eventSeriesResource = eventSeriesResource;
    this.locationResource = locationResource;
    this.martImportedReportsResource = martImportedReportsResource;
    this.noteResource = noteResource;
    this.organizationResource = organizationResource;
    this.personResource = personResource;
    this.positionResource = positionResource;
    this.reportResource = reportResource;
    this.savedSearchResource = savedSearchResource;
    this.subscriptionResource = subscriptionResource;
    this.subscriptionUpdateResource = subscriptionUpdateResource;
    this.taskResource = taskResource;
  }

  @Bean
  public GraphQLController<NativeWebRequest> graphQLController() {
    return null;
  }

  @Bean
  public GraphQLSchemaGenerator graphQLSchemaGenerator(SpqrProperties spqrProperties) {
    final var basePackages = spqrProperties.getBasePackages();
    final GraphQLSchemaGenerator schemaGenerator = new GraphQLSchemaGenerator()
        // Load only our own packages:
        .withBasePackages(basePackages)
        // Resolve queries by @GraphQLQuery annotations only:
        .withNestedResolverBuilders(new AnnotatedResolverBuilder())
        // Resolve inputs by @GraphQLInputField annotations only:
        .withInclusionStrategy(new DefaultInclusionStrategy(basePackages) {
          @Override
          public boolean includeInputField(InputFieldInclusionParams params) {
            return super.includeInputField(params)
                && params.getElements().stream().anyMatch(this::isAnnotated);
          }

          private boolean isAnnotated(AnnotatedElement element) {
            return element.isAnnotationPresent(GraphQLInputField.class);
          }
        })
        // Load our DateTimeMapper:
        .withTypeMappers(
            (config, defaults) -> defaults.insertBefore(ScalarMapper.class, new DateTimeMapper()))
        // Intercept calls to check whether user is authorized
        .withResolverInterceptors(new AuthorizationInterceptor());
    for (final Object resource : getGraphQLResources()) {
      schemaGenerator.withOperationsFromSingleton(resource);
    }
    return schemaGenerator;
  }

  @Bean
  public ExecutableSchema graphQLExecutableSchema(GraphQLSchemaGenerator schemaGenerator) {
    return schemaGenerator.generateExecutable();
  }

  @Bean
  public GraphQLSchema graphQLSchema(ExecutableSchema executableSchema) {
    return executableSchema.getSchema();
  }

  static class CustomDataFetcherExceptionHandler extends SimpleDataFetcherExceptionHandler {
    @Override
    protected void logException(ExceptionWhileDataFetching error, Throwable exception) {
      // Don't log connection exceptions as it may cause excessive logging; in any case it is
      // already shown in the warn message from the execute() method below
      if (!(exception instanceof CannotGetJdbcConnectionException)
          && !(exception instanceof CannotCreateTransactionException)) {
        super.logException(error, exception);
      }
    }
  }

  @Bean
  public GraphQL graphQL(ExecutableSchema schema) {
    return GraphQLRuntime.newGraphQL(schema)
        // custom error handler to reduce logging
        .defaultDataFetcherExceptionHandler(new CustomDataFetcherExceptionHandler())
        // Prevent adding .instrumentation(new DataLoaderDispatcherInstrumentation())
        // — use our own dispatcher instead
        .doNotAddDefaultInstrumentations().build();
  }

  private List<Object> getGraphQLResources() {
    // Create all GraphQL Resources
    return List.of(accessTokenResource, adminResource, anetEmailResource, approvalStepResource,
        assessmentResource, attachmentResource, authorizationGroupResource, entityAvatarResource,
        eventResource, eventSeriesResource, locationResource, martImportedReportsResource,
        noteResource, organizationResource, personResource, positionResource, reportResource,
        savedSearchResource, subscriptionResource, subscriptionUpdateResource, taskResource);
  }

  public static class AuthorizationInterceptor implements ResolverInterceptor {
    @Override
    public Object aroundInvoke(final InvocationContext invocationContext,
        final Continuation continuation) throws Exception {
      final AnnotatedElement delegate =
          invocationContext.getResolver().getExecutable().getDelegate();
      final ResolutionEnvironment resolutionEnvironment =
          invocationContext.getResolutionEnvironment();
      final GraphQLContext context =
          resolutionEnvironment.dataFetchingEnvironment.getGraphQlContext();

      // In context, we might have an ANET user or a GraphQLWebServiceAccessToken
      final Person currentUser = DaoUtils.getUserFromContext(context);
      final AccessToken accessToken = DaoUtils.getGraphQLWebServiceAccessToken(context);

      // Check for unverified users
      if (accessToken == null && denyUnverifiedUsers(delegate, currentUser)) {
        // Simply return null so the GraphQL response contains no extra information
        return null;
      }

      // Check for access restricted to authorizationGroups
      if (denyRestrictedAccess(delegate, resolutionEnvironment, currentUser)) {
        // Simply return null so the GraphQL response contains no extra information
        return null;
      }

      return continuation.proceed(invocationContext);
    }

    private boolean denyUnverifiedUsers(AnnotatedElement delegate, Person currentUser) {
      final AllowUnverifiedUsers allowUnverifiedUsers =
          delegate.getAnnotation(AllowUnverifiedUsers.class);
      return allowUnverifiedUsers == null
          && Boolean.TRUE.equals(currentUser.getPendingVerification());
    }

    private boolean denyRestrictedAccess(AnnotatedElement delegate,
        ResolutionEnvironment resolutionEnvironment, Person currentUser) {
      final RestrictToAuthorizationGroups restrictToAuthorizationGroups =
          delegate.getAnnotation(RestrictToAuthorizationGroups.class);
      if (restrictToAuthorizationGroups != null) {
        final String authorizationGroupSetting =
            restrictToAuthorizationGroups.authorizationGroupSetting();
        @SuppressWarnings("unchecked")
        final List<String> authorizationGroupUuids = (List<String>) ApplicationContextProvider
            .getDictionary().getDictionaryEntry(authorizationGroupSetting);
        if (currentUser != null && authorizationGroupUuids != null) {
          // Make sure the current user's authorizationGroups are loaded (should happen only once
          // per request execution)
          currentUser.loadAuthorizationGroups();
          if (!DaoUtils.isInAuthorizationGroup(currentUser.getAuthorizationGroupUuids(),
              authorizationGroupUuids)) {
            if (resolutionEnvironment.context instanceof Person contextPerson) {
              return !PersonResource.hasPermission(currentUser, contextPerson);
            } else if (resolutionEnvironment.context instanceof Position contextPosition) {
              return !PositionResource.hasPermission(currentUser, contextPosition);
            } else if (resolutionEnvironment.context instanceof Organization contextOrganization) {
              return !OrganizationResource.hasPermission(currentUser, contextOrganization);
            }
          }
        }
      }
      return false;
    }
  }
}
