package mil.dds.anet.resources;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import mil.dds.anet.utils.ResponseUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

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

  /**
   * This is the only Resource method that is ever directly called by a user. All other calls are
   * made via AJAX Requests. This method returns the index page that bootstraps up the JS bundle and
   * all other assets and starts the React engine. Note: This is only used in Production Mode. In
   * Development the node server handles serving the initial bundle.
   */
  @GetMapping(path = "/**", produces = MediaType.TEXT_HTML_VALUE)
  public String index() {
    return "index";
  }

  private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

  @GetMapping(path = LOGOUT_PATH)
  public void logout(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException {
    this.logoutHandler.logout(request, response, authentication);
    // Log out of Keycloak
    final String redirectUri =
        URLEncoder.encode(getLogoutUrl(request.getRequestURL().toString()), StandardCharsets.UTF_8);
    // Redirect to Keycloak to log out
    final String idParam = (authentication instanceof OidcUser) ? clientId : publicClientId;
    // scan:ignore — false positive, we only let Keycloak redirect back to the original request URI
    response.sendRedirect(
        String.format("%s/protocol/openid-connect/logout?post_logout_redirect_uri=%s&client_id=%s",
            issuerUri, redirectUri, idParam));
  }

  private String getLogoutUrl(String requestUrl) {
    return String.format("%s%s", ResponseUtils.getBaseUrl(requestUrl), LOGOUT_PAGE);
  }

}
