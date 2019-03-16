package mil.dds.anet.resources;

import java.util.Map;
import java.util.Objects;

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

import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

import com.codahale.metrics.annotation.Timed;

import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;

@Path("/old-api/tasks")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class TaskResource {

	TaskDao dao;
	private final String duplicateTaskShortName;
	
	public TaskResource(AnetObjectEngine engine, AnetConfiguration config) {
		this.dao = engine.getTaskDao();
		final String taskShortLabel = (String) config.getDictionaryEntry("fields.task.shortLabel");
		duplicateTaskShortName = String.format("Duplicate %s number", taskShortLabel);
	}
	
	@GET
	@Timed
	@GraphQLQuery(name="tasks")
	@Path("/")
	public AnetBeanList<Task> getAll(@DefaultValue("0") @QueryParam("pageNum") @GraphQLArgument(name="pageNum", defaultValue="0")Integer pageNum,
			@DefaultValue("100") @QueryParam("pageSize") @GraphQLArgument(name="pageSize", defaultValue="100") Integer pageSize) {
		return dao.getAll(pageNum, pageSize);
	}
	
	@GET
	@GraphQLQuery(name="task")
	@Path("/{uuid}")
	public Task getByUuid(@PathParam("uuid") @GraphQLArgument(name="uuid") String uuid) {
		Task p =  dao.getByUuid(uuid);
		if (p == null) { throw new WebApplicationException(Status.NOT_FOUND); } 
		return p;
	}
	
	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("ADMIN")
	public Task createTask(@Auth Person user, Task p) {
		return createTaskCommon(user, p);
	}

	private Task createTaskCommon(Person user, Task p) {
		if (AuthUtils.isAdmin(user) == false) { 
			if (p.getResponsibleOrgUuid() == null) {
				throw new WebApplicationException("You must select a responsible organization", Status.FORBIDDEN);
			}
			//Admin Users can only create tasks within their organization.
			AuthUtils.assertSuperUserForOrg(user, p.getResponsibleOrgUuid());
		}
		try {
			p = dao.insert(p);
			AnetAuditLogger.log("Task {} created by {}", p, user);
			return p;
		} catch (UnableToExecuteStatementException e) {
			throw ResponseUtils.handleSqlException(e, duplicateTaskShortName);
		}
	}

	@GraphQLMutation(name="createTask")
	@RolesAllowed("ADMIN")
	public Task createTask(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="task") Task p) {
		return createTaskCommon(DaoUtils.getUserFromContext(context), p);
	}
	
	/* Updates shortName, longName, category, and customFieldRef1Uuid */
	@POST
	@Timed
	@Path("/update")
	@RolesAllowed("ADMIN")
	public Response updateTask(@Auth Person user, Task p) { 
		updateTaskCommon(user, p);
		return Response.ok().build();
	}

	private int updateTaskCommon(Person user, Task p) {
		//Admins can edit all Tasks, SuperUsers can edit tasks within their EF. 
		if (AuthUtils.isAdmin(user) == false) { 
			Task existing = dao.getByUuid(p.getUuid());
			AuthUtils.assertSuperUserForOrg(user, existing.getResponsibleOrgUuid());
			
			//If changing the Responsible Organization, Super Users must also have super user privileges over the next org.
			if (!Objects.equals(existing.getResponsibleOrgUuid(), p.getResponsibleOrgUuid())) {
				if (p.getResponsibleOrgUuid() == null) {
					throw new WebApplicationException("You must select a responsible organization", Status.FORBIDDEN);
				}
				AuthUtils.assertSuperUserForOrg(user, p.getResponsibleOrgUuid());
			}
		}

		// Check for loops in the hierarchy
		final Map<String, Task> children = AnetObjectEngine.getInstance().buildTopLevelTaskHash(DaoUtils.getUuid(p));
		if (p.getCustomFieldRef1Uuid() != null && children.containsKey(p.getCustomFieldRef1Uuid())) {
			throw new WebApplicationException("Task can not be its own (grand…)parent");
		}

		try {
			final int numRows = dao.update(p);
			if (numRows == 0) {
				throw new WebApplicationException("Couldn't process task update", Status.NOT_FOUND);
			}
			AnetAuditLogger.log("Task {} updatedby {}", p, user);
			return numRows;
		} catch (UnableToExecuteStatementException e) {
			throw ResponseUtils.handleSqlException(e, duplicateTaskShortName);
		}
	}

	@GraphQLMutation(name="updateTask")
	@RolesAllowed("ADMIN")
	public Integer updateTask(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="task") Task p) {
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return updateTaskCommon(DaoUtils.getUserFromContext(context), p);
	}
	
	@POST
	@Timed
	@GraphQLQuery(name="taskList")
	@Path("/search")
	public AnetBeanList<Task> search(@GraphQLArgument(name="query") TaskSearchQuery query) {
		return dao.search(query);
	}
	
	@GET
	@Timed
	@Path("/search")
	public AnetBeanList<Task> search(@Context HttpServletRequest request) {
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
	@Timed
	@GraphQLQuery(name="taskRecents")
	@Path("/recents")
	public AnetBeanList<Task> recents(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="_") @Auth Person user,
			@DefaultValue("3") @QueryParam("maxResults") @GraphQLArgument(name="maxResults", defaultValue="3") int maxResults) {
		user = DaoUtils.getUser(context, user);
		return new AnetBeanList<Task>(dao.getRecentTasks(user, maxResults));
	}
}
