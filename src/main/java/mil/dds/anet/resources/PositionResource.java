package mil.dds.anet.resources;

import java.util.List;
import java.util.concurrent.ExecutionException;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.DELETE;
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

import org.joda.time.DateTime;

import com.codahale.metrics.annotation.Timed;

import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;

@Path("/api/positions")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class PositionResource {

	AnetObjectEngine engine;
	PositionDao dao;

	public PositionResource(AnetObjectEngine engine) {
		this.engine = engine;
		this.dao = engine.getPositionDao();
	}

	@GET
	@Timed
	@GraphQLQuery(name="positions")
	@Path("/")
	public AnetBeanList<Position> getAll(@DefaultValue("0") @QueryParam("pageNum") @GraphQLArgument(name="pageNum", defaultValue="0") int pageNum,
			@DefaultValue("100") @QueryParam("pageSize") @GraphQLArgument(name="pageSize", defaultValue="100") int pageSize) {
		return dao.getAll(pageNum, pageSize);
	}

	@GET
	@Timed
	@Path("/{uuid}")
	@GraphQLQuery(name="position")
	public Position getByUuid(@PathParam("uuid") @GraphQLArgument(name="uuid") String uuid) {
		Position p = dao.getByUuid(uuid);
		if (p == null) { throw new WebApplicationException(Status.NOT_FOUND); }
		return p;
	}

	/**
	 * Creates a new position in the database. Must have Type and Organization with UUID specified.
	 * Optionally can provide:
	 * - position.person : If a person UUID is provided in the Person object, that person will be put in this position.
	 * @param position the position to create
	 * @return the same Position object with the UUID field filled in.
	 */
	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("SUPER_USER")
	public Position createPosition(@Auth Person user, Position p) {
		if (p.getName() == null || p.getName().trim().length() == 0) {
			throw new WebApplicationException("Position Name must not be null", Status.BAD_REQUEST);
		}
		if (p.getType() == null) { throw new WebApplicationException("Position type must be defined", Status.BAD_REQUEST); }
		if (p.getOrganization() == null || p.getOrganization().getUuid() == null) {
			throw new WebApplicationException("A Position must belong to an organization", Status.BAD_REQUEST); 
		}
		if (p.getType() == PositionType.ADMINISTRATOR || p.getType() == PositionType.SUPER_USER) { AuthUtils.assertAdministrator(user); }
		
		AuthUtils.assertSuperUserForOrg(user, p.getOrganization());

		Position created = dao.insert(p);
		
		if (p.getPerson() != null) { 
			dao.setPersonInPosition(p.getPerson(), created);
		}

		AnetAuditLogger.log("Position {} created by {}", p, user);
		return created;
	}

	@POST
	@Timed
	@Path("/updateAssociatedPosition")
	@RolesAllowed("SUPER_USER")
	public Response updateAssociatedPosition(@Auth Person user, Position pos) {
		AuthUtils.assertSuperUserForOrg(user, pos.getOrganization());

		final Position current = dao.getByUuid(pos.getUuid());
		if (current != null) {
			// Run the diff and see if anything changed and update.
			if (pos.getAssociatedPositions() != null) {
				Utils.addRemoveElementsByUuid(current.loadAssociatedPositions(), pos.getAssociatedPositions(),
						newPosition -> {
							dao.associatePosition(newPosition, pos);
						},
						oldPositionUuid -> {
							dao.deletePositionAssociation(pos, Position.createWithUuid(oldPositionUuid));
						});
				AnetAuditLogger.log("Person {} associations changed to {} by {}", current, pos.getAssociatedPositions(), user);
			}
		}

		return (current == null) ? Response.status(Status.NOT_FOUND).build() : Response.ok().build();
	}

	@POST
	@Timed
	@Path("/update")
	@RolesAllowed("SUPER_USER")
	public Response updatePosition(@Auth Person user, Position pos) {
		if (pos.getType() == PositionType.ADMINISTRATOR || pos.getType() == PositionType.SUPER_USER) { AuthUtils.assertAdministrator(user); }
		if (DaoUtils.getUuid(pos.getOrganization()) == null) {
			throw new WebApplicationException("A Position must belong to an organization", Status.BAD_REQUEST); 
		}
		AuthUtils.assertSuperUserForOrg(user, pos.getOrganization());

		final int numRows = dao.update(pos);

		if (pos.getPerson() != null || PositionStatus.INACTIVE.equals(pos.getStatus())) {
			final Position current = dao.getByUuid(pos.getUuid());
			if (current != null) {
				//Run the diff and see if anything changed and update.
				if (pos.getPerson() != null) {
					if (pos.getPerson().getUuid() == null) {
						//Intentionally remove the person
						dao.removePersonFromPosition(current);
						AnetAuditLogger.log("Person {} removed from position {} by {}", pos.getPerson(), current, user);
					} else if (Utils.uuidEqual(pos.getPerson(), current.getPerson()) == false) {
						dao.setPersonInPosition(pos.getPerson(), pos);
						AnetAuditLogger.log("Person {} put in position {} by {}", pos.getPerson(), current, user);
					}
				}

				if (PositionStatus.INACTIVE.equals(pos.getStatus()) && current.getPerson() != null) {
					//Remove this person from this position.
					AnetAuditLogger.log("Person {} removed from position {} by {} because the position is now inactive",
							current.getPerson(), current, user);
					dao.removePersonFromPosition(current);
				}
			}
		}

		AnetAuditLogger.log("Position {} edited by {}", pos, user);
		return (numRows == 1) ? Response.ok().build() : Response.status(Status.NOT_FOUND).build();
	}

	@GET
	@Timed
	@Path("/{uuid}/person")
	public Person getAdvisorInPosition(@PathParam("uuid") String positionUuid, @QueryParam("atTime") Long atTimeMillis) {
		Position p = Position.createWithUuid(positionUuid);

		DateTime dtg = (atTimeMillis == null) ? DateTime.now() : new DateTime(atTimeMillis);
		return dao.getPersonInPosition(p, dtg);
	}

	@POST
	@Timed
	@Path("/{uuid}/person")
	@RolesAllowed("SUPER_USER")
	public Response putPersonInPosition(@Auth Person user, @PathParam("uuid") String positionUuid, Person p) {
		Position pos = dao.getByUuid(positionUuid);
		AuthUtils.assertSuperUserForOrg(user, pos.getOrganization());

		dao.setPersonInPosition(p, pos);
		AnetAuditLogger.log("Person {} put in Position {} by {}", p, pos, user);
		return Response.ok().build();
	}

	@DELETE
	@Timed
	@Path("/{uuid}/person")
	@RolesAllowed("SUPER_USER")
	public Response deletePersonFromPosition(@Auth Person user, @PathParam("uuid") String positionUuid) {
		Position pos = dao.getByUuid(positionUuid);
		if (pos == null) { return Response.status(Status.NOT_FOUND).build(); } 
		AuthUtils.assertSuperUserForOrg(user, pos.getOrganization());

		dao.removePersonFromPosition(pos);
		AnetAuditLogger.log("Person removed from Position uuid#{} by {}", positionUuid, user);
		return Response.ok().build();
	}

	@GET
	@Timed
	@Path("/{uuid}/associated")
	public AnetBeanList<Position> getAssociatedPositions(@PathParam("uuid") String positionUuid) {
		Position b = Position.createWithUuid(positionUuid);

		return new AnetBeanList<Position>(dao.getAssociatedPositions(b));
	}

	@POST
	@Timed
	@Path("/{uuid}/associated")
	@RolesAllowed("SUPER_USER")
	public Response associatePositions(@PathParam("uuid") String positionUuid, Position b, @Auth Person user) {
		Position a = dao.getByUuid(positionUuid);
		b = dao.getByUuid(b.getUuid());
		
		Position principalPos = (a.getType() == PositionType.PRINCIPAL) ? a : b;
		Position advisorPos = (a.getType() == PositionType.PRINCIPAL) ? b : a;
		if (principalPos.getType() != PositionType.PRINCIPAL) { 
			throw new WebApplicationException("You can only associate positions between PRINCIPAL and [ADVISOR | SUPER_USER | ADMINISTRATOR]", 
					Status.BAD_REQUEST);
		}
		if (advisorPos.getType() == PositionType.PRINCIPAL) { 
			throw new WebApplicationException("You can only associate positions between PRINCIPAL and [ADVISOR | SUPER_USER | ADMINISTRATOR]",
					Status.BAD_REQUEST);
		}
		
		AuthUtils.assertSuperUserForOrg(user, advisorPos.getOrganization());
		
		dao.associatePosition(a, b);
		
		AnetAuditLogger.log("Positions {} and {} associated by {}", a, b, user);
		return Response.ok().build();
	}

	@DELETE
	@Timed
	@Path("/{uuid}/associated/{positionUuid}")
	@RolesAllowed("SUPER_USER")
	public Response deletePositionAssociation(@PathParam("uuid") String positionUuid, @PathParam("positionUuid") String associatedPositionUuid, @Auth Person user) {
		Position a = dao.getByUuid(positionUuid);
		Position b = dao.getByUuid(associatedPositionUuid);

		Position advisorPos = (a.getType() == PositionType.PRINCIPAL) ? b : a;
		AuthUtils.assertSuperUserForOrg(user, advisorPos.getOrganization());
		
		dao.deletePositionAssociation(a, b);
		AnetAuditLogger.log("Positions {} and {} disassociated by {}", a, b, user);
		return Response.ok().build();
	}

	@GET
	@Timed
	@Path("/{uuid}/history")
	public List<PersonPositionHistory> getPositionHistory(@PathParam("uuid") String positionUuid) {
		Position position = dao.getByUuid(positionUuid);
		if (position == null) { throw new WebApplicationException(Status.NOT_FOUND); } 
		try {
			return dao.getPositionHistory(engine.getContext(), position).get();
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to get PositionHistory", e);
		}
	}
	
	@GET
	@Timed
	@Path("/search")
	public AnetBeanList<Position> search(@Context HttpServletRequest request) {
		try {
			return search(ResponseUtils.convertParamsToBean(request, PositionSearchQuery.class));
		} catch (IllegalArgumentException e) {
			throw new WebApplicationException(e.getMessage(), e.getCause(), Status.BAD_REQUEST);
		}
	}

	@POST
	@Timed
	@GraphQLQuery(name="positionList")
	@Path("/search")
	public AnetBeanList<Position> search(@GraphQLArgument(name="query") PositionSearchQuery query) {
		return dao.search(query);
	}

	
	@DELETE
	@Timed
	@Path("/{uuid}")
	public Response deletePosition(@PathParam("uuid") String positionUuid) {
		Position p = dao.getByUuid(positionUuid);
		if (p == null) { return Response.status(Status.NOT_FOUND).build(); } 
		
		//if there is a person in this position, reject
		if (p.getPerson() != null) { 
			throw new WebApplicationException("Cannot delete a position that current has a person", Status.BAD_REQUEST); 
		} 
		
		//if position is active, reject. 
		if (PositionStatus.ACTIVE.equals(p.getStatus())) { 
			throw new WebApplicationException("Cannot delete an active position", Status.BAD_REQUEST);
		}
		
		//if this position has any history, we'll just delete it
		//if this position is in an approval chain, we just delete it 
		//if this position is in an organization, just remove it.
		//if this position has any associated positions, just remove them.
		dao.deletePosition(p);
		return Response.ok().build();
	}

}
