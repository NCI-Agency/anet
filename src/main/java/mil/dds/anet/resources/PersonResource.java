package mil.dds.anet.resources;

import java.util.List;
import java.util.Map;
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
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;

@Path("/old-api/people")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class PersonResource {
	
	private PersonDao dao;
	private AnetConfiguration config;
	
	public PersonResource(AnetObjectEngine engine, AnetConfiguration config) {
		this.dao = engine.getPersonDao();
		this.config = config;
	}
	
	/**
	 * Returns all people objects in the ANET system. Does no filtering on role/status/etc. 
	 * @param pageNum 0 indexed page number of results to get. Defaults to 0. 
	 * @param pageSize Defaults to 100
	 * @return List of People objects in the system
	 */
	@GET
	@Timed
	@GraphQLQuery(name="people")
	@Path("/")
	public AnetBeanList<Person> getAll(@DefaultValue("0") @QueryParam("pageNum") @GraphQLArgument(name="pageNum", defaultValue="0") int pageNum,
			@DefaultValue("100") @QueryParam("pageSize") @GraphQLArgument(name="pageSize", defaultValue="100")  int pageSize) {
		return dao.getAll(pageNum, pageSize);
	}
	
	/**
	 * Returns a single person entry based on UUID.
	 */
	@GET
	@Timed
	@Path("/{uuid}")
	@GraphQLQuery(name="person")
	public Person getByUuid(@PathParam("uuid") @GraphQLArgument(name="uuid") String uuid) {
		Person p = dao.getByUuid(uuid);
		if (p == null) { throw new WebApplicationException("No such person", Status.NOT_FOUND); }
		return p;
	}
	

	/**
	 * Creates a new {@link Person} object as supplied in http entity. 
	 * Optional: 
	 * - position: If you provide a Position UUID number in the Position object,
	 *     this person will be associated with that position (Potentially removing anybody currently in the position)
	 * @return the same Person object with the UUID field filled in.
	 */
	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("SUPER_USER")
	public Person createPerson(@Auth Person user, Person p) {
		return createPersonCommon(user, p);
	}

	private Person createPersonCommon(Person user, Person p) {
		if (p.getRole().equals(Role.ADVISOR) && !Utils.isEmptyOrNull(p.getEmailAddress())) {
			validateEmail(p.getEmailAddress());
		}

		if (p.getPosition() != null && p.getPosition().getUuid() != null) {
			Position position = AnetObjectEngine.getInstance().getPositionDao().getByUuid(p.getPosition().getUuid());
			if (position == null) { 
				throw new WebApplicationException("Position " + p.getPosition() + " does not exist", Status.BAD_REQUEST);
			}
			if (position.getType() == PositionType.ADMINISTRATOR) { AuthUtils.assertAdministrator(user); } 
		}
		
		p.setBiography(Utils.sanitizeHtml(p.getBiography()));
		Person created = dao.insert(p);
		
		if (created.getPosition() != null) { 
			AnetObjectEngine.getInstance().getPositionDao().setPersonInPosition(created.getUuid(), created.getPosition().getUuid());
		}
		
		AnetAuditLogger.log("Person {} created by {}", created, user);
		return created;
	}

	@GraphQLMutation(name="createPerson")
	@RolesAllowed("SUPER_USER")
	public Person createPerson(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="person") Person p) {
		return createPersonCommon(DaoUtils.getUserFromContext(context), p);
	}

	private boolean canUpdatePerson(Person editor, Person subject) {
		if (editor.getUuid().equals(subject.getUuid())) {
			return true;
		}
		Position editorPos = editor.getPosition();
		if (editorPos == null) { return false; }
		if (editorPos.getType() == PositionType.ADMINISTRATOR) { return true; }
		if (editorPos.getType() == PositionType.SUPER_USER) {
			//Super Users can edit any principal
			if (subject.getRole().equals(Role.PRINCIPAL)) { return true; }
			//Ensure that the editor is the Super User for the subject's organization.
			Position subjectPos = subject.loadPosition();
			if (subjectPos == null) {
				//Super Users can edit position-less people.
				return true;
			}
			return AuthUtils.isSuperUserForOrg(editor, subjectPos.getOrganizationUuid());
		}
		return false;
	}
	/**
	 * Will update a person record with the {@link Person} entity provided in the http entity. 
	 * All fields will be updated, so you must pass the complete Person object.
	 * Optional:
	 *  - position: If you provide a position on the Person, then this person will be updated to 
	 *      be in that position (unless they already are in that position).  If position is an empty 
	 *      object, the person will be REMOVED from their position.  
	 * Must be 
	 *   1) The person editing yourself
	 *   2) A super user for the person's organization
	 *   3) An administrator 
	 * @return HTTP/200 on success, HTTP/404 on any error. 
	 */
	@POST
	@Timed
	@Path("/update")
	public Response updatePerson(@Auth Person user, Person p) {
		updatePersonCommon(user, p);
		return Response.ok().build();
	}

	private int updatePersonCommon(Person user, Person p) {
		Person existing = dao.getByUuid(p.getUuid());
		if (canUpdatePerson(user, existing) == false) {
			throw new WebApplicationException("You do not have permissions to edit this person", Status.FORBIDDEN);
		}

		if (p.getRole().equals(Role.ADVISOR) && !Utils.isEmptyOrNull(p.getEmailAddress())) {
			validateEmail(p.getEmailAddress());
		}
		
		//Swap the position first in order to do the authentication check.
		if (p.getPosition() != null) {
			//Maybe update position? 
			Position existingPos = existing.loadPosition();
			if (existingPos == null && p.getPosition().getUuid() != null) {
				//Update the position for this person.
				AuthUtils.assertSuperUser(user);
				AnetObjectEngine.getInstance().getPositionDao().setPersonInPosition(DaoUtils.getUuid(p), p.getPosition().getUuid());
				AnetAuditLogger.log("Person {} put in position {}  by {}", p, p.getPosition(), user);
			} else if (existingPos != null && existingPos.getUuid().equals(p.getPosition().getUuid()) == false) {
				//Update the position for this person.
				AuthUtils.assertSuperUser(user);
				AnetObjectEngine.getInstance().getPositionDao().setPersonInPosition(DaoUtils.getUuid(p), p.getPosition().getUuid());
				AnetAuditLogger.log("Person {} put in position {}  by {}", p, p.getPosition(), user);
			} else if (existingPos != null && p.getPosition().getUuid() == null) {
				//Remove this person from their position.
				AuthUtils.assertSuperUser(user);
				AnetObjectEngine.getInstance().getPositionDao().removePersonFromPosition(existingPos.getUuid());
				AnetAuditLogger.log("Person {} removed from position   by {}", p, user);
			}
		}

		// If person changed to inactive, clear out the domainUsername
		if (PersonStatus.INACTIVE.equals(p.getStatus()) && !PersonStatus.INACTIVE.equals(existing.getStatus())) {
			AnetAuditLogger.log("Person {} domainUsername '{}' cleared by {} because they are now inactive", p, existing.getDomainUsername(), user);
			p.setDomainUsername(null);
		}

		//Automatically remove people from a position if they are inactive.
		if (PersonStatus.INACTIVE.equals(p.getStatus()) && p.getPosition() != null) {
			Position existingPos = existing.loadPosition();
			if (existingPos != null) { 
				// A user can reset 'themselves' if the account was incorrect ("This is not me")
				if (!user.getUuid().equals(p.getUuid())) {
					// Otherwise needs to be at least super user
					AuthUtils.assertSuperUser(user);
				}
				AnetAuditLogger.log("Person {} removed from position by {} because they are now inactive", p, user);	
				AnetObjectEngine.getInstance().getPositionDao().removePersonFromPosition(existingPos.getUuid());
			}
		}
		
		p.setBiography(Utils.sanitizeHtml(p.getBiography()));
		final int numRows = dao.update(p);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process person update", Status.NOT_FOUND);
		}
		AnetAuditLogger.log("Person {} updated by {}", p, user);
		return numRows;
	}

	@GraphQLMutation(name="updatePerson")
	public Integer updatePerson(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="person") Person p) {
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return updatePersonCommon(DaoUtils.getUserFromContext(context), p);
	}

	/**
	 * Searches people in the ANET database.
	 * @param query the search term
	 * @return a list of people objects
	 */
	@POST
	@Timed
	@GraphQLQuery(name="personList")
	@Path("/search")
	public AnetBeanList<Person> search(@GraphQLArgument(name="query") PersonSearchQuery query) {
		return dao.search(query);
	}
	
	@GET
	@Timed
	@Path("/search")
	public AnetBeanList<Person> search(@Context HttpServletRequest request) {
		try { 
			return search(ResponseUtils.convertParamsToBean(request, PersonSearchQuery.class));
		} catch (IllegalArgumentException e) { 
			throw new WebApplicationException(e.getMessage(), e.getCause(), Status.BAD_REQUEST);
		}
	}
	
	/**
	 * Fetches the current position that a given person  is in. 
	 * @param uuid the UUID of the person whose position you want to lookup
	 */
	@GET
	@Timed
	@Path("/{uuid}/position")
	public Position getPositionForPerson(@PathParam("uuid") String uuid) {
		//TODO: it doesn't seem to be used
		return AnetObjectEngine.getInstance().getPositionDao().getCurrentPositionForPerson(uuid);
	}
	
	/** 
	 * Returns the most recent people that this user listed as attendees in reports. 
	 * @param maxResults maximum number of results to return, defaults to 3
	 */
	@GET
	@Timed
	@GraphQLQuery(name="personRecents")
	@Path("/recents")
	public AnetBeanList<Person> recents(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="_") @Auth Person user,
			@DefaultValue("3") @QueryParam("maxResults") @GraphQLArgument(name="maxResults", defaultValue="3") int maxResults) {
		user = DaoUtils.getUser(context, user);
		return new AnetBeanList<Person>(dao.getRecentPeople(user, maxResults));
	}
	
	/**
	 * Convenience method for API testing. 
	 */
	@GET
	@Timed
	@GraphQLQuery(name="me")
	@Path("/me")
	public Person getCurrentUser(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="_") @Auth Person user) {
		user = DaoUtils.getUser(context, user);
		return user;
	}

	@POST
	@Timed
	@Path("/merge")
	@RolesAllowed("ADMINISTRATOR")
	public Response mergePeople(@Auth Person user,
			@QueryParam("winner") String winnerUuid,
			@QueryParam("loser") String loserUuid,
			@QueryParam("copyPosition") @DefaultValue("false") Boolean copyPosition) {
		mergePeopleCommon(user, winnerUuid, loserUuid, copyPosition);
		return Response.ok().build();
	}

	private int mergePeopleCommon(Person user, String winnerUuid, String loserUuid, Boolean copyPosition) {
		if (loserUuid.equals(winnerUuid)) {
			throw new WebApplicationException("You selected the same person twice", Status.NOT_ACCEPTABLE);
		}
		Person winner = dao.getByUuid(winnerUuid);
		if (winner == null) {
			throw new WebApplicationException("Winner not found", Status.NOT_FOUND);
		}
		Person loser = dao.getByUuid(loserUuid);
		if (loser == null) {
			throw new WebApplicationException("Loser not found", Status.NOT_FOUND);
		}
		if (winner.getRole().equals(loser.getRole()) == false) {
			throw new WebApplicationException("You can only merge people of the same role", Status.NOT_ACCEPTABLE);
		}
		if (winner.getPosition() != null && copyPosition) {
			throw new WebApplicationException("Winner already has a position", Status.NOT_ACCEPTABLE);
		}

		loser.loadPosition();
		winner.loadPosition();

		//Remove the loser from their position.
		Position loserPosition = loser.getPosition();
		if (loserPosition != null) { 
			AnetObjectEngine.getInstance().getPositionDao()
				.removePersonFromPosition(loserPosition.getUuid());
		}

		int merged = dao.mergePeople(winner, loser);
		AnetAuditLogger.log("Person {} merged into WINNER: {}  by {}", loser, winner, user);
		
		if (loserPosition != null && copyPosition) { 
			AnetObjectEngine.getInstance().getPositionDao()
				.setPersonInPosition(winner.getUuid(), loserPosition.getUuid());
			AnetAuditLogger.log("Person {} put in position {} as part of merge by {}", winner, loserPosition, user);
		} else if (winner.getPosition() != null) { 
			//We need to always re-put the winner back into their position
			// because when we removed the loser, and then updated the peoplePositions table
			// it now has a record saying the winner has no position. 
			AnetObjectEngine.getInstance().getPositionDao()
				.setPersonInPosition(winner.getUuid(), winner.getPosition().getUuid());
		}
		
		return merged;
	}

	@GraphQLMutation(name="mergePeople")
	@RolesAllowed("ADMINISTRATOR")
	public Integer mergePeople(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="winnerUuid") String winnerUuid,
			@GraphQLArgument(name="loserUuid") String loserUuid,
			@GraphQLArgument(name="copyPosition", defaultValue="false") boolean copyPosition) {
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return mergePeopleCommon(DaoUtils.getUserFromContext(context), winnerUuid, loserUuid, copyPosition);
	}

	private void validateEmail(String emailInput) {
		if (Utils.isEmptyOrNull(emailInput)) {
			throw new WebApplicationException(validateEmailErrorMessage(), Status.BAD_REQUEST);
		}

		final String WILDCARD = "*";
		final String[] splittedEmail = emailInput.split("@");
		if (splittedEmail.length < 2 || splittedEmail[1].length() == 0) {
			throw new WebApplicationException("Please provide a valid email address", Status.BAD_REQUEST);
		}
		final String from = splittedEmail[0].trim();
		final String domainName = splittedEmail[1].toLowerCase();

		@SuppressWarnings("unchecked")
		final List<String> whitelistDomainNames = ((List<String>)this.config.getDictionaryEntry("domainNames"))
			.stream().map(String::toLowerCase).collect(Collectors.toList());

		final List<String> wildcardDomainNames = whitelistDomainNames.stream()
			.filter(domain -> String.valueOf(domain.charAt(0)).equals(WILDCARD))
			.collect((Collectors.toList()));

		final Boolean isWhitelistedEmail = from.length() > 0 && whitelistDomainNames.indexOf(domainName) >= 0;
		final Boolean isValidWildcardDomain = wildcardDomainNames.stream()
			.anyMatch(wildcardDomain ->
				domainName.charAt(0) != '.' &&
				domainName.endsWith(wildcardDomain.substring(1)));

		if (!isWhitelistedEmail && !isValidWildcardDomain) {
			throw new WebApplicationException(validateEmailErrorMessage(), Status.BAD_REQUEST);
		}
	}

	private String validateEmailErrorMessage() {
		final String supportEmailAddr = (String)this.config.getDictionaryEntry("SUPPORT_EMAIL_ADDR");
		final String messageBody = "Only valid email domain names are allowed. If your email domain name is not in the list, please contact the support team";
		final String errorMessage = Utils.isEmptyOrNull(supportEmailAddr) ? messageBody : String.format("%s at %s", messageBody, supportEmailAddr);
		return errorMessage;
	}
}
