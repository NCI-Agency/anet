package mil.dds.anet.resources;

import java.util.List;

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
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.IGraphQLBean;
import mil.dds.anet.graphql.IGraphQLResource;
import mil.dds.anet.utils.ResponseUtils;

@Path("/api/savedSearches")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class SavedSearchResource implements IGraphQLResource  {

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
	@GraphQLFetcher("mine")
	@Path("/mine")
	public List<SavedSearch> getMySearches(@Auth Person user) { 
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
	
	@Override
	public String getDescription() {
		return "Saved Searches";
	}

	@Override
	public Class<? extends IGraphQLBean> getBeanClass() {
		return SavedSearch.class;
	}
	
	@SuppressWarnings("rawtypes")
	public Class<List> getBeanListClass() {
		return List.class;
	}
}
