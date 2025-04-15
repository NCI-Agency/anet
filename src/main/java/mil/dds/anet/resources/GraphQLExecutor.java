package mil.dds.anet.resources;

import graphql.ExceptionWhileDataFetching;
import graphql.ExecutionInput;
import graphql.ExecutionResult;
import graphql.GraphQL;
import graphql.GraphQLError;
import graphql.introspection.Introspection;
import io.leangen.graphql.spqr.spring.autoconfigure.ContextFactory;
import io.leangen.graphql.spqr.spring.web.HttpExecutor;
import io.leangen.graphql.spqr.spring.web.dto.ExecutorParams;
import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import java.lang.invoke.MethodHandles;
import java.security.Principal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;
import mil.dds.anet.beans.AccessToken.TokenScope;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.BatchingUtils;
import mil.dds.anet.utils.SecurityUtils;
import mil.dds.anet.ws.AccessTokenPrincipal;
import org.dataloader.DataLoaderRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.server.ResponseStatusException;

@Component
public class GraphQLExecutor extends HttpExecutor<NativeWebRequest> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AnetConfig config;

  protected GraphQLExecutor(ContextFactory<NativeWebRequest> contextFactory, AnetConfig config) {
    super(contextFactory, null);
    this.config = config;
  }

  @Transactional
  public Map<String, Object> execute(final Principal principal, final GraphQL graphQL,
      final ExecutorParams<NativeWebRequest> params) {
    final Long graphqlRequestTimeoutMs = config.getGraphqlRequestTimeoutMs();
    final ExecutionResult executionResult =
        dispatchRequest(principal, graphQL, params, graphqlRequestTimeoutMs);
    final Map<String, Object> result = executionResult.toSpecification();
    if (executionResult.getErrors().isEmpty()) {
      return result;
    }

    for (final GraphQLError error : executionResult.getErrors()) {
      if (error instanceof ExceptionWhileDataFetching exception) {
        final Throwable cause = exception.getException();
        if (cause instanceof ResponseStatusException actual) {
          throw actual;
        } else if (cause instanceof CannotGetJdbcConnectionException
            || cause instanceof CannotCreateTransactionException) {
          throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
              String.format("Problem when getting connection: %s", cause.getMessage()));
        }
      }
    }

    logger.warn("Errors: {}", executionResult.getErrors());
    // Remove any data so this gets properly handled as an error
    result.remove("data");
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, executionResult.toString());
  }

  private ExecutionInput buildInput(GraphQLRequest graphQLRequest,
      DataLoaderRegistry dataLoaderRegistry, final Map<String, Object> context) {
    return ExecutionInput.newExecutionInput().operationName(graphQLRequest.getOperationName())
        .query(graphQLRequest.getQuery()).variables(graphQLRequest.getVariables())
        .dataLoaderRegistry(dataLoaderRegistry).graphQLContext(context).build();
  }

  private ExecutionResult dispatchRequest(final Principal principal, final GraphQL graphQL,
      final ExecutorParams<NativeWebRequest> params, final Long graphqlRequestTimeoutMs) {
    final BatchingUtils batchingUtils =
        new BatchingUtils(ApplicationContextProvider.getEngine(), true, true);
    final DataLoaderRegistry dataLoaderRegistry = batchingUtils.getDataLoaderRegistry();
    final Map<String, Object> context = new HashMap<>();
    // Is this an AccessTokenPrincipal?
    if (principal instanceof AccessTokenPrincipal accessTokenPrincipal) {
      context.put("accessToken", accessTokenPrincipal.accessToken());
      context.put(Introspection.INTROSPECTION_DISABLED,
          // GraphQL web service is allowed to do introspection
          !TokenScope.GRAPHQL.equals(accessTokenPrincipal.accessToken().getScope()));
    } else {
      final Person user = SecurityUtils.getPersonFromPrincipal(principal);
      context.put("user", Objects.requireNonNullElse(user, new Person()));
      context.put(Introspection.INTROSPECTION_DISABLED, !AuthUtils.isAdmin(user));
    }

    context.put("dataLoaderRegistry", dataLoaderRegistry);

    final ExecutionInput executionInput =
        buildInput(params.graphQLRequest, dataLoaderRegistry, context);

    final Instant executionEnd = (graphqlRequestTimeoutMs == null) ? null
        : Instant.now().plusMillis(graphqlRequestTimeoutMs);
    final CompletableFuture<ExecutionResult> request = graphQL.executeAsync(executionInput);
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
      if (e.getCause() instanceof TimeoutException) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
            "graphql request took too long", e);
      } else {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
            "failed to complete graphql request", e);
      }
    } finally {
      batchingUtils.shutdown();
    }
  }

}
