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
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.skife.jdbi.v2.exceptions.UnableToExecuteStatementException;

import com.codahale.metrics.annotation.Timed;

import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

@Path("/api/savedSearches")
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
	public SavedSearch saveSearch(@Auth Person user, SavedSearch search) {
		search.setOwner(Person.createWithId(user.getId()));
		try {
			return dao.insert(search);
		} catch (UnableToExecuteStatementException e) {
			throw ResponseUtils.handleSqlException(e, "Duplicate name for saved search");
		}
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
	public Response delete(@Auth Person user, @PathParam("id") Integer id) { 
		int numDeleted = dao.deleteSavedSearch(id, user);
		if (numDeleted == 1) { 
			return Response.ok().build();
		} else { 
			return Response.status(Status.NOT_FOUND).build();
		}
	}
}
