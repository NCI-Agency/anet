package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
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
import mil.dds.anet.utils.Utils;

@PermitAll
public class PersonResource {

  private final PersonDao dao;
  private final AnetConfiguration config;

  public PersonResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.dao = engine.getPersonDao();
    this.config = config;
  }

  /**
   * Returns all people objects in the ANET system. Does no filtering on role/status/etc.
   * 
   * @param pageNum 0 indexed page number of results to get. Defaults to 0.
   * @param pageSize Defaults to 100
   * @return List of People objects in the system
   */
  @GraphQLQuery(name = "people")
  public AnetBeanList<Person> getAll(
      @GraphQLArgument(name = "pageNum", defaultValue = "0") int pageNum,
      @GraphQLArgument(name = "pageSize", defaultValue = "100") int pageSize) {
    return dao.getAll(pageNum, pageSize);
  }

  /**
   * Returns a single person entry based on UUID.
   */
  @GraphQLQuery(name = "person")
  public Person getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Person p = dao.getByUuid(uuid);
    if (p == null) {
      throw new WebApplicationException("No such person", Status.NOT_FOUND);
    }
    return p;
  }

  @GraphQLMutation(name = "createPerson")
  @RolesAllowed("SUPER_USER")
  public Person createPerson(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "person") Person p) {
    Person user = DaoUtils.getUserFromContext(context);
    if (p.getRole().equals(Role.ADVISOR) && !Utils.isEmptyOrNull(p.getEmailAddress())) {
      validateEmail(p.getEmailAddress());
    }

    if (p.getPosition() != null && p.getPosition().getUuid() != null) {
      Position position =
          AnetObjectEngine.getInstance().getPositionDao().getByUuid(p.getPosition().getUuid());
      if (position == null) {
        throw new WebApplicationException("Position " + p.getPosition() + " does not exist",
            Status.BAD_REQUEST);
      }
      if (position.getType() == PositionType.ADMINISTRATOR) {
        AuthUtils.assertAdministrator(user);
      }
    }

    p.setBiography(Utils.sanitizeHtml(p.getBiography()));
    Person created = dao.insert(p);

    if (created.getPosition() != null) {
      AnetObjectEngine.getInstance().getPositionDao().setPersonInPosition(created.getUuid(),
          created.getPosition().getUuid());
    }

    AnetAuditLogger.log("Person {} created by {}", created, user);
    return created;
  }

  private boolean canUpdatePerson(Person editor, Person subject) {
    if (editor.getUuid().equals(subject.getUuid())) {
      return true;
    }
    Position editorPos = editor.getPosition();
    if (editorPos == null) {
      return false;
    }
    if (editorPos.getType() == PositionType.ADMINISTRATOR) {
      return true;
    }
    if (editorPos.getType() == PositionType.SUPER_USER) {
      // Super Users can edit any principal
      if (subject.getRole().equals(Role.PRINCIPAL)) {
        return true;
      }
      // Ensure that the editor is the Super User for the subject's organization.
      Position subjectPos = subject.loadPosition();
      if (subjectPos == null) {
        // Super Users can edit position-less people.
        return true;
      }
      return AuthUtils.isSuperUserForOrg(editor, subjectPos.getOrganizationUuid(), true);
    }
    return false;
  }

  @GraphQLMutation(name = "updatePerson")
  public Integer updatePerson(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "person") Person p) {
    Person user = DaoUtils.getUserFromContext(context);
    Person existing = dao.getByUuid(p.getUuid());
    if (canUpdatePerson(user, existing) == false) {
      throw new WebApplicationException("You do not have permissions to edit this person",
          Status.FORBIDDEN);
    }

    if (p.getRole().equals(Role.ADVISOR) && !Utils.isEmptyOrNull(p.getEmailAddress())) {
      validateEmail(p.getEmailAddress());
    }

    // Swap the position first in order to do the authentication check.
    if (p.getPosition() != null) {
      // Maybe update position?
      Position existingPos = existing.loadPosition();
      if (existingPos == null && p.getPosition().getUuid() != null) {
        // Update the position for this person.
        AuthUtils.assertSuperUser(user);
        AnetObjectEngine.getInstance().getPositionDao().setPersonInPosition(DaoUtils.getUuid(p),
            p.getPosition().getUuid());
        AnetAuditLogger.log("Person {} put in position {}  by {}", p, p.getPosition(), user);
      } else if (existingPos != null
          && existingPos.getUuid().equals(p.getPosition().getUuid()) == false) {
        // Update the position for this person.
        AuthUtils.assertSuperUser(user);
        AnetObjectEngine.getInstance().getPositionDao().setPersonInPosition(DaoUtils.getUuid(p),
            p.getPosition().getUuid());
        AnetAuditLogger.log("Person {} put in position {}  by {}", p, p.getPosition(), user);
      } else if (existingPos != null && p.getPosition().getUuid() == null) {
        // Remove this person from their position.
        AuthUtils.assertSuperUser(user);
        AnetObjectEngine.getInstance().getPositionDao()
            .removePersonFromPosition(existingPos.getUuid());
        AnetAuditLogger.log("Person {} removed from position   by {}", p, user);
      }
    }

    // If person changed to inactive, clear out the domainUsername
    if (PersonStatus.INACTIVE.equals(p.getStatus())
        && !PersonStatus.INACTIVE.equals(existing.getStatus())) {
      AnetAuditLogger.log(
          "Person {} domainUsername '{}' cleared by {} because they are now inactive", p,
          existing.getDomainUsername(), user);
      p.setDomainUsername(null);
    }

    // Automatically remove people from a position if they are inactive.
    if (PersonStatus.INACTIVE.equals(p.getStatus()) && p.getPosition() != null) {
      Position existingPos = existing.loadPosition();
      if (existingPos != null) {
        // A user can reset 'themselves' if the account was incorrect ("This is not me")
        if (!user.getUuid().equals(p.getUuid())) {
          // Otherwise needs to be at least super user
          AuthUtils.assertSuperUser(user);
        }
        AnetAuditLogger.log("Person {} removed from position by {} because they are now inactive",
            p, user);
        AnetObjectEngine.getInstance().getPositionDao()
            .removePersonFromPosition(existingPos.getUuid());
      }
    }

    p.setBiography(Utils.sanitizeHtml(p.getBiography()));
    final int numRows = dao.update(p);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process person update", Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Person {} updated by {}", p, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLQuery(name = "personList")
  public AnetBeanList<Person> search(@GraphQLArgument(name = "query") PersonSearchQuery query) {
    return dao.search(query);
  }

  /**
   * Returns the most recent people that this user listed as attendees in reports.
   * 
   * @param maxResults maximum number of results to return, defaults to 3
   */
  @GraphQLQuery(name = "personRecents")
  public AnetBeanList<Person> recents(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "maxResults", defaultValue = "3") int maxResults) {
    return new AnetBeanList<Person>(
        dao.getRecentPeople(DaoUtils.getUserFromContext(context), maxResults));
  }

  /**
   * Convenience method for API testing.
   */
  @GraphQLQuery(name = "me")
  public Person getCurrentUser(@GraphQLRootContext Map<String, Object> context) {
    return DaoUtils.getUserFromContext(context);
  }

  @GraphQLMutation(name = "mergePeople")
  @RolesAllowed("ADMINISTRATOR")
  public Integer mergePeople(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "winnerUuid") String winnerUuid,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "copyPosition", defaultValue = "false") boolean copyPosition) {
    Person user = DaoUtils.getUserFromContext(context);
    if (loserUuid.equals(winnerUuid)) {
      throw new WebApplicationException("You selected the same person twice",
          Status.NOT_ACCEPTABLE);
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
      throw new WebApplicationException("You can only merge people of the same role",
          Status.NOT_ACCEPTABLE);
    }
    if (winner.getPosition() != null && copyPosition) {
      throw new WebApplicationException("Winner already has a position", Status.NOT_ACCEPTABLE);
    }

    loser.loadPosition();
    winner.loadPosition();

    // Remove the loser from their position.
    Position loserPosition = loser.getPosition();
    if (loserPosition != null) {
      AnetObjectEngine.getInstance().getPositionDao()
          .removePersonFromPosition(loserPosition.getUuid());
    }

    int merged = dao.mergePeople(winner, loser);
    AnetAuditLogger.log("Person {} merged into WINNER: {}  by {}", loser, winner, user);

    if (loserPosition != null && copyPosition) {
      AnetObjectEngine.getInstance().getPositionDao().setPersonInPosition(winner.getUuid(),
          loserPosition.getUuid());
      AnetAuditLogger.log("Person {} put in position {} as part of merge by {}", winner,
          loserPosition, user);
    } else if (winner.getPosition() != null) {
      // We need to always re-put the winner back into their position
      // because when we removed the loser, and then updated the peoplePositions table
      // it now has a record saying the winner has no position.
      AnetObjectEngine.getInstance().getPositionDao().setPersonInPosition(winner.getUuid(),
          winner.getPosition().getUuid());
    }

    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return merged;
  }

  private void validateEmail(String emailInput) {
    final String[] splittedEmail = emailInput.split("@");
    if (splittedEmail.length < 2 || splittedEmail[1].length() == 0) {
      throw new WebApplicationException("Please provide a valid email address", Status.BAD_REQUEST);
    }

    @SuppressWarnings("unchecked")
    final List<String> whitelistDomainNames =
        ((List<String>) this.config.getDictionaryEntry("domainNames")).stream()
            .map(String::toLowerCase).collect(Collectors.toList());

    if (!Utils.isEmailWhitelisted(emailInput, whitelistDomainNames)) {
      throw new WebApplicationException(validateEmailErrorMessage(), Status.BAD_REQUEST);
    }
  }

  private String validateEmailErrorMessage() {
    final String supportEmailAddr = (String) this.config.getDictionaryEntry("SUPPORT_EMAIL_ADDR");
    final String messageBody =
        "Only valid email domain names are allowed. If your email domain name is not in the list, please contact the support team";
    final String errorMessage = Utils.isEmptyOrNull(supportEmailAddr) ? messageBody
        : String.format("%s at %s", messageBody, supportEmailAddr);
    return errorMessage;
  }
}
