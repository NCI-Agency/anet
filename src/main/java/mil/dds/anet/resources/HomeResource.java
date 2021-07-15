package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.dropwizard.auth.Auth;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriBuilder;
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
    view.setSecurityBannerText(engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
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
        URLEncoder.encode(getBaseRequestUrl(requestlUrl), StandardCharsets.UTF_8.toString());
    // Redirect to Keycloak to log out
    // scan:ignore — false positive, we only let Keycloak redirect back to the original request URI
    response.sendRedirect(String.format(
        "%s/realms/%s/protocol/openid-connect/logout?redirect_uri=%s",
        keycloakConfiguration.getAuthServerUrl(), keycloakConfiguration.getRealm(), redirectUri));
  }

  // Define these constants here
  private static final String HTTP_SCHEME = "http";
  private static final int HTTP_DEFAULT_PORT = 80;
  private static final String HTTPS_SCHEME = "https";
  private static final int HTTPS_DEFAULT_PORT = 443;

  private String getBaseRequestUrl(URI requestlUrl) {
    final String scheme = requestlUrl.getScheme();
    final int port = requestlUrl.getPort();
    final String host = requestlUrl.getHost();
    return (port == -1 // no port in the request URL
        // or using the default port of the scheme
        || HTTP_SCHEME.equals(scheme) && HTTP_DEFAULT_PORT == port
        || HTTPS_SCHEME.equals(scheme) && HTTPS_DEFAULT_PORT == port)
            ? String.format("%s://%s/", scheme, host)
            : String.format("%s://%s:%s/", scheme, host, port);
  }

}
