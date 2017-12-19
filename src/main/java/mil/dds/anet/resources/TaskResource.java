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
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.TaskList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLParam;
import mil.dds.anet.graphql.IGraphQLResource;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

@Path("/api/tasks")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class TaskResource implements IGraphQLResource {

	TaskDao dao;
	
	public TaskResource(AnetObjectEngine engine) {
		this.dao = engine.getTaskDao();
	}
	
	@Override
	public Class<Task> getBeanClass() {
		return Task.class;
	}
	
	public Class<TaskList> getBeanListClass() {
		return TaskList.class;
	}
	
	@Override
	public String getDescription() {
		return "Tasks";
	}
	
	@GET
	@Timed
	@GraphQLFetcher
	@Path("/")
	public TaskList getAll(@Auth Person p, 
			@DefaultValue("0") @QueryParam("pageNum") Integer pageNum, 
			@DefaultValue("100") @QueryParam("pageSize") Integer pageSize) {
		return dao.getAll(pageNum, pageSize);
	}
	
	@GET
	@GraphQLFetcher
	@Path("/{id}")
	public Task getById(@PathParam("id") int id) {
		Task p =  dao.getById(id);
		if (p == null) { throw new WebApplicationException(Status.NOT_FOUND); } 
		return p;
	}
	
	@GET
	@Path("/{id}/children")
	public TaskList getChildren(@PathParam("id") int id, @QueryParam("cat") String category) {
		List<Task> p = dao.getTaskAndChildren(id);
		if (category != null) { 
			p = p.stream().filter(el -> el.getCategory().equalsIgnoreCase(category))
				.collect(Collectors.toList());
		}
		return new TaskList(p);
	}
	
	@POST
	@Path("/new")
	@RolesAllowed("ADMIN")
	public Task createNewTask(@Auth Person user, Task p) {
		if (AuthUtils.isAdmin(user) == false) { 
			if (p.getResponsibleOrg() == null || p.getResponsibleOrg().getId() == null) { 
				throw new WebApplicationException("You must select a responsible organization", Status.FORBIDDEN);
			}
			//Admin Users can only create tasks within their organization.
			AuthUtils.assertSuperUserForOrg(user, p.getResponsibleOrg());
		}
		p = dao.insert(p);
		AnetAuditLogger.log("Task {} created by {}", p, user);
		return p;
	}
	
	/* Updates shortName, longName, category, and parentTaskId */
	@POST
	@Path("/update")
	@RolesAllowed("ADMIN")
	public Response updateTask(@Auth Person user, Task p) { 
		//Admins can edit all Tasks, SuperUsers can edit tasks within their EF. 
		if (AuthUtils.isAdmin(user) == false) { 
			Task existing = dao.getById(p.getId());
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
		AnetAuditLogger.log("Task {} updatedby {}", p, user);
		return Response.ok().build();
	}
	
	@GET
	@Path("/byParentId")
	public TaskList getTasksByParentId(@QueryParam("id") int parentId) {
		return new TaskList(dao.getTasksByParentId(parentId));
	}
	
	@GET
	@GraphQLFetcher
	@Path("/tree")
	public TaskList getFullTaskTree() { 
		List<Task> tasks = dao.getAll(0, Integer.MAX_VALUE).getList();
		
		Map<Integer,Task> taskById = new HashMap<Integer,Task>();
		List<Task> topTasks = new LinkedList<Task>();
		for (Task p : tasks) {
			p.setChildrenTasks(new LinkedList<Task>());
			taskById.put(p.getId(), p);
		}
		for (Task p : tasks) { 
			if (p.getParentTask() != null) { 
				Task parent = taskById.get(p.getParentTask().getId());
				parent.getChildrenTasks().add(p);
			} else { 
				topTasks.add(p);
			}
		}
		return new TaskList(topTasks);
	}
	
	@POST
	@GraphQLFetcher
	@Path("/search")
	public TaskList search(@GraphQLParam("query") TaskSearchQuery query) {
		return dao.search(query);
	}
	
	@GET
	@Path("/search")
	public TaskList search(@Context HttpServletRequest request) {
		try { 
			return search(ResponseUtils.convertParamsToBean(request, TaskSearchQuery.class));
		} catch (IllegalArgumentException e) { 
			throw new WebApplicationException(e.getMessage(), e.getCause(), Status.BAD_REQUEST);
		}
	}
	
	/**
	 * Returns the most recent Tasks that this user listed in reports.
	 * @param maxResults maximum number of results to return, defaults to 3
	 */
	@GET
	@GraphQLFetcher
	@Path("/recents")
	public TaskList recents(@Auth Person user,
			@DefaultValue("3") @QueryParam("maxResults") int maxResults) {
		return new TaskList(dao.getRecentTasks(user, maxResults));
	}
}
