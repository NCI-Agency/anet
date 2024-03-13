package mil.dds.anet.resources;

import com.codahale.metrics.MetricRegistry;
import com.codahale.metrics.annotation.Timed;
import graphql.ExceptionWhileDataFetching;
import graphql.ExecutionInput;
import graphql.ExecutionResult;
import graphql.GraphQL;
import graphql.GraphQLError;
import graphql.execution.SimpleDataFetcherExceptionHandler;
import graphql.schema.GraphQLSchema;
import graphql.schema.visibility.NoIntrospectionGraphqlFieldVisibility;
import io.dropwizard.auth.Auth;
import io.leangen.graphql.GraphQLSchemaGenerator;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.execution.InvocationContext;
import io.leangen.graphql.execution.ResolverInterceptor;
import io.leangen.graphql.generator.mapping.common.ScalarMapper;
import io.leangen.graphql.metadata.strategy.DefaultInclusionStrategy;
import io.leangen.graphql.metadata.strategy.InputFieldInclusionParams;
import io.leangen.graphql.metadata.strategy.query.AnnotatedResolverBuilder;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.ResponseBuilder;
import jakarta.ws.rs.core.Response.Status;
import java.lang.invoke.MethodHandles;
import java.lang.reflect.AnnotatedElement;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;
import java.util.function.Function;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.graphql.DateTimeMapper;
import mil.dds.anet.graphql.outputtransformers.JsonToXlsxTransformer;
import mil.dds.anet.graphql.outputtransformers.JsonToXmlTransformer;
import mil.dds.anet.graphql.outputtransformers.XsltXmlTransformer;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.BatchingUtils;
import mil.dds.anet.utils.DaoUtils;
import org.apache.commons.lang3.StringUtils;
import org.dataloader.DataLoaderRegistry;
import org.jdbi.v3.core.ConnectionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@Path("/graphql")
public class GraphQlResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final String MEDIATYPE_XLSX =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  private AnetObjectEngine engine;
  private List<Object> resources;
  private MetricRegistry metricRegistry;
  private Long graphQlRequestTimeoutMs;

  private GraphQLSchema graphqlSchema;
  private GraphQLSchema graphqlSchemaWithoutIntrospection;
  private final List<ResourceTransformer> resourceTransformers =
      new LinkedList<ResourceTransformer>();

  abstract static class ResourceTransformer
      implements Function<Map<String, Object>, ResponseBuilder> {
    public final String outputType;
    public final String mediaType;

    public ResourceTransformer(String outputType, String mediaType) {
      this.outputType = outputType;
      this.mediaType = mediaType;
    }
  }

  private static final ResourceTransformer jsonTransformer =
      new ResourceTransformer("json", MediaType.APPLICATION_JSON) {
        @Override
        public ResponseBuilder apply(Map<String, Object> json) {
          return Response.ok(json, this.mediaType);
        }
      };

  private static class AuthorizationInterceptor implements ResolverInterceptor {
    @Override
    public Object aroundInvoke(final InvocationContext invocationContext,
        final Continuation continuation) throws Exception {
      final Map<String, Object> context =
          invocationContext.getResolutionEnvironment().dataFetchingEnvironment.getContext();
      final Person currentUser = DaoUtils.getUserFromContext(context);
      final AllowUnverifiedUsers allowUnverifiedUsers = invocationContext.getResolver()
          .getExecutable().getDelegate().getAnnotation(AllowUnverifiedUsers.class);
      if (allowUnverifiedUsers == null
          && Boolean.TRUE.equals(currentUser.getPendingVerification())) {
        // Simply return null so the GraphQL response contains no extra information
        return null;
      }
      return continuation.proceed(invocationContext);
    }
  }

  public GraphQlResource() {}

  public void initialise(AnetObjectEngine engine, AnetConfiguration config, List<Object> resources,
      MetricRegistry metricRegistry) {
    this.engine = engine;
    this.resources = resources;
    this.metricRegistry = metricRegistry;
    this.graphQlRequestTimeoutMs = config.getGraphQlRequestTimeoutMs();

    resourceTransformers.add(GraphQlResource.jsonTransformer);
    resourceTransformers.add(new ResourceTransformer("xml", MediaType.APPLICATION_XML) {
      final JsonToXmlTransformer jsonToXmlTransformer = new JsonToXmlTransformer();

      @Override
      public ResponseBuilder apply(final Map<String, Object> json) {
        return Response.ok(jsonToXmlTransformer.apply(json), this.mediaType);
      }
    });

    resourceTransformers.add(new ResourceTransformer("xlsx", MEDIATYPE_XLSX) {
      final JsonToXlsxTransformer xlsxTransformer = new JsonToXlsxTransformer(config);

      @Override
      public ResponseBuilder apply(final Map<String, Object> json) {
        return Response.ok(xlsxTransformer.apply(json), this.mediaType)
            .header("Content-Disposition", "attachment; filename=anet_export.xslx");
      }
    });

    resourceTransformers.add(new ResourceTransformer("nvg", MediaType.APPLICATION_XML) {
      final JsonToXmlTransformer jsonToXmlTransformer = new JsonToXmlTransformer();
      final XsltXmlTransformer xsltXmlTransformer = new XsltXmlTransformer(
          GraphQlResource.class.getResourceAsStream("/stylesheets/nvg.xslt"));

      @Override
      public ResponseBuilder apply(final Map<String, Object> json) {
        return Response.ok(xsltXmlTransformer.apply(jsonToXmlTransformer.apply(json)),
            this.mediaType);
      }
    });

    resourceTransformers.add(new ResourceTransformer("kml", MediaType.APPLICATION_XML) {
      final JsonToXmlTransformer jsonToXmlTransformer = new JsonToXmlTransformer();
      final XsltXmlTransformer xsltXmlTransformer = new XsltXmlTransformer(
          GraphQlResource.class.getResourceAsStream("/stylesheets/kml.xslt"));

      @Override
      public ResponseBuilder apply(final Map<String, Object> json) {
        return Response.ok(xsltXmlTransformer.apply(jsonToXmlTransformer.apply(json)),
            this.mediaType);
      }
    });

    buildGraph();
  }

  /**
   * Constructs the GraphQL "Graph" of ANET. 1) Scans all Resources to find methods it can use as
   * graph entry points. These should all be annotated with @GraphQLFetcher 2) For each of the types
   * that the Resource can return, scans those to find methods annotated with GraphQLFetcher
   */
  private void buildGraph() {
    final String topPackage = "mil.dds.anet";
    final GraphQLSchemaGenerator schemaGenerator = new GraphQLSchemaGenerator()
        // Load only our own packages:
        .withBasePackages(topPackage)
        // Resolve queries by @GraphQLQuery annotations only:
        .withNestedResolverBuilders(new AnnotatedResolverBuilder())
        // Resolve inputs by @GraphQLInputField annotations only:
        .withInclusionStrategy(new DefaultInclusionStrategy(topPackage) {
          @Override
          public boolean includeInputField(InputFieldInclusionParams params) {
            return super.includeInputField(params)
                && params.getElements().stream().anyMatch(this::isAnnotated);
          }

          protected boolean isAnnotated(AnnotatedElement element) {
            return element.isAnnotationPresent(GraphQLInputField.class);
          }
        })
        // Load our DateTimeMapper:
        .withTypeMappers(
            (config, defaults) -> defaults.insertBefore(ScalarMapper.class, new DateTimeMapper()))
        // Intercept calls to check whether user is authorized
        .withResolverInterceptors(new AuthorizationInterceptor());
    for (final Object resource : resources) {
      schemaGenerator.withOperationsFromSingleton(resource);
    }
    graphqlSchema = schemaGenerator.generate();

    graphqlSchemaWithoutIntrospection =
        GraphQLSchema.newSchema(graphqlSchema)
            .codeRegistry(graphqlSchema.getCodeRegistry()
                .transform(builder -> builder.fieldVisibility(
                    NoIntrospectionGraphqlFieldVisibility.NO_INTROSPECTION_FIELD_VISIBILITY)))
            .build();
  }

  @POST
  @Timed
  @Produces({MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MEDIATYPE_XLSX})
  public Response graphqlPost(@Auth Person user, Map<String, Object> body) {
    if (body == null) {
      // Empty body, possibly after re-authentication; user will have to try again
      return Response.status(Status.BAD_REQUEST.getStatusCode(),
          "Request failed, please try again or refresh your browser window").build();
    }

    final String operationName = (String) body.get("operationName");
    final String query = (String) body.get("query");

    @SuppressWarnings("unchecked")
    Map<String, Object> variables = (Map<String, Object>) body.get("variables");
    if (variables == null) {
      variables = new HashMap<String, Object>();
    }

    final String output = (String) body.get("output"); // Non-GraphQL

    return graphql(user, operationName, query, variables, output);
  }

  @GET
  @Timed
  @Produces({MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MEDIATYPE_XLSX})
  public Response graphqlGet(@Auth Person user, @QueryParam("operationName") String operationName,
      @QueryParam("query") String query, @QueryParam("output") String output) {
    return graphql(user, operationName, query, new HashMap<String, Object>(), output);
  }

  @InTransaction
  protected Response graphql(@Auth Person user, String operationName, String query,
      Map<String, Object> variables, String output) {
    final ExecutionResult executionResult = dispatchRequest(user, operationName, query, variables);
    final Map<String, Object> result = executionResult.toSpecification();
    if (!executionResult.getErrors().isEmpty()) {
      Status status = Status.INTERNAL_SERVER_ERROR;
      for (final GraphQLError error : executionResult.getErrors()) {
        if (error instanceof ExceptionWhileDataFetching exception) {
          if (exception.getException() instanceof WebApplicationException actual) {
            status = Status.fromStatusCode(actual.getResponse().getStatus());
            break;
          } else if (exception.getException() instanceof ConnectionException) {
            status = Status.SERVICE_UNAVAILABLE;
            break;
          }
        }
      }

      logger.warn("Errors: {}", executionResult.getErrors());
      // Remove any data so this gets properly handled as an error
      result.remove("data");
      return Response.status(status).entity(result).build();
    }

    ResourceTransformer transformer = StringUtils.isEmpty(output) ? GraphQlResource.jsonTransformer
        : resourceTransformers.stream().filter(t -> t.outputType.equals(output)).findFirst().get();
    return transformer.apply(result).build();
  }

  static class CustomDataFetcherExceptionHandler extends SimpleDataFetcherExceptionHandler {
    @Override
    protected void logException(ExceptionWhileDataFetching error, Throwable exception) {
      // Don't log ConnectionException as it may cause excessive logging; in any case it is already
      // shown above in the warn message
      if (!(exception instanceof ConnectionException)) {
        super.logException(error, exception);
      }
    }
  }

  private ExecutionResult dispatchRequest(Person user, String operationName, String query,
      Map<String, Object> variables) {
    final BatchingUtils batchingUtils = new BatchingUtils(engine, true, true);
    final DataLoaderRegistry dataLoaderRegistry = batchingUtils.getDataLoaderRegistry();
    final Map<String, Object> context = new HashMap<>();
    context.put("user", user);
    context.put("dataLoaderRegistry", dataLoaderRegistry);
    final ExecutionInput executionInput =
        ExecutionInput.newExecutionInput().operationName(operationName).query(query)
            .variables(variables).dataLoaderRegistry(dataLoaderRegistry).context(context).build();

    final GraphQL graphql = GraphQL
        .newGraphQL(AuthUtils.isAdmin(user) ? graphqlSchema : graphqlSchemaWithoutIntrospection)
        // custom error handler to reduce logging
        .defaultDataFetcherExceptionHandler(new CustomDataFetcherExceptionHandler())
        // Prevent adding .instrumentation(new DataLoaderDispatcherInstrumentation())
        // — use our own dispatcher instead
        .doNotAddDefaultInstrumentations().build();
    final Instant executionEnd = (graphQlRequestTimeoutMs == null) ? null
        : Instant.now().plusMillis(graphQlRequestTimeoutMs);
    final CompletableFuture<ExecutionResult> request = graphql.executeAsync(executionInput);
    final Runnable dispatcher = () -> {
      while (!request.isDone()) {
        if (executionEnd != null && Instant.now().isAfter(executionEnd)) {
          request.completeExceptionally(new TimeoutException("GraphQL request took too long"));
        } else {
          // Wait a while, giving other threads the chance to do some work
          try {
            Thread.yield();
            Thread.sleep(50);
          } catch (InterruptedException ignored) {
            // just retry
          }

          // Dispatch all our data loaders until the request is done;
          // we have data loaders at various depths (one dependent on another),
          // e.g. in {@link Report#loadWorkflow}
          final CompletableFuture<?>[] dispatchersWithWork = dataLoaderRegistry.getDataLoaders()
              .stream().filter(dl -> dl.dispatchDepth() > 0)
              .map(dl -> (CompletableFuture<?>) dl.dispatch()).toArray(CompletableFuture<?>[]::new);
          if (dispatchersWithWork.length > 0) {
            CompletableFuture.allOf(dispatchersWithWork).join();
          }
        }
      }
    };
    dispatcher.run();
    try {
      return request.get();
    } catch (InterruptedException | ExecutionException e) {
      if (e.getCause() != null && e.getCause() instanceof TimeoutException) {
        throw new WebApplicationException("graphql request took too long", e);
      } else {
        throw new WebApplicationException("failed to complete graphql request", e);
      }
    } finally {
      batchingUtils.updateStats(metricRegistry, dataLoaderRegistry);
      batchingUtils.shutdown();
    }
  }

}
