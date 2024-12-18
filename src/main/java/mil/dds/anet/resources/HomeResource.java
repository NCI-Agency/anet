package mil.dds.anet.resources;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.utils.SecurityUtils;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

@Controller
public class HomeResource {

  public static final String LOGOUT_PATH = "/api/logout";
  public static final String LOGOUT_PAGE = "/assets/client/logout.html";

  @Value("${spring.security.oauth2.client.provider.keycloak.issuer-uri}")
  private String issuerUri;

  @Value("${spring.security.oauth2.client.registration.keycloak.client-id}")
  private String clientId;

  @Value("${anet.keycloak-configuration.resource}")
  private String publicClientId;

  private final AnetConfig config;
  private final AnetDictionary dict;
  private final AdminDao adminDao;

  public HomeResource(AnetConfig config, AnetDictionary dict, AdminDao adminDao) {
    this.config = config;
    this.dict = dict;
    this.adminDao = adminDao;
  }

  /**
   * This is the only Resource method that is ever directly called by a user. All other calls are
   * made via AJAX Requests. This method returns the index page that bootstraps up the JS bundle and
   * all other assets and starts the React engine. Note: This is only used in Production Mode. In
   * Development the node server handles serving the initial bundle.
   */
  @GetMapping(path = "/**", produces = MediaType.TEXT_HTML_VALUE)
  public String index(final Principal principal, Model model) throws JsonProcessingException {
    model.addAttribute("currentUser", SecurityUtils.getPersonFromPrincipal(principal));
    model.addAttribute("projectVersion", config.getVersion());
    // TODO: should try to pass the dictionary to the client as literal JSON instead of serializing
    // it to a string
    final ObjectMapper jsonMapper = new ObjectMapper();
    final String serializedDictionary =
        StringEscapeUtils.escapeEcmaScript(jsonMapper.writeValueAsString(dict.getDictionary()));
    model.addAttribute("serializedDictionary", serializedDictionary);
    return "index";
  }

  private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

  @GetMapping(path = LOGOUT_PATH)
  public void logout(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException {
    this.logoutHandler.logout(request, response, authentication);
    // Log out of Keycloak
    final UriComponents requestUrl =
        UriComponentsBuilder.fromUriString(request.getRequestURL().toString()).build();
    final String redirectUri = URLEncoder.encode(getLogoutUrl(requestUrl), StandardCharsets.UTF_8);
    // Redirect to Keycloak to log out
    final String idParam = (authentication instanceof OidcUser) ? clientId : publicClientId;
    // scan:ignore — false positive, we only let Keycloak redirect back to the original request URI
    response.sendRedirect(
        String.format("%s/protocol/openid-connect/logout?post_logout_redirect_uri=%s&client_id=%s",
            issuerUri, redirectUri, idParam));
  }

  // Define these constants here
  private static final String HTTP_SCHEME = "http";
  private static final int HTTP_DEFAULT_PORT = 80;
  private static final String HTTPS_SCHEME = "https";
  private static final int HTTPS_DEFAULT_PORT = 443;

  private String getLogoutUrl(UriComponents requestUrl) {
    final String scheme = requestUrl.getScheme();
    final int port = requestUrl.getPort();
    final String host = requestUrl.getHost();
    return (port == -1 // no port in the request URL
        // or using the default port of the scheme
        || HTTP_SCHEME.equals(scheme) && HTTP_DEFAULT_PORT == port
        || HTTPS_SCHEME.equals(scheme) && HTTPS_DEFAULT_PORT == port)
            ? String.format("%s://%s%s", scheme, host, LOGOUT_PAGE)
            : String.format("%s://%s:%s%s", scheme, host, port, LOGOUT_PAGE);
  }

}
