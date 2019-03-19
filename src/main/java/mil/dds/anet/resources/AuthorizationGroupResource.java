package mil.dds.anet.resources;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;

@PermitAll
public class AuthorizationGroupResource {

	private final AnetObjectEngine engine;
	private final AuthorizationGroupDao dao;

	public AuthorizationGroupResource(AnetObjectEngine engine) {
		this.engine = engine;
		this.dao = engine.getAuthorizationGroupDao();
	}

	@GraphQLQuery(name="authorizationGroups")
	public AnetBeanList<AuthorizationGroup> getAll(@GraphQLArgument(name="pageNum", defaultValue="0") int pageNum,
			@GraphQLArgument(name="pageSize", defaultValue="100") int pageSize) {
		return dao.getAll(pageNum, pageSize);
	}

	@GraphQLQuery(name="authorizationGroup")
	public AuthorizationGroup getByUuid(@GraphQLArgument(name="uuid") String uuid) {
		final AuthorizationGroup t = dao.getByUuid(uuid);
		if (t == null) {
			throw new WebApplicationException(Status.NOT_FOUND);
		}
		return t;
	}

	@GraphQLQuery(name="authorizationGroupList")
	public AnetBeanList<AuthorizationGroup> search(@GraphQLArgument(name="query") AuthorizationGroupSearchQuery query) {
		return dao.search(query);
	}

	@GraphQLMutation(name="createAuthorizationGroup")
	@RolesAllowed("ADMINISTRATOR")
	public AuthorizationGroup createAuthorizationGroup(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="authorizationGroup") AuthorizationGroup t) {
		if (t.getName() == null || t.getName().trim().length() == 0) {
			throw new WebApplicationException("AuthorizationGroup name must not be empty", Status.BAD_REQUEST);
		}
		t = dao.insert(t);
		AnetAuditLogger.log("AuthorizationGroup {} created by {}", t, DaoUtils.getUserFromContext(context));
		return t;
	}

	@GraphQLMutation(name="updateAuthorizationGroup")
	@RolesAllowed("ADMINISTRATOR")
	public Integer updateAuthorizationGroup(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="authorizationGroup") AuthorizationGroup t) {
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
		AnetAuditLogger.log("AuthorizationGroup {} updated by {}", t, DaoUtils.getUserFromContext(context));
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return numRows;
	}

	/**
	 * Returns the most recent authorization groups that this user used in reports.
	 * @param maxResults maximum number of results to return, defaults to 3
	 */
	@GraphQLQuery(name="authorizationGroupRecents")
	public AnetBeanList<AuthorizationGroup> recents(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="maxResults", defaultValue="3") int maxResults) {
		return new AnetBeanList<AuthorizationGroup>(dao.getRecentAuthorizationGroups(DaoUtils.getUserFromContext(context), maxResults));
	}

}
