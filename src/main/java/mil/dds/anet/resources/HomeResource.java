package mil.dds.anet.resources;

import javax.annotation.security.PermitAll;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import io.dropwizard.auth.Auth;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.views.IndexView;

@Path("")
@PermitAll
public class HomeResource {

	AnetObjectEngine engine;
	
	public HomeResource(AnetObjectEngine engine) { 
		this.engine = engine;
	}
	
	/**
	 * This is the only Resource method that is ever directly called by a user. 
	 * All other calls are made via AJAX Requests.  This method returns the index page
	 * that bootstraps up the JS bundle and all other assets and starts the React engine. 
	 * Note: This is only used in Production Mode.  In Development the node server handles serving
	 * the initial bundle. 
	 */
	@GET
	@Path("{path: .*}")
	@Produces(MediaType.TEXT_HTML)
	public IndexView reactIndex(@Auth Person p) {
		IndexView view = new IndexView("/views/index.ftl");
		view.setCurrentUser(p);
		
		view.setSecurityBannerText(engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
		view.setSecurityBannerColor(engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
		
		return view;
	}
	
}
