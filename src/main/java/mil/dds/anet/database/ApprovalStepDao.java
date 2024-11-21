package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.ApprovalStepMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.MapMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ApprovalStepDao extends AnetBaseDao<ApprovalStep, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "approvalSteps";

  public ApprovalStepDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  public CompletableFuture<List<ApprovalStep>> getPlanningByRelatedObjectUuid(
      GraphQLContext context, String aoUuid) {
    return new ForeignKeyFetcher<ApprovalStep>().load(context,
        FkDataLoaderKey.RELATED_OBJECT_PLANNING_APPROVAL_STEPS, aoUuid);
  }

  public CompletableFuture<List<ApprovalStep>> getByRelatedObjectUuid(GraphQLContext context,
      String aoUuid) {
    return new ForeignKeyFetcher<ApprovalStep>().load(context,
        FkDataLoaderKey.RELATED_OBJECT_APPROVAL_STEPS, aoUuid);
  }

  @Override
  public ApprovalStep getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<ApprovalStep> {
    private static final String SQL =
        "/* batch.getApprovalStepsByUuids */ SELECT * from \"approvalSteps\" where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(ApprovalStepDao.this.databaseHandler, SQL, "uuids", new ApprovalStepMapper());
    }
  }

  @Override
  public List<ApprovalStep> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  class PositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String SQL =
        "/* batch.getApproversForStep */ SELECT \"approvalStepUuid\", "
            + PositionDao.POSITION_FIELDS + " FROM approvers "
            + "LEFT JOIN positions ON \"positions\".\"uuid\" = approvers.\"positionUuid\" "
            + "WHERE \"approvalStepUuid\" IN ( <foreignKeys> )";

    public PositionsBatcher() {
      super(ApprovalStepDao.this.databaseHandler, SQL, "foreignKeys", new PositionMapper(),
          "approvalStepUuid");
    }
  }

  public List<List<Position>> getApprovers(List<String> foreignKeys) {
    return new PositionsBatcher().getByForeignKeys(foreignKeys);
  }

  class PlanningApprovalStepsBatcher extends ForeignKeyBatcher<ApprovalStep> {
    private static final String SQL =
        "/* batch.getPlanningApprovalStepsByRelatedObject */ SELECT * from \"approvalSteps\""
            + " WHERE \"relatedObjectUuid\" IN ( <foreignKeys> ) AND \"approvalSteps\".type = :type";
    private static final Map<String, Object> additionalParams = new HashMap<>();

    static {
      additionalParams.put("type", DaoUtils.getEnumId(ApprovalStepType.PLANNING_APPROVAL));
    }

    public PlanningApprovalStepsBatcher() {
      super(ApprovalStepDao.this.databaseHandler, SQL, "foreignKeys", new ApprovalStepMapper(),
          "relatedObjectUuid", additionalParams);
    }
  }

  class ApprovalStepsBatcher extends ForeignKeyBatcher<ApprovalStep> {
    private static final String SQL =
        "/* batch.getApprovalStepsByRelatedObject */ SELECT * from \"approvalSteps\""
            + " WHERE \"relatedObjectUuid\" IN ( <foreignKeys> ) AND \"approvalSteps\".type = :type";
    private static final Map<String, Object> additionalParams = new HashMap<>();

    static {
      additionalParams.put("type", DaoUtils.getEnumId(ApprovalStepType.REPORT_APPROVAL));
    }

    public ApprovalStepsBatcher() {
      super(ApprovalStepDao.this.databaseHandler, SQL, "foreignKeys", new ApprovalStepMapper(),
          "relatedObjectUuid", additionalParams);
    }
  }

  public List<List<ApprovalStep>> getPlanningApprovalSteps(List<String> foreignKeys) {
    return new PlanningApprovalStepsBatcher().getByForeignKeys(foreignKeys);
  }

  public List<List<ApprovalStep>> getApprovalSteps(List<String> foreignKeys) {
    return new ApprovalStepsBatcher().getByForeignKeys(foreignKeys);
  }

  @Override
  public ApprovalStep insertInternal(ApprovalStep as) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate("/* insertApprovalStep */ INSERT into \"approvalSteps\" "
          + "(uuid, name, \"nextStepUuid\", \"relatedObjectUuid\", type, \"restrictedApproval\") "
          + "VALUES (:uuid, :name, :nextStepUuid, :relatedObjectUuid, :type, :restrictedApproval)")
          .bindBean(as).bind("type", DaoUtils.getEnumId(as.getType())).execute();

      if (as.getApprovers() != null) {
        for (Position approver : as.getApprovers()) {
          if (approver.getUuid() == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Invalid Position UUID of Null for Approver");
          }
          handle.createUpdate("/* insertApprovalStep.approvers */ "
              + "INSERT INTO approvers (\"positionUuid\", \"approvalStepUuid\") VALUES (:positionUuid, :stepUuid)")
              .bind("positionUuid", approver.getUuid()).bind("stepUuid", as.getUuid()).execute();
        }
      }

      return as;
    } finally {
      closeDbHandle(handle);
    }
  }

  /**
   * Inserts this approval step at the end of the organizations Approval Chain.
   */
  @Transactional
  public ApprovalStep insertAtEnd(ApprovalStep as) {
    final Handle handle = getDbHandle();
    try {
      final ApprovalStep newAs = insert(as);

      // Add this Step to the current org list.
      handle
          .createUpdate(
              "/* insertApprovalAtEnd */ UPDATE \"approvalSteps\" SET \"nextStepUuid\" = :uuid "
                  + "WHERE \"relatedObjectUuid\" = :relatedObjectUuid "
                  + "AND type = :type AND \"nextStepUuid\" IS NULL AND uuid != :uuid")
          .bindBean(newAs).bind("type", DaoUtils.getEnumId(as.getType())).execute();
      return as;
    } finally {
      closeDbHandle(handle);
    }
  }

  /**
   * Updates the name, nextStepUuid, and advisorOrgUuid on this Approval Step DOES NOT update the
   * list of members for this step.
   */
  @Override
  public int updateInternal(ApprovalStep as) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* updateApprovalStep */ UPDATE \"approvalSteps\" SET name = :name, "
              + "\"nextStepUuid\" = :nextStepUuid, \"relatedObjectUuid\" = :relatedObjectUuid, "
              + "\"restrictedApproval\" = :restrictedApproval WHERE uuid = :uuid")
          .bindBean(as).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  /**
   * Delete the Approval Step with the given UUID. Will patch up the Approval Process list after the
   * removal.
   */
  @Override
  public int deleteInternal(String uuid) {
    final Handle handle = getDbHandle();
    try {
      // ensure there is nothing currently on this step
      if (isStepInUse(uuid)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
            "Reports are currently pending at this step");
      }

      // fix up the linked list.
      handle.createUpdate("/* deleteApproval.update */ UPDATE \"approvalSteps\" "
          + "SET \"nextStepUuid\" = (SELECT \"nextStepUuid\" from \"approvalSteps\" where uuid = :stepToDeleteUuid) "
          + "WHERE \"nextStepUuid\" = :stepToDeleteUuid").bind("stepToDeleteUuid", uuid).execute();

      // Remove all approvers from this step
      handle.execute(
          "/* deleteApproval.delete1 */ DELETE FROM approvers where \"approvalStepUuid\" = ?",
          uuid);

      // Update any approvals that happened at this step
      handle.execute(
          "/* deleteApproval.updateActions */ UPDATE \"reportActions\" SET \"approvalStepUuid\" = ? WHERE \"approvalStepUuid\" = ?",
          null, uuid);

      return handle.execute(
          "/* deleteApproval.delete2 */ DELETE FROM \"approvalSteps\" where uuid = ?", uuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  /**
   * Check whether the Approval Step is being used by a report.
   */
  @Transactional
  public boolean isStepInUse(String uuid) {
    final Handle handle = getDbHandle();
    try {
      final List<Map<String, Object>> rs = handle.select(
          "/* deleteApproval.check */ SELECT count(*) AS ct FROM reports WHERE \"approvalStepUuid\" = ?",
          uuid).map(new MapMapper()).list();
      final Map<String, Object> result = rs.get(0);
      final int count = ((Number) result.get("ct")).intValue();
      return count != 0;
    } finally {
      closeDbHandle(handle);
    }
  }

  /**
   * Returns the previous step for a given stepUuid.
   */
  @Transactional
  public ApprovalStep getStepByNextStepUuid(String uuid) {
    final Handle handle = getDbHandle();
    try {
      List<ApprovalStep> list = handle
          .createQuery(
              "/* getNextStep */ SELECT * FROM \"approvalSteps\" WHERE \"nextStepUuid\" = :uuid")
          .bind("uuid", uuid).map(new ApprovalStepMapper()).list();
      if (list.isEmpty()) {
        return null;
      }
      return list.get(0);
    } finally {
      closeDbHandle(handle);
    }
  }

  /**
   * Returns the list of positions that can approve for a given step.
   */
  public CompletableFuture<List<Position>> getApproversForStep(GraphQLContext context,
      String approvalStepUuid) {
    return new ForeignKeyFetcher<Position>().load(context, FkDataLoaderKey.APPROVAL_STEP_APPROVERS,
        approvalStepUuid);
  }

  @Transactional
  public int addApprover(ApprovalStep step, String positionUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* addApprover */ INSERT INTO approvers (\"approvalStepUuid\", \"positionUuid\") VALUES (:stepUuid, :positionUuid)")
          .bind("stepUuid", step.getUuid()).bind("positionUuid", positionUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removeApprover(ApprovalStep step, String positionUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* removeApprover */ DELETE FROM approvers WHERE \"approvalStepUuid\" = :stepUuid AND \"positionUuid\" = :positionUuid")
          .bind("stepUuid", step.getUuid()).bind("positionUuid", positionUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<ApprovalStep>> getPlanningApprovalStepsForRelatedObject(
      GraphQLContext context, String aoUuid) {
    return getPlanningByRelatedObjectUuid(context, aoUuid).thenApply(this::orderSteps);
  }

  public CompletableFuture<List<ApprovalStep>> getApprovalStepsForRelatedObject(
      GraphQLContext context, String aoUuid) {
    return getByRelatedObjectUuid(context, aoUuid).thenApply(this::orderSteps);
  }

  private List<ApprovalStep> orderSteps(List<ApprovalStep> unordered) {
    int numSteps = unordered.size();
    LinkedList<ApprovalStep> ordered = new LinkedList<ApprovalStep>();
    String nextStep = null;
    for (int i = 0; i < numSteps; i++) {
      for (ApprovalStep as : unordered) {
        if (Objects.equals(as.getNextStepUuid(), nextStep)) {
          ordered.addFirst(as);
          nextStep = as.getUuid();
          break;
        }
      }
    }
    return ordered;
  }
}
