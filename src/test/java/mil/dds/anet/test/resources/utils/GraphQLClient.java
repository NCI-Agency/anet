package mil.dds.anet.test.resources.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.URISyntaxException;
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
	private final int localPort;

	public GraphQLClient(Client client, int localPort) {
		this.client = client;
		this.localPort = localPort;
	}

	public <T> T doGraphQLQuery(Person user, String query, String paramName, Object param, GenericType<GraphQLResponse<T>> responseType) {
		final Map<String,Object> variables = new HashMap<String,Object>();
		if (paramName != null) {
			variables.put(paramName, param);
		}
		return doGraphQLQuery(user, query, variables, responseType);
	}

	public <T> T doGraphQLQuery(Person user, String query, Map<String,Object> variables, GenericType<GraphQLResponse<T>> responseType) {
		final Map<String, Object> graphQLQuery = new HashMap<String,Object>();
		graphQLQuery.put("query", query);
		graphQLQuery.put("variables", variables);
		final GraphQLResponse<T> response = httpQuery("/graphql", user)
					.post(Entity.json(graphQLQuery), responseType);
		assertThat(response.getData()).isNotNull();
		return response.getData().getPayload();
	}

	private Builder httpQuery(String path, Person authUser) {
		try {
			final String authString = Base64.getEncoder()
					.encodeToString((authUser.getDomainUsername() + ":").getBytes());
			final URI uri = new URI("http", null, "localhost", localPort, path, null, null);
			return client
					.target(uri)
					.request()
					.header("Authorization", "Basic " + authString)
					.header("Accept", MediaType.APPLICATION_JSON_TYPE.toString());
		} catch (URISyntaxException e) {
			return null;
		}
	}

}
