package mil.dds.anet.resources;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

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
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Poam;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.PoamList;
import mil.dds.anet.beans.search.PoamSearchQuery;
import mil.dds.anet.database.PoamDao;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLParam;
import mil.dds.anet.graphql.IGraphQLResource;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

@Path("/api/poams")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class PoamResource implements IGraphQLResource {

	PoamDao dao;
	
	public PoamResource(AnetObjectEngine engine) {
		this.dao = engine.getPoamDao();
	}
	
	@Override
	public Class<Poam> getBeanClass() {
		return Poam.class;
	}
	
	public Class<PoamList> getBeanListClass() {
		return PoamList.class;
	}
	
	@Override
	public String getDescription() {
		return "Poams";
	}
	
	@GET
	@Timed
	@GraphQLFetcher
	@Path("/")
	public PoamList getAll(@Auth Person p, 
			@DefaultValue("0") @QueryParam("pageNum") Integer pageNum, 
			@DefaultValue("100") @QueryParam("pageSize") Integer pageSize) {
		return dao.getAll(pageNum, pageSize);
	}
	
	@GET
	@GraphQLFetcher
	@Path("/{id}")
	public Poam getById(@PathParam("id") int id) {
		Poam p =  dao.getById(id);
		if (p == null) { throw new WebApplicationException(Status.NOT_FOUND); } 
		return p;
	}
	
	@GET
	@Path("/{id}/children")
	public PoamList getChildren(@PathParam("id") int id, @QueryParam("cat") String category) {
		List<Poam> p = dao.getPoamAndChildren(id);
		if (category != null) { 
			p = p.stream().filter(el -> el.getCategory().equalsIgnoreCase(category))
				.collect(Collectors.toList());
		}
		return new PoamList(p);
	}
	
	@POST
	@Path("/new")
	@RolesAllowed("SUPER_USER")
	public Poam createNewPoam(@Auth Person user, Poam p) {
		if (AuthUtils.isAdmin(user) == false) { 
			if (p.getResponsibleOrg() == null || p.getResponsibleOrg().getId() == null) { 
				throw new WebApplicationException("You must select a responsible organization", Status.FORBIDDEN);
			}
			//Super Users can only create poams within their organization. 
			AuthUtils.assertSuperUserForOrg(user, p.getResponsibleOrg());
		}
		p = dao.insert(p);
		AnetAuditLogger.log("Poam {} created by {}", p, user);
		return p;
	}
	
	/* Updates shortName, longName, category, and parentPoamId */
	@POST
	@Path("/update")
	@RolesAllowed("SUPER_USER")
	public Response updatePoam(@Auth Person user, Poam p) { 
		//Admins can edit all Poams, SuperUsers can edit poams within their EF. 
		if (AuthUtils.isAdmin(user) == false) { 
			Poam existing = dao.getById(p.getId());
			AuthUtils.assertSuperUserForOrg(user, existing.getResponsibleOrg());
			
			//If changing the Responsible Organization, Super Users must also have super user privileges over the next org.
			if (!Objects.equals(DaoUtils.getId(existing.getResponsibleOrg()), DaoUtils.getId(p.getResponsibleOrg()))) {
				if (DaoUtils.getId(p.getResponsibleOrg()) == null) { 
					throw new WebApplicationException("You must select a responsible organization", Status.FORBIDDEN);
				}
				AuthUtils.assertSuperUserForOrg(user, p.getResponsibleOrg());
			}
		}
		
		int numRows = dao.update(p);
		if (numRows == 0) { 
			throw new WebApplicationException("Couldn't process update", Status.NOT_FOUND);
		}
		AnetAuditLogger.log("Poam {} updatedby {}", p, user);
		return Response.ok().build();
	}
	
	@GET
	@Path("/byParentId")
	public PoamList getPoamsByParentId(@QueryParam("id") int parentId) {
		return new PoamList(dao.getPoamsByParentId(parentId));
	}
	
	@GET
	@GraphQLFetcher
	@Path("/tree")
	public PoamList getFullPoamTree() { 
		List<Poam> poams = dao.getAll(0, Integer.MAX_VALUE).getList();
		
		Map<Integer,Poam> poamById = new HashMap<Integer,Poam>();
		List<Poam> topPoams = new LinkedList<Poam>();
		for (Poam p : poams) {
			p.setChildrenPoams(new LinkedList<Poam>());
			poamById.put(p.getId(), p);
		}
		for (Poam p : poams) { 
			if (p.getParentPoam() != null) { 
				Poam parent = poamById.get(p.getParentPoam().getId());
				parent.getChildrenPoams().add(p);
			} else { 
				topPoams.add(p);
			}
		}
		return new PoamList(topPoams);
	}
	
	@POST
	@GraphQLFetcher
	@Path("/search")
	public PoamList search(@GraphQLParam("query") PoamSearchQuery query) {
		return dao.search(query);
	}
	
	@GET
	@Path("/search")
	public PoamList search(@Context HttpServletRequest request) {
		try { 
			return search(ResponseUtils.convertParamsToBean(request, PoamSearchQuery.class));
		} catch (IllegalArgumentException e) { 
			throw new WebApplicationException(e.getMessage(), e.getCause(), Status.BAD_REQUEST);
		}
	}
	
	/**
	 * Returns the most recent PoAMs that this user listed in reports.
	 * @param maxResults maximum number of results to return, defaults to 3
	 */
	@GET
	@GraphQLFetcher
	@Path("/recents")
	public PoamList recents(@Auth Person user,
			@DefaultValue("3") @QueryParam("maxResults") int maxResults) {
		return new PoamList(dao.getRecentPoams(user, maxResults));
	}
}
