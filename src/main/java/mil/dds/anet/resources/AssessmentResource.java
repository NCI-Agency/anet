package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.AssessmentDao;
import mil.dds.anet.database.AssessmentDao.UpdateType;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AssessmentResource {

  private final AnetObjectEngine engine;
  private final AuditTrailDao auditTrailDao;
  private final AssessmentDao dao;

  public AssessmentResource(AnetObjectEngine engine, AuditTrailDao auditTrailDao,
      AssessmentDao dao) {
    this.engine = engine;
    this.auditTrailDao = auditTrailDao;
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

    // Log the change
    final String auditTrailUuid = auditTrailDao.logCreate(user, AssessmentDao.TABLE_NAME, a, null,
        String.format("linked to %s", a.getAssessmentRelatedObjects()));
    // Update any subscriptions
    dao.updateSubscriptions(a, auditTrailUuid, false);

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
      @GraphQLArgument(name = "assessment") Assessment a,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Assessment original = dao.getByUuid(DaoUtils.getUuid(a));
    if (original == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found");
    }
    checkAssessmentPermission(user, a, UpdateType.UPDATE);
    DaoUtils.assertObjectIsFresh(a, original, force);

    ResourceUtils.checkAndFixAssessment(a);
    final int numRows = dao.update(a);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process assessment update");
    }

    // Log the change
    final String auditTrailUuid = auditTrailDao.logUpdate(user, AssessmentDao.TABLE_NAME, a, null,
        String.format("linked to %s", a.getAssessmentRelatedObjects()));
    // Update any subscriptions
    dao.updateSubscriptions(a, auditTrailUuid, false);

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
    a.loadAssessmentRelatedObjects(engine.getContext()).join();
    final int numRows = dao.delete(assessmentUuid);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process assessment delete");
    }

    // Log the change
    final String auditTrailUuid = auditTrailDao.logDelete(user, AssessmentDao.TABLE_NAME, a, null,
        String.format("unlinked from %s", a.getAssessmentRelatedObjects()));
    // Update any subscriptions
    dao.updateSubscriptions(a, auditTrailUuid, true);

    // GraphQL mutations *have* to return something, so we return the number of deleted rows
    return numRows;
  }

}
