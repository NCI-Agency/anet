package mil.dds.anet.resources;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

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
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

@Path("/old-api/authorizationGroups")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class AuthorizationGroupResource {

	private AnetObjectEngine engine;
	private AuthorizationGroupDao dao;

	public AuthorizationGroupResource(AnetObjectEngine engine) {
		this.engine = engine;
		this.dao = engine.getAuthorizationGroupDao();
	}

	@GET
	@Timed
	@GraphQLQuery(name="authorizationGroups")
	@Path("/")
	public AnetBeanList<AuthorizationGroup> getAll(@DefaultValue("0") @QueryParam("pageNum") @GraphQLArgument(name="pageNum", defaultValue="0") int pageNum,
			@DefaultValue("100") @QueryParam("pageSize") @GraphQLArgument(name="pageSize", defaultValue="100") int pageSize) {
		return dao.getAll(pageNum, pageSize);
	}

	@GET
	@Timed
	@GraphQLQuery(name="authorizationGroup")
	@Path("/{uuid}")
	public AuthorizationGroup getByUuid(@PathParam("uuid") @GraphQLArgument(name="uuid") String uuid) {
		final AuthorizationGroup t = dao.getByUuid(uuid);
		if (t == null) {
			throw new WebApplicationException(Status.NOT_FOUND);
		}
		return t;
	}

	@POST
	@Timed
	@GraphQLQuery(name="authorizationGroupList")
	@Path("/search")
	public AnetBeanList<AuthorizationGroup> search(@GraphQLArgument(name="query") AuthorizationGroupSearchQuery query) {
		return dao.search(query);
	}

	@GET
	@Timed
	@Path("/search")
	public AnetBeanList<AuthorizationGroup> search(@Context HttpServletRequest request) {
		return search(ResponseUtils.convertParamsToBean(request, AuthorizationGroupSearchQuery.class));
	}

	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("ADMINISTRATOR")
	public AuthorizationGroup createAuthorizationGroup(@Auth Person user, AuthorizationGroup t) {
		return createAuthorizationGroupCommon(user, t);
	}

	private AuthorizationGroup createAuthorizationGroupCommon(Person user, AuthorizationGroup t) {
		if (t.getName() == null || t.getName().trim().length() == 0) {
			throw new WebApplicationException("AuthorizationGroup name must not be empty", Status.BAD_REQUEST);
		}
		t = dao.insert(t);
		AnetAuditLogger.log("AuthorizationGroup {} created by {}", t, user);
		return t;
	}

	@GraphQLMutation(name="createAuthorizationGroup")
	@RolesAllowed("ADMINISTRATOR")
	public AuthorizationGroup createAuthorizationGroup(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="authorizationGroup") AuthorizationGroup t) {
		return createAuthorizationGroupCommon(DaoUtils.getUserFromContext(context), t);
	}

	@POST
	@Timed
	@Path("/update")
	@RolesAllowed("ADMINISTRATOR")
	public Response updateAuthorizationGroup(@Auth Person user, AuthorizationGroup t) {
		updateAuthorizationGroupCommon(user, t);
		return Response.ok().build();
	}

	private int updateAuthorizationGroupCommon(Person user, AuthorizationGroup t) {
		final int numRows = dao.update(t);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process authorization group update", Status.NOT_FOUND);
		}
		// Update positions:
		if (t.getPositions() != null) {
			try {
				final List<Position> existingPositions = dao.getPositionsForAuthorizationGroup(engine.getContext(), t.getUuid()).get();
				for (final Position p : t.getPositions()) {
					Optional<Position> existingPosition = existingPositions.stream().filter(el -> el.getUuid().equals(p.getUuid())).findFirst();
					if (existingPosition.isPresent()) {
						existingPositions.remove(existingPosition.get());
					} else {
						dao.addPositionToAuthorizationGroup(p, t);
					}
				}
				for (final Position p : existingPositions) {
					dao.removePositionFromAuthorizationGroup(p, t);
				}
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load Positions", e);
			}
		}
		AnetAuditLogger.log("AuthorizationGroup {} updated by {}", t, user);
		return numRows;
	}

	@GraphQLMutation(name="updateAuthorizationGroup")
	@RolesAllowed("ADMINISTRATOR")
	public Integer updateAuthorizationGroup(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="authorizationGroup") AuthorizationGroup t) {
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return updateAuthorizationGroupCommon(DaoUtils.getUserFromContext(context), t);
	}

	/**
	 * Returns the most recent authorization groups that this user used in reports.
	 * @param maxResults maximum number of results to return, defaults to 3
	 */
	@GET
	@Timed
	@GraphQLQuery(name="authorizationGroupRecents")
	@Path("/recents")
	public AnetBeanList<AuthorizationGroup> recents(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="_") @Auth Person user,
			@DefaultValue("3") @QueryParam("maxResults") @GraphQLArgument(name="maxResults", defaultValue="3") int maxResults) {
		user = DaoUtils.getUser(context, user);
		return new AnetBeanList<AuthorizationGroup>(dao.getRecentAuthorizationGroups(user, maxResults));
	}

}
