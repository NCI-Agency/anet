package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.AssessmentDao;
import mil.dds.anet.database.AssessmentDao.UpdateType;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class AssessmentResource {

  private final AssessmentDao dao;

  public AssessmentResource(AssessmentDao dao) {
    this.dao = dao;
  }

  @GraphQLMutation(name = "createAssessment")
  public Assessment createAssessment(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "assessment") Assessment a) {
    final Person user = DaoUtils.getUserFromContext(context);
    a.setAuthorUuid(DaoUtils.getUuid(user));
    checkAssessmentPermission(user, a, UpdateType.CREATE);
    ResourceUtils.checkAndFixAssessment(a);
    a = dao.insert(a);
    AnetAuditLogger.log("Assessment {} created by {}", a, user);
    return a;
  }

  private void checkAssessmentPermission(final Person user, final Assessment assessment,
      final UpdateType updateType) {
    if (!dao.hasAssessmentPermission(user, DaoUtils.getAuthorizationGroupUuids(user), assessment,
        updateType)) {
      // Don't provide too much information, just say it is "denied"
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied");
    }
  }

  @GraphQLMutation(name = "updateAssessment")
  public Assessment updateAssessment(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "assessment") Assessment a) {
    final Assessment original = dao.getByUuid(DaoUtils.getUuid(a));
    if (original == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found");
    }
    final Person user = DaoUtils.getUserFromContext(context);
    checkAssessmentPermission(user, a, UpdateType.UPDATE);
    ResourceUtils.checkAndFixAssessment(a);
    final int numRows = dao.update(a);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process assessment update");
    }
    AnetAuditLogger.log("Assessment {} updated by {}", a, user);
    // Return the updated assessment since we want to use the updatedAt field
    return a;
  }

  @GraphQLMutation(name = "deleteAssessment")
  public Integer deleteAssessment(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String assessmentUuid) {
    final Assessment a = dao.getByUuid(assessmentUuid);
    if (a == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found");
    }
    final Person user = DaoUtils.getUserFromContext(context);
    checkAssessmentPermission(user, a, UpdateType.DELETE);
    final int numRows = dao.delete(assessmentUuid);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process assessment delete");
    }
    AnetAuditLogger.log("Assessment {} deleted by {}", a, user);
    // GraphQL mutations *have* to return something, so we return the number of
    // deleted rows
    return numRows;
  }

}
