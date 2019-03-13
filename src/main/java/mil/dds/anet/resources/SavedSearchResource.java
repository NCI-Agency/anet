package mil.dds.anet.resources;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import javax.annotation.security.PermitAll;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

import com.codahale.metrics.annotation.Timed;

import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

@Path("/old-api/savedSearches")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class SavedSearchResource {

	SavedSearchDao dao;
	
	public SavedSearchResource(AnetObjectEngine engine) { 
		this.dao = engine.getSavedSearchDao();
	}
	
	@POST
	@Timed
	@Path("/new")
	public SavedSearch createSavedSearch(@Auth Person user, SavedSearch savedSearch) {
		return createSavedSearchCommon(user, savedSearch);
	}

	private SavedSearch createSavedSearchCommon(Person user, SavedSearch savedSearch) {
		savedSearch.setOwnerUuid(user.getUuid());
		try {
			final SavedSearch created = dao.insert(savedSearch);
			AnetAuditLogger.log("SavedSearch {} created by {}", created, user);
			return created;
		} catch (UnableToExecuteStatementException e) {
			throw ResponseUtils.handleSqlException(e, "Duplicate name for saved search");
		}
	}

	@GraphQLMutation(name="createSavedSearch")
	public SavedSearch createSavedSearch(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="savedSearch") SavedSearch savedSearch) {
		return createSavedSearchCommon(DaoUtils.getUserFromContext(context), savedSearch);
	}

	@GET
	@Timed
	@GraphQLQuery(name="mySearches")
	@Path("/mine")
	public List<SavedSearch> getMySearches(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="_") @Auth Person user) {
		user = DaoUtils.getUser(context, user);
		return dao.getSearchesByOwner(user);
	}

	@DELETE
	@Timed
	@Path("/{uuid}")
	public Response deleteSavedSearch(@Auth Person user, @PathParam("uuid") String uuid) {
		deleteSavedSearchCommon(user, uuid);
		return Response.ok().build();
	}

	private int deleteSavedSearchCommon(Person user, String savedSearchUuid) {
		final SavedSearch s = dao.getByUuid(savedSearchUuid);
		if (s == null) {
			throw new WebApplicationException("Saved search not found", Status.NOT_FOUND);
		}
		if (!Objects.equals(s.getOwnerUuid(), user.getUuid())) {
			throw new WebApplicationException("Saved search can only be deleted by owner", Status.FORBIDDEN);
		}
		int numDeleted = dao.delete(savedSearchUuid);
		if (numDeleted == 0) {
			throw new WebApplicationException("Couldn't process saved search delete", Status.NOT_FOUND);
		}
		return numDeleted;
	}

	@GraphQLMutation(name="deleteSavedSearch")
	public Integer deleteSavedSearch(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="uuid") String savedSearchUuid) {
	    return deleteSavedSearchCommon(DaoUtils.getUserFromContext(context), savedSearchUuid);
	}
}
