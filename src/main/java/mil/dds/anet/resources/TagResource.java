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
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.TagDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

@Path("/old-api/tags")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class TagResource {

	private TagDao dao;

	public TagResource(AnetObjectEngine engine) {
		this.dao = engine.getTagDao();
	}

	@GET
	@Timed
	@GraphQLQuery(name="tags")
	@Path("/")
	public AnetBeanList<Tag> getAll(@DefaultValue("0") @QueryParam("pageNum") @GraphQLArgument(name="pageNum", defaultValue="0") int pageNum,
			@DefaultValue("100") @QueryParam("pageSize") @GraphQLArgument(name="pageSize", defaultValue="100") int pageSize) {
		return dao.getAll(pageNum, pageSize);
	}

	@GET
	@Timed
	@GraphQLQuery(name="tag")
	@Path("/{id}")
	public Tag getById(@PathParam("id") @GraphQLArgument(name="id") int id) {
		final Tag t = dao.getById(id);
		if (t == null) {
			throw new WebApplicationException(Status.NOT_FOUND);
		}
		return t;
	}

	@POST
	@Timed
	@GraphQLQuery(name="tagList")
	@Path("/search")
	public AnetBeanList<Tag> search(@GraphQLArgument(name="query") TagSearchQuery query) {
		return dao.search(query);
	}

	@GET
	@Timed
	@Path("/search")
	public AnetBeanList<Tag> search(@Context HttpServletRequest request) {
		return search(ResponseUtils.convertParamsToBean(request, TagSearchQuery.class));
	}

	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("SUPER_USER")
	public Tag createTag(@Auth Person user, Tag t) {
		return createTagCommon(user, t);
	}

	@GraphQLMutation(name="createTag")
	@RolesAllowed("SUPER_USER")
	public Tag createTag(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="tag") Tag t) {
		return createTagCommon(DaoUtils.getUserFromContext(context), t);
	}

	private Tag createTagCommon(Person user, Tag t) {
		if (t.getName() == null || t.getName().trim().length() == 0) {
			throw new WebApplicationException("Tag name must not be empty", Status.BAD_REQUEST);
		}
		t = dao.insert(t);
		AnetAuditLogger.log("Tag {} created by {}", t, user);
		return t;
	}

	@POST
	@Timed
	@Path("/update")
	@RolesAllowed("SUPER_USER")
	public Response updateTag(@Auth Person user, Tag t) {
		updateTagCommon(user, t);
		return Response.ok().build();
	}

	@GraphQLMutation(name="updateTag")
	@RolesAllowed("SUPER_USER")
	public Integer updateTag(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="tag") Tag t) {
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return updateTagCommon(DaoUtils.getUserFromContext(context), t);
	}

	private int updateTagCommon(Person user, Tag t) {
		final int numRows = dao.update(t);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process tag update", Status.NOT_FOUND);
		}
		AnetAuditLogger.log("Tag {} updated by {}", t, user);
		return numRows;
	}

}
