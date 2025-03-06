package mil.dds.anet.config;

import static mil.dds.anet.config.ContentSecurityPolicy.CSP_NONE;
import static mil.dds.anet.config.ContentSecurityPolicy.CSP_SELF;
import static mil.dds.anet.config.ContentSecurityPolicy.CspDirective;
import static org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER;
import static org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN;

import jakarta.servlet.http.HttpServletMapping;
import java.util.List;
import java.util.Map;
import mil.dds.anet.resources.AdminResource;
import mil.dds.anet.resources.HomeResource;
import mil.dds.anet.utils.ResponseUtils;
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

  private final AnetConfig anetConfig;
  private final AnetDictionary anetDictionary;

  private final ContentSecurityPolicy soapCsp = ContentSecurityPolicy.of(
      // default: block everything
      CspDirective.of("default-src", CSP_NONE),
      // we get data from our own server
      CspDirective.of("connect-src", CSP_SELF));

  private final ContentSecurityPolicy defaultCsp = ContentSecurityPolicy.of(
      // default: block everything
      CspDirective.of("default-src", CSP_NONE),
      // no base uri's
      CspDirective.of("base-uri", CSP_NONE),
      // no frame ancestors
      CspDirective.of("frame-ancestors", CSP_NONE),
      // we have HTML forms
      CspDirective.of("form-action", CSP_SELF),
      // we supply JavaScript
      CspDirective.of("script-src", CSP_SELF),
      // we supply stylesheets, and have inline styles
      CspDirective.of("style-src", CSP_SELF, "'unsafe-inline'"),
      // we supply fonts, and load fonts through a data: URL
      CspDirective.of("font-src", CSP_SELF, "data:"),
      // we get data from our own server, the authentication server, and from a geoSearcher
      CspDirective.of("connect-src", CSP_SELF, "%1$s", "%2$s"),
      // the authentication server opens an iframe for refreshing the token
      CspDirective.of("frame-src", "%1$s"),
      // we supply images, load images through a data: URL, and get images from the map baseLayers
      CspDirective.of("img-src", CSP_SELF, "data:", "%3$s"));

  public SecurityConfig(AnetConfig anetConfig, AnetDictionary anetDictionary) {
    this.anetConfig = anetConfig;
    this.anetDictionary = anetDictionary;
  }

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
    // Configure CSP
    http.headers(
        headers -> headers.contentSecurityPolicy(csp -> csp.policyDirectives(soapCsp.toString())));
    // Configure Referrer Policy
    http.headers(header -> header.referrerPolicy(rp -> rp.policy(NO_REFERRER)));

    return http.build();
  }

  @Bean
  @Order(20)
  public SecurityFilterChain graphQLWebServicveFilterChain(HttpSecurity http) throws Exception {
    http.securityMatcher("/graphqlWebService/**") // Apply only to GraphQL endpoints
        .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
        .csrf(AbstractHttpConfigurer::disable);
    return http.build();
  }

  @Bean
  @Order(30)
  public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(authorize -> authorize
        // These are public
        .requestMatchers(AdminResource.ADMIN_DICTIONARY_RESOURCE_PATH, HomeResource.LOGOUT_PATH,
            AssetConfig.ASSETS_PATH, AssetConfig.IMAGERY_PATH, AssetConfig.GRAPHQL_WEB_SERVICE)
        .permitAll()
        // Block the default GraphQL endpoint
        .requestMatchers(unusedGraphQLEndpoint).denyAll()
        // The rest requires authentication
        .anyRequest().authenticated()) // -
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
        .oauth2Login(Customizer.withDefaults());
    if (anetConfig.getRedirectToHttps()) {
      http.requiresChannel(channel -> channel.anyRequest().requiresSecure());
    }
    // Configure CSP
    http.headers(headers -> headers
        .contentSecurityPolicy(csp -> csp.policyDirectives(String.format(defaultCsp.toString(),
            getAuthServerUrl(), getGeoSearcherUrl(), getBaseLayersUrls()))));
    // Configure Referrer Policy
    http.headers(header -> header.referrerPolicy(rp -> rp.policy(SAME_ORIGIN)));
    return http.build();
  }

  private String getAuthServerUrl() {
    return ResponseUtils.getBaseUrl(anetConfig.getKeycloakConfiguration().getAuthServerUrl());
  }

  private String getGeoSearcherUrl() {
    final String geoSearcherUrl =
        (String) anetDictionary.getDictionaryEntry("imagery.geoSearcher.url");
    return ResponseUtils.getBaseUrl(geoSearcherUrl);
  }

  private String getBaseLayersUrls() {
    @SuppressWarnings("unchecked")
    final List<Map<String, Object>> baseLayers =
        (List<Map<String, Object>>) anetDictionary.getDictionaryEntry("imagery.baseLayers");
    final List<String> baseLayersUrls = baseLayers.stream()
        .map(layer -> ResponseUtils.getBaseUrl((String) layer.get("url"))).toList();
    return String.join(" ", baseLayersUrls);
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
