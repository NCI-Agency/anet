package mil.dds.anet.resources;

import com.codahale.metrics.MetricRegistry;
import com.codahale.metrics.annotation.Timed;
import graphql.ExceptionWhileDataFetching;
import graphql.ExecutionInput;
import graphql.ExecutionResult;
import graphql.GraphQL;
import graphql.GraphQLError;
import graphql.schema.GraphQLSchema;
import io.dropwizard.auth.Auth;
import io.leangen.graphql.GraphQLSchemaGenerator;
import io.leangen.graphql.generator.mapping.common.ScalarMapper;
import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.function.Function;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.graphql.DateTimeMapper;
import mil.dds.anet.graphql.outputtransformers.JsonToXlsxTransformer;
import mil.dds.anet.graphql.outputtransformers.JsonToXmlTransformer;
import mil.dds.anet.graphql.outputtransformers.XsltXmlTransformer;
import mil.dds.anet.utils.BatchingUtils;
import org.apache.commons.lang3.StringUtils;
import org.dataloader.DataLoaderRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Path("/graphql")
public class GraphQlResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final String MEDIATYPE_XLSX =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  private final AnetObjectEngine engine;
  private final List<Object> resources;
  private final MetricRegistry metricRegistry;

  private GraphQLSchema graphqlSchema;
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

  public GraphQlResource(AnetObjectEngine engine, AnetConfiguration config, List<Object> resources,
      MetricRegistry metricRegistry) {
    this.engine = engine;
    this.resources = resources;
    this.metricRegistry = metricRegistry;

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
            .header("Content-Disposition", "attachment; filename=" + "anet_export.xslx");
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
    final GraphQLSchemaGenerator schemaBuilder =
        new GraphQLSchemaGenerator().withBasePackages("mil.dds.anet").withTypeMappers(
            (config, defaults) -> defaults.insertBefore(ScalarMapper.class, new DateTimeMapper()));
    for (final Object resource : resources) {
      schemaBuilder.withOperationsFromSingleton(resource);
    }

    graphqlSchema = schemaBuilder.generate();
  }

  @POST
  @Timed
  @Produces({MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML, MEDIATYPE_XLSX})
  public Response graphqlPost(@Auth Person user, Map<String, Object> body) {
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

  protected Response graphql(@Auth Person user, String operationName, String query,
      Map<String, Object> variables, String output) {
    final ExecutionResult executionResult = dispatchRequest(user, operationName, query, variables);
    final Map<String, Object> result = executionResult.toSpecification();
    if (executionResult.getErrors().size() > 0) {
      WebApplicationException actual = null;
      for (GraphQLError error : executionResult.getErrors()) {
        if (error instanceof ExceptionWhileDataFetching) {
          ExceptionWhileDataFetching exception = (ExceptionWhileDataFetching) error;
          if (exception.getException() instanceof WebApplicationException) {
            actual = (WebApplicationException) exception.getException();
            break;
          }
        }
      }

      Status status = (actual != null) ? Status.fromStatusCode(actual.getResponse().getStatus())
          : Status.INTERNAL_SERVER_ERROR;
      logger.warn("Errors: {}", executionResult.getErrors());
      return Response.status(status).entity(result).build();
    }

    ResourceTransformer transformer = StringUtils.isEmpty(output) ? GraphQlResource.jsonTransformer
        : resourceTransformers.stream().filter(t -> t.outputType.equals(output)).findFirst().get();
    return transformer.apply(result).build();
  }

  private ExecutionResult dispatchRequest(Person user, String operationName, String query,
      Map<String, Object> variables) {
    final DataLoaderRegistry dataLoaderRegistry =
        BatchingUtils.registerDataLoaders(engine, true, true);
    final Map<String, Object> context = new HashMap<>();
    context.put("user", user);
    context.put("dataLoaderRegistry", dataLoaderRegistry);
    final ExecutionInput executionInput =
        ExecutionInput.newExecutionInput().operationName(operationName).query(query)
            .variables(variables).dataLoaderRegistry(dataLoaderRegistry).context(context).build();

    final GraphQL graphql = GraphQL.newGraphQL(graphqlSchema)
        // .instrumentation(new DataLoaderDispatcherInstrumentation()) — use our own dispatcher
        // instead
        .build();
    final CompletableFuture<ExecutionResult> request = graphql.executeAsync(executionInput);
    final Runnable dispatcher = () -> {
      while (!request.isDone()) {
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
    };
    dispatcher.run();
    try {
      return request.get();
    } catch (InterruptedException | ExecutionException e) {
      throw new WebApplicationException("failed to complete graphql request", e);
    } finally {
      BatchingUtils.updateStats(metricRegistry, dataLoaderRegistry);
    }
  }

}
