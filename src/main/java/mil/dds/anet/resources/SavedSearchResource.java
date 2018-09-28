package mil.dds.anet.resources;

import java.util.List;
import java.util.Map;

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

import org.skife.jdbi.v2.exceptions.UnableToExecuteStatementException;

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
		savedSearch.setOwner(Person.createWithId(user.getId()));
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
    @Path("/{id}")
    public Response deleteSavedSearch(@Auth Person user, @PathParam("id") Integer id) {
        deleteSavedSearchCommon(user, id);
        return Response.ok().build();
    }

    private int deleteSavedSearchCommon(Person user, int savedSearchId) {
        int numDeleted = dao.deleteSavedSearch(savedSearchId, user);
        if (numDeleted == 0) {
            throw new WebApplicationException("Saved search not found", Status.NOT_FOUND);
        }
        return numDeleted;
    }

    @GraphQLMutation(name="deleteSavedSearch")
    public Integer deleteSavedSearch(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="id") int savedSearchId) {
        return deleteSavedSearchCommon(DaoUtils.getUserFromContext(context), savedSearchId);
    }
}
