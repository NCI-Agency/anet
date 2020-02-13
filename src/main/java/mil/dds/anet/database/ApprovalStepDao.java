package mil.dds.anet.database;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.ApprovalStepMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.mapper.MapMapper;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class ApprovalStepDao extends AnetBaseDao<ApprovalStep, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "approvalSteps";

  public CompletableFuture<List<ApprovalStep>> getPlanningByRelatedObjectUuid(
      Map<String, Object> context, String aoUuid) {
    return new ForeignKeyFetcher<ApprovalStep>().load(context,
        FkDataLoaderKey.RELATED_OBJECT_PLANNING_APPROVAL_STEPS, aoUuid);
  }

  public CompletableFuture<List<ApprovalStep>> getByRelatedObjectUuid(Map<String, Object> context,
      String aoUuid) {
    return new ForeignKeyFetcher<ApprovalStep>().load(context,
        FkDataLoaderKey.RELATED_OBJECT_APPROVAL_STEPS, aoUuid);
  }

  @Override
  public ApprovalStep getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<ApprovalStep> {
    private static final String sql =
        "/* batch.getApprovalStepsByUuids */ SELECT * from \"approvalSteps\" where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new ApprovalStepMapper());
    }
  }

  @Override
  public List<ApprovalStep> getByIds(List<String> uuids) {
    final IdBatcher<ApprovalStep> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  static class PositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String sql =
        "/* batch.getApproversForStep */ SELECT \"approvalStepUuid\", "
            + PositionDao.POSITIONS_FIELDS + " FROM approvers "
            + "LEFT JOIN positions ON \"positions\".\"uuid\" = approvers.\"positionUuid\" "
            + "WHERE \"approvalStepUuid\" IN ( <foreignKeys> )";

    public PositionsBatcher() {
      super(sql, "foreignKeys", new PositionMapper(), "approvalStepUuid");
    }
  }

  public List<List<Position>> getApprovers(List<String> foreignKeys) {
    final ForeignKeyBatcher<Position> approversBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(PositionsBatcher.class);
    return approversBatcher.getByForeignKeys(foreignKeys);
  }

  static class PlanningApprovalStepsBatcher extends ForeignKeyBatcher<ApprovalStep> {
    private static final String sql =
        "/* batch.getApprovalStepsByOrg */ SELECT * from \"approvalSteps\" WHERE \"relatedObjectUuid\" IN ( <foreignKeys> ) AND \"approvalSteps\".type = :type";
    private static final Map<String, Object> additionalParams = new HashMap<>();

    static {
      additionalParams.put("type", DaoUtils.getEnumId(ApprovalStepType.PLANNING_APPROVAL));
    }

    public PlanningApprovalStepsBatcher() {
      super(sql, "foreignKeys", new ApprovalStepMapper(), "relatedObjectUuid", additionalParams);
    }
  }

  static class ApprovalStepsBatcher extends ForeignKeyBatcher<ApprovalStep> {
    private static final String sql =
        "/* batch.getApprovalStepsByOrg */ SELECT * from \"approvalSteps\" WHERE \"relatedObjectUuid\" IN ( <foreignKeys> ) AND \"approvalSteps\".type = :type";
    private static final Map<String, Object> additionalParams = new HashMap<>();

    static {
      additionalParams.put("type", DaoUtils.getEnumId(ApprovalStepType.REPORT_APPROVAL));
    }

    public ApprovalStepsBatcher() {
      super(sql, "foreignKeys", new ApprovalStepMapper(), "relatedObjectUuid", additionalParams);
    }
  }

  public List<List<ApprovalStep>> getPlanningApprovalSteps(List<String> foreignKeys) {
    final ForeignKeyBatcher<ApprovalStep> organizationIdBatcher = AnetObjectEngine.getInstance()
        .getInjector().getInstance(PlanningApprovalStepsBatcher.class);
    return organizationIdBatcher.getByForeignKeys(foreignKeys);
  }

  public List<List<ApprovalStep>> getApprovalSteps(List<String> foreignKeys) {
    final ForeignKeyBatcher<ApprovalStep> organizationIdBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(ApprovalStepsBatcher.class);
    return organizationIdBatcher.getByForeignKeys(foreignKeys);
  }

  @Override
  public ApprovalStep insertInternal(ApprovalStep as) {
    getDbHandle().createUpdate(
        "/* insertApprovalStep */ INSERT into \"approvalSteps\" (uuid, name, \"nextStepUuid\", \"relatedObjectUuid\", type) "
            + "VALUES (:uuid, :name, :nextStepUuid, :relatedObjectUuid, :type)")
        .bindBean(as).bind("type", DaoUtils.getEnumId(as.getType())).execute();

    if (as.getApprovers() != null) {
      for (Position approver : as.getApprovers()) {
        if (approver.getUuid() == null) {
          throw new WebApplicationException("Invalid Position UUID of Null for Approver");
        }
        getDbHandle().createUpdate("/* insertApprovalStep.approvers */ "
            + "INSERT INTO approvers (\"positionUuid\", \"approvalStepUuid\") VALUES (:positionUuid, :stepUuid)")
            .bind("positionUuid", approver.getUuid()).bind("stepUuid", as.getUuid()).execute();
      }
    }

    return as;
  }

  /**
   * Inserts this approval step at the end of the organizations Approval Chain.
   */
  @InTransaction
  public ApprovalStep insertAtEnd(ApprovalStep as) {
    as = insert(as);

    // Add this Step to the current org list.
    getDbHandle()
        .createUpdate(
            "/* insertApprovalAtEnd */ UPDATE \"approvalSteps\" SET \"nextStepUuid\" = :uuid "
                + "WHERE \"relatedObjectUuid\" = :relatedObjectUuid "
                + "AND type = :type AND \"nextStepUuid\" IS NULL AND uuid != :uuid")
        .bindBean(as).bind("type", DaoUtils.getEnumId(as.getType())).execute();
    return as;
  }

  /**
   * Updates the name, nextStepUuid, and advisorOrgUuid on this Approval Step DOES NOT update the
   * list of members for this step.
   */
  @Override
  public int updateInternal(ApprovalStep as) {
    return getDbHandle()
        .createUpdate("/* updateApprovalStep */ UPDATE \"approvalSteps\" SET name = :name, "
            + "\"nextStepUuid\" = :nextStepUuid, \"relatedObjectUuid\" = :relatedObjectUuid "
            + "WHERE uuid = :uuid")
        .bindBean(as).execute();
  }

  /**
   * Delete the Approval Step with the given UUID. Will patch up the Approval Process list after the
   * removal.
   */
  @Override
  public int deleteInternal(String uuid) {
    // ensure there is nothing currently on this step
    if (isStepInUse(uuid)) {
      throw new WebApplicationException("Reports are currently pending at this step",
          Status.NOT_ACCEPTABLE);
    }

    // fix up the linked list.
    getDbHandle().createUpdate("/* deleteApproval.update */ UPDATE \"approvalSteps\" "
        + "SET \"nextStepUuid\" = (SELECT \"nextStepUuid\" from \"approvalSteps\" where uuid = :stepToDeleteUuid) "
        + "WHERE \"nextStepUuid\" = :stepToDeleteUuid").bind("stepToDeleteUuid", uuid).execute();

    // Remove all approvers from this step
    getDbHandle().execute(
        "/* deleteApproval.delete1 */ DELETE FROM approvers where \"approvalStepUuid\" = ?", uuid);

    // Update any approvals that happened at this step
    getDbHandle().execute(
        "/* deleteApproval.updateActions */ UPDATE \"reportActions\" SET \"approvalStepUuid\" = ? WHERE \"approvalStepUuid\" = ?",
        null, uuid);

    return getDbHandle()
        .execute("/* deleteApproval.delete2 */ DELETE FROM \"approvalSteps\" where uuid = ?", uuid);
  }

  /**
   * Check whether the Approval Step is being used by a report.
   */
  @InTransaction
  public boolean isStepInUse(String uuid) {
    List<Map<String, Object>> rs = getDbHandle().select(
        "/* deleteApproval.check */ SELECT count(*) AS ct FROM reports WHERE \"approvalStepUuid\" = ?",
        uuid).map(new MapMapper(false)).list();
    Map<String, Object> result = rs.get(0);
    int count = ((Number) result.get("ct")).intValue();
    return count != 0;
  }

  /**
   * Returns the previous step for a given stepUuid.
   */
  @InTransaction
  public ApprovalStep getStepByNextStepUuid(String uuid) {
    List<ApprovalStep> list = getDbHandle()
        .createQuery(
            "/* getNextStep */ SELECT * FROM \"approvalSteps\" WHERE \"nextStepUuid\" = :uuid")
        .bind("uuid", uuid).map(new ApprovalStepMapper()).list();
    if (list.size() == 0) {
      return null;
    }
    return list.get(0);
  }

  /**
   * Returns the list of positions that can approve for a given step.
   */
  public CompletableFuture<List<Position>> getApproversForStep(Map<String, Object> context,
      String approvalStepUuid) {
    return new ForeignKeyFetcher<Position>().load(context, FkDataLoaderKey.APPROVAL_STEP_APPROVERS,
        approvalStepUuid);
  }

  @InTransaction
  public int addApprover(ApprovalStep step, String positionUuid) {
    return getDbHandle().createUpdate(
        "/* addApprover */ INSERT INTO approvers (\"approvalStepUuid\", \"positionUuid\") VALUES (:stepUuid, :positionUuid)")
        .bind("stepUuid", step.getUuid()).bind("positionUuid", positionUuid).execute();
  }

  @InTransaction
  public int removeApprover(ApprovalStep step, String positionUuid) {
    return getDbHandle().createUpdate(
        "/* removeApprover */ DELETE FROM approvers WHERE \"approvalStepUuid\" = :stepUuid AND \"positionUuid\" = :positionUuid")
        .bind("stepUuid", step.getUuid()).bind("positionUuid", positionUuid).execute();
  }
}
