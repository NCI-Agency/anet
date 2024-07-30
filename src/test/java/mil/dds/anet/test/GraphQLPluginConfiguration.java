package mil.dds.anet.test;

import java.util.Map;
import mil.dds.anet.utils.Utils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Override the default Spring beans 'graphqlEndpoint' and 'webClient' as configured by
 * {@link mil.dds.anet.test.client.spring_autoconfiguration.GraphQLPluginAutoConfiguration}, with
 * specific settings for our GraphQL schema, and also initialize some other useful Spring beans.
 */
@Configuration
public class GraphQLPluginConfiguration {

  @Value("${server.port}")
  private int port;

  @Value("${spring.security.oauth2.client.provider.keycloak.issuer-uri}")
  private String issuerUri;

  public static class AuthenticationInjector {

    private final WebClient keycloakWebClient;

    private String username;
    private String password;

    public AuthenticationInjector(WebClient keycloakWebClient) {
      this.keycloakWebClient = keycloakWebClient;
    }

    public void setCredentials(final String usernameAndPassword) {
      setCredentials(usernameAndPassword, usernameAndPassword);
    }

    public void setCredentials(final String username, final String password) {
      this.username = username;
      this.password = password;
    }

    protected void setBearerToken(final HttpHeaders headers) {
      if (!Utils.isEmptyOrNull(username)) {
        // Get Bearer token from Keycloak
        final Map<String, String> response =
            keycloakWebClient.post().bodyValue(getFormData()).retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {}).block();
        headers.setBearerAuth(response.get("access_token"));
      }
    }

    private MultiValueMap<String, String> getFormData() {
      final MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
      formData.add("client_id", "ANET-Client-public");
      formData.add("username", username);
      formData.add("password", password);
      formData.add("grant_type", "password");
      return formData;
    }
  }

  @Bean
  AuthenticationInjector authenticationInjector(
      @Qualifier("keycloakWebClient") WebClient keycloakWebClient) {
    return new AuthenticationInjector(keycloakWebClient);
  }

  @Primary
  @Bean
  String graphqlEndpoint() {
    return String.format("http://localhost:%1$d/graphql", port);
  }

  @Primary
  @Bean
  WebClient webClient(String graphqlEndpoint, AuthenticationInjector authenticationInjector) {
    return WebClient.builder().baseUrl(graphqlEndpoint)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .defaultUriVariables(Map.of("url", graphqlEndpoint))
        .exchangeStrategies(ExchangeStrategies.builder()
            // Some GraphQL responses are larger than the allowed default of 256KB
            // (e.g. the one for introspection used in one of the tests)
            // Override this to allow unlimited responses:
            .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(-1)).build())
        .filter((request, next) -> next.exchange(
            ClientRequest.from(request).headers(authenticationInjector::setBearerToken).build()))
        .build();
  }

  @Bean
  WebClient keycloakWebClient() {
    return WebClient.builder().baseUrl(String.format("%s/protocol/openid-connect/token", issuerUri))
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
        .build();
  }

}
