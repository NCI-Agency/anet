package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.jdbi.v3.core.mapper.MapMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.ApprovalStepMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.views.ForeignKeyFetcher;

public class ApprovalStepDao extends AnetBaseDao<ApprovalStep> {

	private final IdBatcher<ApprovalStep> idBatcher;
	private final ForeignKeyBatcher<Position> approversBatcher;
	private final ForeignKeyBatcher<ApprovalStep> organizationIdBatcher;

	public ApprovalStepDao(AnetObjectEngine engine) {
		super(engine, "ApprovalSteps", "approvalSteps", "*", null);
		final String idBatcherSql = "/* batch.getApprovalStepsByUuids */ SELECT * from \"approvalSteps\" where uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<ApprovalStep>(engine, idBatcherSql, "uuids", new ApprovalStepMapper());

		final String approversBatcherSql = "/* batch.getApproversForStep */ SELECT \"approvalStepUuid\", " + PositionDao.POSITIONS_FIELDS
				+ " FROM approvers "
				+ "LEFT JOIN positions ON \"positions\".\"uuid\" = approvers.\"positionUuid\" "
				+ "WHERE \"approvalStepUuid\" IN ( <foreignKeys> )";
		this.approversBatcher = new ForeignKeyBatcher<Position>(engine, approversBatcherSql, "foreignKeys", new PositionMapper(), "approvalStepUuid");

		final String organizationIdBatcherSql = "/* batch.getApprovalStepsByOrg */ SELECT * from \"approvalSteps\" WHERE \"advisorOrganizationUuid\" IN ( <foreignKeys> )";
		this.organizationIdBatcher = new ForeignKeyBatcher<ApprovalStep>(engine, organizationIdBatcherSql, "foreignKeys", new ApprovalStepMapper(), "advisorOrganizationUuid");
	}
	
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	public CompletableFuture<List<ApprovalStep>> getByAdvisorOrganizationUuid(Map<String, Object> context, String aoUuid) {
		return new ForeignKeyFetcher<ApprovalStep>()
				.load(context, "organization.approvalSteps", aoUuid);
	}

	@Override
	public ApprovalStep getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<ApprovalStep> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	public List<List<Position>> getApprovers(List<String> foreignKeys) {
		return approversBatcher.getByForeignKeys(foreignKeys);
	}

	public List<List<ApprovalStep>> getApprovalSteps(List<String> foreignKeys) {
		return organizationIdBatcher.getByForeignKeys(foreignKeys);
	}

	@Override
	public ApprovalStep insertInternal(ApprovalStep as) {
		engine.getDbHandle().createUpdate(
				"/* insertApprovalStep */ INSERT into \"approvalSteps\" (uuid, name, \"nextStepUuid\", \"advisorOrganizationUuid\") "
				+ "VALUES (:uuid, :name, :nextStepUuid, :advisorOrganizationUuid)")
			.bindBean(as)
			.execute();

		if (as.getApprovers() != null) {
			for (Position approver : as.getApprovers()) {
				if (approver.getUuid() == null) {
					throw new WebApplicationException("Invalid Position UUID of Null for Approver");
				}
				engine.getDbHandle().createUpdate("/* insertApprovalStep.approvers */ "
						+ "INSERT INTO approvers (\"positionUuid\", \"approvalStepUuid\") VALUES (:positionUuid, :stepUuid)")
					.bind("positionUuid", approver.getUuid())
					.bind("stepUuid", as.getUuid())
					.execute();
			}
		}
		
		return as;
	}
	
	/**
	 * Inserts this approval step at the end of the organizations Approval Chain.
	 */
	public ApprovalStep insertAtEnd(ApprovalStep as) {
		as = insert(as);
		
		//Add this Step to the current org list. 
		engine.getDbHandle().createUpdate("/* insertApprovalAtEnd */ UPDATE \"approvalSteps\" SET \"nextStepUuid\" = :uuid "
				+ "WHERE \"advisorOrganizationUuid\" = :advisorOrganizationUuid "
				+ "AND \"nextStepUuid\" IS NULL AND uuid != :uuid")
			.bindBean(as)
			.execute();
		return as;
	}
	
