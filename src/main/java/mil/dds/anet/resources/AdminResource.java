package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLQuery;

import java.util.List;
import java.util.Map;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.codahale.metrics.annotation.Timed;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class AdminResource {

	private AdminDao dao;
	private AnetConfiguration config;

	public AdminResource(AnetObjectEngine engine, AnetConfiguration config) {
		this.dao = engine.getAdminDao();
		this.config = config;
	}
	
	@GET
	@Timed
	@GraphQLQuery(name="adminSettings")
	@Path("/")
	public List<AdminSetting> getAll() { 
		return dao.getAllSettings();
	}
	
	@POST
	@Timed
	@Path("/save")
	@RolesAllowed("ADMINISTRATOR")
	public Response save(List<AdminSetting> settings) {
		for (AdminSetting setting : settings) {
			dao.saveSetting(setting);
		}

		return Response.ok().build();
	}

	@GET
	@Timed
	@Path("/dictionary")
	public Map<String, Object> getDictionary() {
		return config.getDictionary();
	}
	
}
