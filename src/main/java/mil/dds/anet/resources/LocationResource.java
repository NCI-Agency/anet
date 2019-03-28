package mil.dds.anet.resources;

import java.util.Map;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;

@PermitAll
public class LocationResource {

	private final LocationDao dao;
	
	public LocationResource(AnetObjectEngine engine) { 
		this.dao = engine.getLocationDao();
	}

	@GraphQLQuery(name="locations")
	public AnetBeanList<Location> getAll(@GraphQLArgument(name="pageNum", defaultValue="0") int pageNum,
			@GraphQLArgument(name="pageSize", defaultValue="100") int pageSize) {
		return dao.getAll(pageNum, pageSize);
	}

	@GraphQLQuery(name="location")
	public Location getByUuid(@GraphQLArgument(name="uuid") String uuid) {
		Location loc = dao.getByUuid(uuid);
		if (loc == null) { throw new WebApplicationException(Status.NOT_FOUND); }
		return loc;
	}

	@GraphQLQuery(name="locationList")
	public AnetBeanList<Location> search(@GraphQLArgument(name="query") LocationSearchQuery query) {
		return dao.search(query);
	}
	
	@GraphQLMutation(name="createLocation")
	@RolesAllowed("SUPER_USER")
	public Location createLocation(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="location") Location l) {
		if (l.getName() == null || l.getName().trim().length() == 0) { 
			throw new WebApplicationException("Location name must not be empty", Status.BAD_REQUEST);
		}
		l = dao.insert(l);
		AnetAuditLogger.log("Location {} created by {}", l, DaoUtils.getUserFromContext(context));
		return l;
	}

	@GraphQLMutation(name="updateLocation")
	@RolesAllowed("SUPER_USER")
	public Integer updateLocation(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="location") Location l) {
		final int numRows = dao.update(l);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process location update", Status.NOT_FOUND);
		}
		AnetAuditLogger.log("Location {} updated by {}", l, DaoUtils.getUserFromContext(context));
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return numRows;
	}

	/**
	 * Returns the most recent locations that this user listed in reports.
	 * @param maxResults maximum number of results to return, defaults to 3
	 */
	@GraphQLQuery(name="locationRecents")
	public AnetBeanList<Location> recents(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="maxResults", defaultValue="3") int maxResults) {
		return new AnetBeanList<Location>(dao.getRecentLocations(DaoUtils.getUserFromContext(context), maxResults));
	}
	
}
