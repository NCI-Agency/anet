package mil.dds.anet.test;

import java.util.Map;
import mil.dds.anet.utils.Utils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * This Spring {@link Configuration} class overrides the default Spring Bean 'webClient' for this
 * GraphQL schema.
 */
@Configuration
public class GraphQLPluginConfiguration {

  @Autowired
  ApplicationContext applicationContext;

  public static class AuthenticationInjector {
    private String username;
    private String password;

    public void setCredentials(final String usernameAndPassword) {
      setCredentials(usernameAndPassword, usernameAndPassword);
    }

    public void setCredentials(final String username, final String password) {
      this.username = username;
      this.password = password;
    }

    protected void setBasicAuth(final HttpHeaders headers) {
      if (!Utils.isEmptyOrNull(username)) {
        headers.setBasicAuth(username, password);
      }
    }
  }

  @Bean
  AuthenticationInjector authenticationInjector() {
    return new AuthenticationInjector();
  }

  @Primary
  @Bean
  public WebClient webClient(
      @SuppressWarnings("SpringJavaInjectionPointsAutowiringInspection") String graphqlEndpoint,
      AuthenticationInjector authenticationInjector) {
    return WebClient.builder().baseUrl(graphqlEndpoint)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .defaultUriVariables(Map.of("url", graphqlEndpoint))
        .filter((request, next) -> next.exchange(
            ClientRequest.from(request).headers(authenticationInjector::setBasicAuth).build()))
        .build();
  }
}
