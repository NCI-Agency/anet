package mil.dds.anet.config;

import jakarta.servlet.http.HttpServletMapping;
import mil.dds.anet.resources.AdminResource;
import mil.dds.anet.resources.HomeResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.RegisterSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.session.HttpSessionEventPublisher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
  String jwkSetUri;

  @Value("${graphql.spqr.http.endpoint}")
  String unusedGraphQLEndpoint;

  @Value("${anet.redirect-to-https}")
  boolean redirectToHttps;

  /**
   * SOAP endpoints (stateless) filter chain used by NVG Endpoint
   */
  @Bean
  @Order(10) // SecurityFilterChain filter sequence
  public SecurityFilterChain soapSecurityFilterChain(HttpSecurity http) throws Exception {
    http.securityMatcher(req -> {
      // Only applies to request routed to the Apache CXF Servlet, handling SOAP Web Services
      HttpServletMapping httpServletMapping = req.getHttpServletMapping();
      return httpServletMapping != null
          && "cxfServletRegistration".equals(httpServletMapping.getServletName());
    }).authorizeHttpRequests(authorize ->
    // Allow all SOAP service requests
    authorize.anyRequest().permitAll());

    // Stateless for SOAP, disable session management
    http.sessionManagement(
        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    // Disable CSRF
    http.csrf(AbstractHttpConfigurer::disable);

    return http.build();
  }

  @Bean
  @Order(20)
  public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(authorize -> authorize
        // These are public
        .requestMatchers(AdminResource.ADMIN_DICTIONARY_RESOURCE_PATH, HomeResource.LOGOUT_PATH,
            AssetConfig.ASSETS_PATH, AssetConfig.IMAGERY_PATH)
        .permitAll()
        // Block the default GraphQL endpoint
        .requestMatchers(unusedGraphQLEndpoint).denyAll()
        // The rest requires authentication
        .anyRequest().authenticated()) // -
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
        .oauth2Login(Customizer.withDefaults());
    if (redirectToHttps) {
      http.requiresChannel(channel -> channel.anyRequest().requiresSecure());
    }
    return http.build();
  }

  @Bean
  JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder.withJwkSetUri(this.jwkSetUri).build();
  }

  @Bean
  public SessionRegistry sessionRegistry() {
    return new SessionRegistryImpl();
  }

  @Bean
  protected SessionAuthenticationStrategy sessionAuthenticationStrategy() {
    return new RegisterSessionAuthenticationStrategy(sessionRegistry());
  }

  @Bean
  public HttpSessionEventPublisher httpSessionEventPublisher() {
    return new HttpSessionEventPublisher();
  }

}
