package mil.dds.anet.resources;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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

import com.codahale.metrics.annotation.Timed;

import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
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

@Path("/old-api/positions")
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

	private void validatePosition(Person user, Position pos) {
		if (pos.getName() == null || pos.getName().trim().length() == 0) {
			throw new WebApplicationException("Position Name must not be null", Status.BAD_REQUEST);
		}
		if (pos.getType() == null) {
			throw new WebApplicationException("Position type must be defined", Status.BAD_REQUEST);
		}
		if (pos.getOrganizationUuid() == null) {
			throw new WebApplicationException("A Position must belong to an organization", Status.BAD_REQUEST);
		}
	}

	private void assertCanUpdatePosition(Person user, Position pos) {
		if (pos.getType() == PositionType.ADMINISTRATOR || pos.getType() == PositionType.SUPER_USER) {
			AuthUtils.assertAdministrator(user);
		}
		AuthUtils.assertSuperUserForOrg(user, pos.getOrganizationUuid());
	}

	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("SUPER_USER")
	public Position createPosition(@Auth Person user, Position pos) {
		return createPositionCommon(user, pos);
	}

	/**
	 * Creates a new position in the database. Must have Name, Type and Organization with UUID specified.
	 * Optionally can provide:
	 * - position.person : If a person UUID is provided in the Person object, that person will be put in this position.
	 * @param position the position to create
	 * @return the same Position object with the UUID field filled in.
	 */
	private Position createPositionCommon(Person user, Position pos) {
		assertCanUpdatePosition(user, pos);
		validatePosition(user, pos);

		Position position = dao.insert(pos);

		if (pos.getPersonUuid() != null) {
			dao.setPersonInPosition(pos.getPersonUuid(), position.getUuid());
		}

		AnetAuditLogger.log("Position {} created by {}", position, user);
		return position;
	}

	@GraphQLMutation(name="createPosition")
	@RolesAllowed("SUPER_USER")
	public Position createPosition(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="position") Position pos) {
		return createPositionCommon(DaoUtils.getUserFromContext(context), pos);
	}

	@POST
	@Timed
	@Path("/updateAssociatedPosition")
	@RolesAllowed("SUPER_USER")
	public Response updateAssociatedPosition(@Auth Person user, Position pos) {
		updateAssociatedPositionCommon(user, pos);
		return Response.ok().build();
	}

	private int updateAssociatedPositionCommon(Person user, Position pos) {
		AuthUtils.assertSuperUserForOrg(user, pos.getOrganizationUuid());

		final Position current = dao.getByUuid(pos.getUuid());
		if (current == null) { throw new WebApplicationException("Position not found", Status.NOT_FOUND); }

		// Run the diff and see if anything changed and update.
		if (pos.getAssociatedPositions() != null) {
			Utils.addRemoveElementsByUuid(current.loadAssociatedPositions(), pos.getAssociatedPositions(),
					newPosition -> {
						dao.associatePosition(DaoUtils.getUuid(newPosition), DaoUtils.getUuid(pos));
					},
					oldPositionUuid -> {
						dao.deletePositionAssociation(DaoUtils.getUuid(pos), oldPositionUuid);
					});
			AnetAuditLogger.log("Person {} associations changed to {} by {}", current, pos.getAssociatedPositions(), user);
			return 1;
		}
		return 0;
	}

	@GraphQLMutation(name="updateAssociatedPosition")
	@RolesAllowed("SUPER_USER")
	public Integer updateAssociatedPosition(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="position") Position pos) {
		// GraphQL mutations *have* to return something
		return updateAssociatedPositionCommon(DaoUtils.getUserFromContext(context), pos);
	}

	@POST
	@Timed
	@Path("/update")
	@RolesAllowed("SUPER_USER")
	public Response updatePosition(@Auth Person user, Position pos) {
		updatePositionCommon(user, pos);
		return Response.ok().build();
	}

	private int updatePositionCommon(Person user, Position pos) {
		assertCanUpdatePosition(user, pos);
		validatePosition(user, pos);

		final int numRows = dao.update(pos);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process position update", Status.NOT_FOUND);
		}

		if (pos.getPersonUuid() != null || PositionStatus.INACTIVE.equals(pos.getStatus())) {
			final Position current = dao.getByUuid(pos.getUuid());
			if (current != null) {
				//Run the diff and see if anything changed and update.
				if (pos.getPersonUuid() != null) {
					if (pos.getPersonUuid() == null) {
						//Intentionally remove the person
						dao.removePersonFromPosition(current.getUuid());
						AnetAuditLogger.log("Person {} removed from position {} by {}", pos.getPersonUuid(), current, user);
					} else if (!Objects.equals(pos.getPersonUuid(), current.getPersonUuid())) {
						dao.setPersonInPosition(pos.getPersonUuid(), pos.getUuid());
						AnetAuditLogger.log("Person {} put in position {} by {}", pos.getPersonUuid(), current, user);
					}
				}

				if (PositionStatus.INACTIVE.equals(pos.getStatus()) && current.getPersonUuid() != null) {
					//Remove this person from this position.
					AnetAuditLogger.log("Person {} removed from position {} by {} because the position is now inactive",
							current.getPersonUuid(), current, user);
					dao.removePersonFromPosition(current.getUuid());
				}
			}
		}

		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process position update", Status.NOT_FOUND);
		}
		AnetAuditLogger.log("Position {} updated by {}", pos, user);
		return numRows;
	}

	@GraphQLMutation(name="updatePosition")
	@RolesAllowed("SUPER_USER")
	public Integer updatePosition(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="position") Position pos) {
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return updatePositionCommon(DaoUtils.getUserFromContext(context), pos);
	}

	@GET
	@Timed
	@Path("/{uuid}/person")
	public Person getAdvisorInPosition(@PathParam("uuid") String positionUuid, @QueryParam("atTime") Long atTimeMillis) {
		//TODO: it doesn't seem to be used
		Instant dtg = (atTimeMillis == null) ? Instant.now() : Instant.ofEpochMilli(atTimeMillis);
		return dao.getPersonInPosition(positionUuid, dtg);
	}

	@POST
	@Timed
	@Path("/{uuid}/person")
	@RolesAllowed("SUPER_USER")
	public Response putPersonInPosition(@Auth Person user, @PathParam("uuid") String positionUuid, Person person) {
		putPersonInPositionCommon(user, positionUuid, person);
		return Response.ok().build();
	}

	private int putPersonInPositionCommon(Person user, String positionUuid, Person person) {
		final Position pos = dao.getByUuid(positionUuid);
		if (pos == null) { throw new WebApplicationException("Position not found", Status.NOT_FOUND); }
		AuthUtils.assertSuperUserForOrg(user, pos.getOrganizationUuid());

		int numRows = dao.setPersonInPosition(DaoUtils.getUuid(person), positionUuid);
		AnetAuditLogger.log("Person {} put in Position {} by {}", person, pos, user);
		return numRows;
	}

	@GraphQLMutation(name="putPersonInPosition")
	@RolesAllowed("SUPER_USER")
	public Integer putPersonInPosition(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="uuid") String positionUuid, @GraphQLArgument(name="person") Person person) {
		return putPersonInPositionCommon(DaoUtils.getUserFromContext(context), positionUuid, person);
	}

	@DELETE
	@Timed
	@Path("/{uuid}/person")
	@RolesAllowed("SUPER_USER")
	public Response deletePersonFromPosition(@Auth Person user, @PathParam("uuid") String positionUuid) {
		deletePersonFromPositionCommon(user, positionUuid);
		return Response.ok().build();
	}

	private int deletePersonFromPositionCommon(Person user, String positionUuid) {
		Position pos = dao.getByUuid(positionUuid);
		if (pos == null) { throw new WebApplicationException("Position not found", Status.NOT_FOUND); }
		AuthUtils.assertSuperUserForOrg(user, pos.getOrganizationUuid());

		final int numRows = dao.removePersonFromPosition(positionUuid);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process delete person from position", Status.NOT_FOUND);
		}
		AnetAuditLogger.log("Person removed from Position uuid#{} by {}", positionUuid, user);
		return numRows;
	}

	@GraphQLMutation(name="deletePersonFromPosition")
	public Integer deletePersonFromPosition(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="uuid") String positionUuid) {
		return deletePersonFromPositionCommon(DaoUtils.getUserFromContext(context), positionUuid);
	}

	@GET
	@Timed
	@Path("/{uuid}/associated")
	public AnetBeanList<Position> getAssociatedPositions(@PathParam("uuid") String positionUuid) {
		return new AnetBeanList<Position>(dao.getAssociatedPositions(positionUuid));
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
		
		AuthUtils.assertSuperUserForOrg(user, advisorPos.getOrganizationUuid());
		
		dao.associatePosition(positionUuid, DaoUtils.getUuid(b));
		
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
		AuthUtils.assertSuperUserForOrg(user, advisorPos.getOrganizationUuid());
		
		dao.deletePositionAssociation(positionUuid, associatedPositionUuid);
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
			return dao.getPositionHistory(engine.getContext(), positionUuid).get();
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
		deletePositionCommon(positionUuid);
		return Response.ok().build();
	}

	private int deletePositionCommon(String positionUuid) {
		final Position position = dao.getByUuid(positionUuid);
		if (position == null) { throw new WebApplicationException("Position not found", Status.NOT_FOUND); }
		
		//if there is a person in this position, reject
		if (position.getPersonUuid() != null) {
			throw new WebApplicationException("Cannot delete a position that current has a person", Status.BAD_REQUEST); 
		} 
		
		//if position is active, reject
		if (PositionStatus.ACTIVE.equals(position.getStatus())) {
			throw new WebApplicationException("Cannot delete an active position", Status.BAD_REQUEST);
		}
		
		//if this position has any history, we'll just delete it
		//if this position is in an approval chain, we just delete it
		//if this position is in an organization, just remove it
		//if this position has any associated positions, just remove them
		return dao.deletePosition(positionUuid);
	}

	@GraphQLMutation(name="deletePosition")
	public Integer deletePosition(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="uuid") String positionUuid) {
		return deletePositionCommon(positionUuid);
	}

}
