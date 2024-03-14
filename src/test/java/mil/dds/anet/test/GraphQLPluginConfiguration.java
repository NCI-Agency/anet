package mil.dds.anet.test;

import io.dropwizard.client.JerseyClientBuilder;
import io.dropwizard.client.JerseyClientConfiguration;
import io.dropwizard.testing.ConfigOverride;
import io.dropwizard.testing.junit5.DropwizardAppExtension;
import io.dropwizard.util.Duration;
import jakarta.ws.rs.client.Client;
import java.util.Map;
import mil.dds.anet.AnetApplication;
import mil.dds.anet.config.AnetConfiguration;
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
 * Override the default Spring beans 'graphqlEndpoint' and 'webClient' as configured by
 * {@link mil.dds.anet.test.client.spring_autoconfiguration.GraphQLPluginAutoConfiguration}, with
 * specific settings for our GraphQL schema, and also initialize some other useful Spring beans.
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

  @Bean
  DropwizardAppExtension<AnetConfiguration> dropwizardApp() throws Exception {
    final DropwizardAppExtension<AnetConfiguration> app = new DropwizardAppExtension<>(
        AnetApplication.class, "anet.yml", ConfigOverride.config("testMode", "true"));
    app.before();
    return app;
  }

  @Bean
  Client testClient(DropwizardAppExtension<?> app) {
    final JerseyClientConfiguration config = new JerseyClientConfiguration();
    config.setTimeout(Duration.seconds(60L));
    config.setConnectionTimeout(Duration.seconds(30L));
    config.setConnectionRequestTimeout(Duration.seconds(30L));
    return new JerseyClientBuilder(app.getEnvironment()).using(config).build("test client");
  }

  @Primary
  @Bean
  String graphqlEndpoint(DropwizardAppExtension<?> dropwizardApp) {
    return String.format("http://localhost:%1$d/graphql", dropwizardApp.getLocalPort());
  }

  @Primary
  @Bean
  WebClient webClient(String graphqlEndpoint, AuthenticationInjector authenticationInjector) {
    return WebClient.builder().baseUrl(graphqlEndpoint)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .defaultUriVariables(Map.of("url", graphqlEndpoint))
        .filter((request, next) -> next.exchange(
            ClientRequest.from(request).headers(authenticationInjector::setBasicAuth).build()))
        .build();
  }
}
