package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.Invocation.Builder;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.MediaType;

import mil.dds.anet.beans.Person;

public class GraphQLClient {

	private final Client client;
	private int localPort;

	public GraphQLClient(Client client, int localPort) {
		this.client = client;
		this.localPort = localPort;
	}

	public <T> T doGraphQLQuery(Person user, String query, String paramName, Object param, GenericType<GraphQLResponse<T>> responseType) {
		final Map<String, Object> graphQLQuery = new HashMap<String,Object>();
		graphQLQuery.put("query", query);
		final Map<String,Object> variables = new HashMap<String,Object>();
		if (paramName != null) {
			variables.put(paramName, param);
		}
		graphQLQuery.put("variables", variables);
		final GraphQLResponse<T> response = httpQuery("graphql", user)
					.post(Entity.json(graphQLQuery), responseType);
		assertThat(response.getData()).isNotNull();
		return response.getData().getPayload();
	}

	private Builder httpQuery(String path, Person authUser) {
		final String authString = Base64.getEncoder()
				.encodeToString((authUser.getDomainUsername() + ":").getBytes());
		return client
				.target(String.format("http://localhost:%d/%s", localPort, path))
				.request()
				.header("Authorization", "Basic " + authString)
				.header("Accept", MediaType.APPLICATION_JSON_TYPE.toString());
	}

}
