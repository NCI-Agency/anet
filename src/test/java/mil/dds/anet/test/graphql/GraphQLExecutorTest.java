package mil.dds.anet.test.graphql;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import graphql.GraphQL;
import graphql.schema.idl.RuntimeWiring;
import graphql.schema.idl.SchemaGenerator;
import graphql.schema.idl.SchemaParser;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.WebExceptionMapper;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.beans.Location;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.IdBatcher;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.graphql.GraphQLExecutor;
import mil.dds.anet.resources.GraphQLResource;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.ws.security.AccessTokenPrincipal;
import org.dataloader.DataLoader;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class GraphQLExecutorTest {

  @ParameterizedTest
  @ValueSource(strings = {"", "555", "-1", "not-a-uuid", "1-1-1-1-1"})
  void invalidUuidFromBatchLoaderReturnsBadRequest(String uuid) throws Exception {
    final DatabaseHandler databaseHandler = mock(DatabaseHandler.class);
    final IdBatcher<Location> batcher = new IdBatcher<>(databaseHandler, "", "ids", null);
    final LocationDao dao = mock(LocationDao.class);
    when(dao.getByIds(List.of(uuid))).thenAnswer(invocation -> batcher.getByIds(List.of(uuid)));
    final AnetObjectEngine engine = mock(AnetObjectEngine.class);
    when(engine.getLocationDao()).thenReturn(dao);
    final AccessToken token = new AccessToken();
    token.setScope(AccessToken.TokenScope.GRAPHQL);
    final GraphQL graphQL = GraphQL.newGraphQL(new SchemaGenerator().makeExecutableSchema(
        new SchemaParser().parse("type Query { location(uuid: String!): String }"),
        RuntimeWiring.newRuntimeWiring().type("Query", type -> type.dataFetcher("location", env -> {
          final DataLoader<String, Location> loader =
              env.getDataLoader(IdDataLoaderKey.LOCATIONS.toString());
          return loader.load(env.getArgument("uuid"))
              .thenApply(location -> location == null ? null : location.getUuid());
        })).build())).build();
    final AnetConfig config = mock(AnetConfig.class);
    when(config.getGraphqlRequestTimeoutMs()).thenReturn(10000L);
    final GraphQLExecutor executor = new TestExecutor(config);
    final var mvc = MockMvcBuilders.standaloneSetup(new GraphQLResource(graphQL, executor))
        .setControllerAdvice(new WebExceptionMapper()).build();

    try (var context = mockStatic(ApplicationContextProvider.class)) {
      context.when(ApplicationContextProvider::getEngine).thenReturn(engine);
      mvc.perform(post("/graphql").principal(new AccessTokenPrincipal(token))
          .contentType(MediaType.APPLICATION_JSON).content("""
              {
                "query": "query($uuid: String!) { location(uuid: $uuid) }",
                "variables": { "uuid": "%s" }
              }
              """.formatted(uuid))).andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.errors[0].message").value("Invalid UUID"));
      verifyNoInteractions(databaseHandler);
    }
  }

  private static class TestExecutor extends GraphQLExecutor {
    TestExecutor(AnetConfig config) {
      super(config);
    }
  }
}
