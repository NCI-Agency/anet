package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import io.dropwizard.auth.Auth;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.config.AnetConfiguration;
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
  public IndexView reactIndex(@Auth Person p) {
    IndexView view = new IndexView("/views/index.ftl");
    view.setCurrentUser(p);

    view.setSecurityBannerText(engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
    view.setSecurityBannerColor(engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
    view.setDictionary(config.getDictionary());

    return view;
  }

}
