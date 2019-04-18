package mil.dds.anet.test.resources.utils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.Invocation.Builder;
import javax.ws.rs.core.MediaType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.mappers.MapperUtils;

public class GraphQlClient {

  private final Client client;
  private final int localPort;

  public GraphQlClient(Client client, int localPort) {
    this.client = client;
    this.localPort = localPort;
  }

  public <T> T doGraphQlQuery(Person user, String query, String paramName, Object param,
      TypeReference<GraphQlResponse<T>> responseType) {
    final Map<String, Object> variables = new HashMap<String, Object>();
    if (paramName != null) {
      variables.put(paramName, param);
    }
    return doGraphQlQuery(user, query, variables, responseType);
  }

  public <T> T doGraphQlQuery(Person user, String query, Map<String, Object> variables,
      TypeReference<GraphQlResponse<T>> responseType) {
    final Map<String, Object> graphQlQuery = new HashMap<String, Object>();
    graphQlQuery.put("query", query);
    graphQlQuery.put("variables", variables);
    try {
      final ObjectMapper mapper = MapperUtils.getDefaultMapper();
      final String jsonString = mapper.writeValueAsString(graphQlQuery);
      final Entity<String> jsonEntity = Entity.entity(jsonString, MediaType.APPLICATION_JSON_TYPE);
      final String response = httpQuery("/graphql", user).post(jsonEntity, String.class);
      assertThat(response).isNotNull();
      final GraphQlResponse<T> data = mapper.readValue(response, responseType);
      assertThat(data).isNotNull();
      return data.getData().getPayload();
    } catch (IOException e) {
      fail("conversion to JSON failed");
      return null;
    }
  }

  private Builder httpQuery(String path, Person authUser) {
    try {
      final String authString =
          Base64.getEncoder().encodeToString((authUser.getDomainUsername() + ":").getBytes());
      final URI uri = new URI("http", null, "localhost", localPort, path, null, null);
      return client.target(uri).request().header("Authorization", "Basic " + authString)
          .header("Accept", MediaType.APPLICATION_JSON_TYPE.toString());
    } catch (URISyntaxException e) {
      return null;
    }
  }

}