	/**
	 * Updates the name, nextStepUuid, and advisorOrgUuid on this Approval Step
	 * DOES NOT update the list of members for this step. 
	 */
	@Override
	public int updateInternal(ApprovalStep as) {
		return engine.getDbHandle().createUpdate("/* updateApprovalStep */ UPDATE \"approvalSteps\" SET name = :name, "
				+ "\"nextStepUuid\" = :nextStepUuid, \"advisorOrganizationUuid\" = :advisorOrganizationUuid "
				+ "WHERE uuid = :uuid")
			.bindBean(as)
			.execute();
	}

	@Override
	public int deleteInternal(String uuid) {
		throw new UnsupportedOperationException();
	}

	/**
	 * Delete the Approval Step with the given UUID.
	 * Will patch up the Approval Process list after the removal. 
	 */
	public boolean deleteStep(String uuid) {
		//ensure there is nothing currently on this step
		if (isStepInUse(uuid)) {
			throw new WebApplicationException("Reports are currently pending at this step", Status.NOT_ACCEPTABLE);
		}

		//fix up the linked list.
		engine.getDbHandle().createUpdate("/* deleteApproval.update */ UPDATE \"approvalSteps\" "
				+ "SET \"nextStepUuid\" = (SELECT \"nextStepUuid\" from \"approvalSteps\" where uuid = :stepToDeleteUuid) "
				+ "WHERE \"nextStepUuid\" = :stepToDeleteUuid")
			.bind("stepToDeleteUuid", uuid)
			.execute();

		//Remove all approvers from this step
		engine.getDbHandle().execute("/* deleteApproval.delete1 */ DELETE FROM approvers where \"approvalStepUuid\" = ?", uuid);

		//Update any approvals that happened at this step
		engine.getDbHandle().execute("/* deleteApproval.updateActions */ UPDATE \"reportActions\" SET \"approvalStepUuid\" = ? WHERE \"approvalStepUuid\" = ?", null, uuid);

		engine.getDbHandle().execute("/* deleteApproval.delete2 */ DELETE FROM \"approvalSteps\" where uuid = ?", uuid);
		return true;
	}

	/**
	 * Check whether the Approval Step is being by a report
	 */
	public boolean isStepInUse(String uuid) {
		List<Map<String, Object>> rs = engine.getDbHandle().select("/* deleteApproval.check */ SELECT count(*) AS ct FROM reports WHERE \"approvalStepUuid\" = ?", uuid)
				.map(new MapMapper(false))
				.list();
		Map<String,Object> result = rs.get(0);
		int count = ((Number) result.get("ct")).intValue();
		return count != 0;
	}

	/**
	 * Returns the previous step for a given stepUuid.
	 */
	public ApprovalStep getStepByNextStepUuid(String uuid) {
		List<ApprovalStep> list = engine.getDbHandle().createQuery("/* getNextStep */ SELECT * FROM \"approvalSteps\" WHERE \"nextStepUuid\" = :uuid")
			.bind("uuid", uuid)
			.map(new ApprovalStepMapper())
			.list();
		if (list.size() == 0) { return null; }
		return list.get(0);
	}
	
	/**
	 * Returns the list of positions that can approve for a given step. 
	 */
	public CompletableFuture<List<Position>> getApproversForStep(Map<String, Object> context, String approvalStepUuid) {
		return new ForeignKeyFetcher<Position>()
				.load(context, "approvalStep.approvers", approvalStepUuid);
	}

	public int addApprover(ApprovalStep step, String positionUuid) {
		return engine.getDbHandle().createUpdate("/* addApprover */ INSERT INTO approvers (\"approvalStepUuid\", \"positionUuid\") VALUES (:stepUuid, :positionUuid)")
				.bind("stepUuid", step.getUuid())
				.bind("positionUuid", positionUuid)
				.execute();
	}
	
	public int removeApprover(ApprovalStep step, String positionUuid) {
		return engine.getDbHandle().createUpdate("/* removeApprover */ DELETE FROM approvers WHERE \"approvalStepUuid\" = :stepUuid AND \"positionUuid\" = :positionUuid")
				.bind("stepUuid", step.getUuid())
				.bind("positionUuid", positionUuid)
				.execute();
	}
}
