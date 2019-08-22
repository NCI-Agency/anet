package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.Objects;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class PositionResource {

  private final PositionDao dao;
  private final AnetObjectEngine engine;

  public PositionResource(AnetObjectEngine engine) {
    this.engine = engine;
    this.dao = engine.getPositionDao();
  }

  @GraphQLQuery(name = "position")
  public Position getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Position p = dao.getByUuid(uuid);
    if (p == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }
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
      throw new WebApplicationException("A Position must belong to an organization",
          Status.BAD_REQUEST);
    }
  }

  private void assertCanUpdatePosition(Person user, Position pos) {
    if (pos.getType() == PositionType.ADMINISTRATOR || pos.getType() == PositionType.SUPER_USER) {
      AuthUtils.assertAdministrator(user);
    }
    AuthUtils.assertSuperUserForOrg(user, pos.getOrganizationUuid(), true);
  }

  @GraphQLMutation(name = "createPosition")
  public Position createPosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "position") Position pos) {
    final Person user = DaoUtils.getUserFromContext(context);
    assertCanUpdatePosition(user, pos);
    validatePosition(user, pos);

    final Position position = dao.insert(pos);

    if (pos.getPersonUuid() != null) {
      dao.setPersonInPosition(pos.getPersonUuid(), position.getUuid());
    }

    AnetAuditLogger.log("Position {} created by {}", position, user);
    return position;
  }

  @GraphQLMutation(name = "updateAssociatedPosition")
  public Integer updateAssociatedPosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "position") Position pos) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertSuperUserForOrg(user, pos.getOrganizationUuid(), true);

    final Position current = dao.getByUuid(pos.getUuid());
    if (current == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }

    // Run the diff and see if anything changed and update.
    if (pos.getAssociatedPositions() != null) {
      Utils.addRemoveElementsByUuid(current.loadAssociatedPositions(engine.getContext()).join(),
          pos.getAssociatedPositions(), newPosition -> {
            dao.associatePosition(DaoUtils.getUuid(newPosition), DaoUtils.getUuid(pos));
          }, oldPositionUuid -> {
            dao.deletePositionAssociation(DaoUtils.getUuid(pos), oldPositionUuid);
          });
      AnetAuditLogger.log("Person {} associations changed to {} by {}", current,
          pos.getAssociatedPositions(), user);
      // GraphQL mutations *have* to return something
      return 1;
    }
    return 0;
  }

  @GraphQLMutation(name = "updatePosition")
  public Integer updatePosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "position") Position pos) {
    final Person user = DaoUtils.getUserFromContext(context);
    assertCanUpdatePosition(user, pos);
    validatePosition(user, pos);

    final int numRows = dao.update(pos);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process position update", Status.NOT_FOUND);
    }

    if (pos.getPersonUuid() != null || PositionStatus.INACTIVE.equals(pos.getStatus())) {
      final Position current = dao.getByUuid(pos.getUuid());
      if (current != null) {
        // Run the diff and see if anything changed and update.
        if (pos.getPersonUuid() != null) {
          if (pos.getPersonUuid() == null) {
            // Intentionally remove the person
            dao.removePersonFromPosition(current.getUuid());
            AnetAuditLogger.log("Person {} removed from position {} by {}", pos.getPersonUuid(),
                current, user);
          } else if (!Objects.equals(pos.getPersonUuid(), current.getPersonUuid())) {
            dao.setPersonInPosition(pos.getPersonUuid(), pos.getUuid());
            AnetAuditLogger.log("Person {} put in position {} by {}", pos.getPersonUuid(), current,
                user);
          }
        }

        if (PositionStatus.INACTIVE.equals(pos.getStatus()) && current.getPersonUuid() != null) {
          // Remove this person from this position.
          AnetAuditLogger.log(
              "Person {} removed from position {} by {} because the position is now inactive",
              current.getPersonUuid(), current, user);
          dao.removePersonFromPosition(current.getUuid());
        }
      }
    }

    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process position update", Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Position {} updated by {}", pos, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  @GraphQLMutation(name = "putPersonInPosition")
  public Integer putPersonInPosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String positionUuid,
      @GraphQLArgument(name = "person") Person person) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position pos = dao.getByUuid(positionUuid);
    if (pos == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }
    AuthUtils.assertSuperUserForOrg(user, pos.getOrganizationUuid(), true);

    int numRows = dao.setPersonInPosition(DaoUtils.getUuid(person), positionUuid);
    AnetAuditLogger.log("Person {} put in Position {} by {}", person, pos, user);
    return numRows;
  }

  @GraphQLMutation(name = "deletePersonFromPosition")
  public Integer deletePersonFromPosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String positionUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Position pos = dao.getByUuid(positionUuid);
    if (pos == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }
    AuthUtils.assertSuperUserForOrg(user, pos.getOrganizationUuid(), true);

    final int numRows = dao.removePersonFromPosition(positionUuid);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process delete person from position",
          Status.NOT_FOUND);
    }
    AnetAuditLogger.log("Person removed from Position uuid#{} by {}", positionUuid, user);
    return numRows;
  }

  @GraphQLQuery(name = "positionList")
  public AnetBeanList<Position> search(@GraphQLArgument(name = "query") PositionSearchQuery query) {
    return dao.search(query);
  }

  @GraphQLMutation(name = "deletePosition")
  public Integer deletePosition(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String positionUuid) {
    final Position position = dao.getByUuid(positionUuid);
    if (position == null) {
      throw new WebApplicationException("Position not found", Status.NOT_FOUND);
    }

    // if there is a person in this position, reject
    if (position.getPersonUuid() != null) {
      throw new WebApplicationException("Cannot delete a position that current has a person",
          Status.BAD_REQUEST);
    }

    // if position is active, reject
    if (PositionStatus.ACTIVE.equals(position.getStatus())) {
      throw new WebApplicationException("Cannot delete an active position", Status.BAD_REQUEST);
    }

    // if this position has any history, we'll just delete it
    // if this position is in an approval chain, we just delete it
    // if this position is in an organization, just remove it
    // if this position has any associated positions, just remove them
    return dao.delete(positionUuid);
  }

}
