package mil.dds.anet.resources;

import java.util.Map;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import com.codahale.metrics.annotation.Timed;

import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

@Path("/api/locations")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class LocationResource {

	private LocationDao dao;
	
	public LocationResource(AnetObjectEngine engine) { 
		this.dao = engine.getLocationDao();
	}
	
	@GET
	@Timed
	@GraphQLQuery(name="locations")
	@Path("/")
	public AnetBeanList<Location> getAll(@DefaultValue("0") @QueryParam("pageNum") @GraphQLArgument(name="pageNum", defaultValue="0") int pageNum,
			@DefaultValue("100") @QueryParam("pageSize") @GraphQLArgument(name="pageSize", defaultValue="100") int pageSize) {
		return dao.getAll(pageNum, pageSize);
	}
	
	@GET
	@Timed
	@GraphQLQuery(name="location")
	@Path("/{id}")
	public Location getById(@PathParam("id") @GraphQLArgument(name="id") int id) {
		Location loc = dao.getById(id);
		if (loc == null) { throw new WebApplicationException(Status.NOT_FOUND); }
		return loc;
	}
	
	
	@POST
	@Timed
	@GraphQLQuery(name="locationList")
	@Path("/search")
	public AnetBeanList<Location> search(@GraphQLArgument(name="query") LocationSearchQuery query) {
		return dao.search(query);
	}
	
	@GET
	@Timed
	@Path("/search")
	public AnetBeanList<Location> search(@Context HttpServletRequest request) {
		return search(ResponseUtils.convertParamsToBean(request, LocationSearchQuery.class));
	}
	
	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("SUPER_USER")
	public Location createNewLocation(@Auth Person user, Location l) {
		if (l.getName() == null || l.getName().trim().length() == 0) { 
			throw new WebApplicationException("Location name must not be empty", Status.BAD_REQUEST);
		}
		l = dao.insert(l);
		AnetAuditLogger.log("Location {} created by {}", l, user);
		return l;
		
	}
	
	@POST
	@Timed
	@Path("/update")
	@RolesAllowed("SUPER_USER")
	public Response updateLocation(@Auth Person user, Location l) {
		int numRows = dao.update(l);
		AnetAuditLogger.log("Location {} updated by {}", l, user);
		return (numRows == 1) ? Response.ok().build() : Response.status(Status.NOT_FOUND).build();
	}

	/**
	 * Returns the most recent locations that this user listed in reports.
	 * @param maxResults maximum number of results to return, defaults to 3
	 */
	@GET
	@Timed
	@GraphQLQuery(name="locationRecents")
	@Path("/recents")
	public AnetBeanList<Location> recents(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="_") @Auth Person user,
			@DefaultValue("3") @QueryParam("maxResults") @GraphQLArgument(name="maxResults", defaultValue="3") int maxResults) {
		user = DaoUtils.getUser(context, user);
		return new AnetBeanList<Location>(dao.getRecentLocations(user, maxResults));
	}
	
}
