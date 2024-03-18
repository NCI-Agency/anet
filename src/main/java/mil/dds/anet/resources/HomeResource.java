package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.dropwizard.auth.Auth;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.UriBuilder;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetKeycloakConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.views.IndexView;

@Path("")
public class HomeResource {

  private final AnetConfiguration config;
  private final AnetObjectEngine engine;

  public HomeResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.engine = engine;
    this.config = config;
  }

  /**
   * This is the only Resource method that is ever directly called by a user. All other calls are
   * made via AJAX Requests. This method returns the index page that bootstraps up the JS bundle and
   * all other assets and starts the React engine. Note: This is only used in Production Mode. In
   * Development the node server handles serving the initial bundle.
   */
  @GET
  @Timed
  @Path("{path: .*}")
  @Produces(MediaType.TEXT_HTML)
  public IndexView reactIndex(@Auth Person user) {
    IndexView view = new IndexView("/views/index.ftl");
    view.setCurrentUser(user);
    view.setSecurityBannerClassification(
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_CLASSIFICATION));
    view.setSecurityBannerReleasability(
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_RELEASABILITY));
    view.setSecurityBannerColor(engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
    view.setDictionary(config.getDictionary());
    view.setProjectVersion(config.getVersion());
    return view;
  }

  @GET
  @Timed
  @Path("/api/logout")
  public void logout(@Context HttpServletRequest request, @Context HttpServletResponse response)
      throws IOException, ServletException {
    // Terminate the session
    final HttpSession session = request.getSession(false);
    if (session != null) {
      session.invalidate();
    }
    request.logout(); // For completeness' sake

    // Log out of Keycloak
    final AnetKeycloakConfiguration keycloakConfiguration = config.getKeycloakConfiguration();
    final URI requestlUrl = UriBuilder.fromUri(request.getRequestURL().toString()).build();
    final String redirectUri =
        URLEncoder.encode(getLogoutUrl(requestlUrl), StandardCharsets.UTF_8.toString());
    // Redirect to Keycloak to log out
    // scan:ignore — false positive, we only let Keycloak redirect back to the original request URI
    response.sendRedirect(String.format(
        "%s/realms/%s/protocol/openid-connect/logout?post_logout_redirect_uri=%s&client_id=%s",
        keycloakConfiguration.getAuthServerUrl(), keycloakConfiguration.getRealm(), redirectUri,
        keycloakConfiguration.getResource()));
  }

  // Define these constants here
  private static final String HTTP_SCHEME = "http";
  private static final int HTTP_DEFAULT_PORT = 80;
  private static final String HTTPS_SCHEME = "https";
  private static final int HTTPS_DEFAULT_PORT = 443;

  private String getLogoutUrl(URI requestUrl) {
    final String scheme = requestUrl.getScheme();
    final int port = requestUrl.getPort();
    final String host = requestUrl.getHost();
    final String logoutPage = "/assets/client/logout.html";
    return (port == -1 // no port in the request URL
        // or using the default port of the scheme
        || HTTP_SCHEME.equals(scheme) && HTTP_DEFAULT_PORT == port
        || HTTPS_SCHEME.equals(scheme) && HTTPS_DEFAULT_PORT == port)
            ? String.format("%s://%s%s", scheme, host, logoutPage)
            : String.format("%s://%s:%s%s", scheme, host, port, logoutPage);
  }

}
