package mil.dds.anet.database;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.ApprovalStepMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;

public class ApprovalStepDao implements IAnetDao<ApprovalStep> {

	private final Handle dbHandle;
	private final IdBatcher<ApprovalStep> idBatcher;
	private final ForeignKeyBatcher<Position> approversBatcher;
	private final ForeignKeyBatcher<ApprovalStep> organizationIdBatcher;

	public ApprovalStepDao(Handle h) {
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getApprovalStepsByIds */ SELECT * from \"approvalSteps\" where id IN ( %1$s )";
		this.idBatcher = new IdBatcher<ApprovalStep>(dbHandle, idBatcherSql, new ApprovalStepMapper());

		final String approversBatcherSql = "/* batch.getApproversForStep */ SELECT \"approvalStepId\", " + PositionDao.POSITIONS_FIELDS
				+ " FROM approvers "
				+ "LEFT JOIN positions ON \"positions\".\"id\" = approvers.\"positionId\" "
				+ "WHERE \"approvalStepId\" IN ( %1$s )";
		this.approversBatcher = new ForeignKeyBatcher<Position>(h, approversBatcherSql, new PositionMapper(), "approvalStepId");

		final String organizationIdBatcherSql = "/* batch.getApprovalStepsByOrg */ SELECT * from \"approvalSteps\" WHERE \"advisorOrganizationId\" IN ( %1$s )";
		this.organizationIdBatcher = new ForeignKeyBatcher<ApprovalStep>(h, organizationIdBatcherSql, new ApprovalStepMapper(), "advisorOrganizationId");
	}
	
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	public CompletableFuture<List<ApprovalStep>> getByAdvisorOrganizationId(Map<String, Object> context, Integer aoId) {
		return new ForeignKeyFetcher<ApprovalStep>()
				.load(context, "organization.approvalSteps", aoId);
	}

	@Override
	public ApprovalStep getById(int id) {
		Query<ApprovalStep> query = dbHandle.createQuery("/* getApprovalStepById */ SELECT * from \"approvalSteps\" where id = :id")
				.bind("id", id)
				.map(new ApprovalStepMapper());
		List<ApprovalStep> results = query.list();
		if (results.size() == 0) { return null; }
		return results.get(0);
	}

	@Override
	public List<ApprovalStep> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	public List<List<Position>> getApprovers(List<Integer> foreignKeys) {
		return approversBatcher.getByForeignKeys(foreignKeys);
	}

	public List<List<ApprovalStep>> getApprovalSteps(List<Integer> foreignKeys) {
		return organizationIdBatcher.getByForeignKeys(foreignKeys);
	}

	@Override
	public ApprovalStep insert(ApprovalStep as) { 
		GeneratedKeys<Map<String, Object>> keys = dbHandle.createStatement(
				"/* insertApprovalStep */ INSERT into \"approvalSteps\" (name, \"nextStepId\", \"advisorOrganizationId\") "
				+ "VALUES (:name, :nextStepId, :advisorOrganizationId)")
			.bindFromProperties(as)
			.executeAndReturnGeneratedKeys();

		as.setId(DaoUtils.getGeneratedId(keys));

		if (as.getApprovers() != null) {
			for (Position approver : as.getApprovers()) {
				if (approver.getId() == null) {
					throw new WebApplicationException("Invalid Position ID of Null for Approver");
				}
				dbHandle.createStatement("/* insertApprovalStep.approvers */ "
						+ "INSERT INTO approvers (\"positionId\", \"approvalStepId\") VALUES (:positionId, :stepId)")
					.bind("positionId", approver.getId())
					.bind("stepId", as.getId())
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
		dbHandle.createStatement("/* insertApprovalAtEnd */ UPDATE \"approvalSteps\" SET \"nextStepId\" = :id "
				+ "WHERE \"advisorOrganizationId\" = :advisorOrganizationId "
				+ "AND \"nextStepId\" IS NULL AND id != :id")
			.bindFromProperties(as)
			.execute();
		return as;
	}
	
	/**
	 * Updates the name, nextStepId, and advisorOrgId on this Approval Step
	 * DOES NOT update the list of members for this step. 
	 */
	public int update(ApprovalStep as) {
		return dbHandle.createStatement("/* updateApprovalStep */ UPDATE \"approvalSteps\" SET name = :name, "
				+ "\"nextStepId\" = :nextStepId, \"advisorOrganizationId\" = :advisorOrganizationId "
				+ "WHERE id = :id")
			.bindFromProperties(as)
			.execute();
	}

	/**
	 * Delete the Approval Step with the given ID. 
	 * Will patch up the Approval Process list after the removal. 
	 */
	public boolean deleteStep(int id) {
		//ensure there is nothing currently on this step
		List<Map<String, Object>> rs = dbHandle.select("/* deleteApproval.check */ SELECT count(*) AS ct FROM reports WHERE \"approvalStepId\" = ?", id);
		Map<String,Object> result = rs.get(0);
		int count = ((Number) result.get("ct")).intValue();
		if (count != 0) {
			throw new WebApplicationException("Reports are currently pending at this step", Status.NOT_ACCEPTABLE);
		}

		//fix up the linked list.
		dbHandle.createStatement("/* deleteApproval.update */ UPDATE \"approvalSteps\" "
				+ "SET \"nextStepId\" = (SELECT \"nextStepId\" from \"approvalSteps\" where id = :stepToDeleteId) "
				+ "WHERE \"nextStepId\" = :stepToDeleteId")
			.bind("stepToDeleteId", id)
			.execute();

		//Remove all approvers from this step
		dbHandle.execute("/* deleteApproval.delete1 */ DELETE FROM approvers where \"approvalStepId\" = ?", id);

		//Update any approvals that happened at this step
		dbHandle.execute("/* deleteApproval.updateActions */ UPDATE \"approvalActions\" SET \"approvalStepId\" = ? WHERE \"approvalStepId\" = ?", null, id);

		dbHandle.execute("/* deleteApproval.delete2 */ DELETE FROM \"approvalSteps\" where id = ?", id);
		return true;
	}

	/**
	 * Returns the previous step for a given stepId.  
	 */
	public ApprovalStep getStepByNextStepId(Integer id) {
		List<ApprovalStep> list = dbHandle.createQuery("/* getNextStep */ SELECT * FROM \"approvalSteps\" WHERE \"nextStepId\" = :id")
			.bind("id",id)
			.map(new ApprovalStepMapper())
			.list();
		if (list.size() == 0) { return null; }
		return list.get(0);
	}
	
	/**
	 * Returns the list of positions that can approve for a given step. 
	 */
	public CompletableFuture<List<Position>> getApproversForStep(Map<String, Object> context, Integer approvalStepId) {
		return new ForeignKeyFetcher<Position>()
				.load(context, "approvalStep.approvers", approvalStepId);
	}

	public int addApprover(ApprovalStep step, Position position) {
		return dbHandle.createStatement("/* addApprover */ INSERT INTO approvers (\"approvalStepId\", \"positionId\") VALUES (:stepId, :positionId)")
				.bind("stepId", step.getId())
				.bind("positionId", position.getId())
				.execute();
	}
	
	public int removeApprover(ApprovalStep step, Position position) {
		return dbHandle.createStatement("/* removeApprover */ DELETE FROM approvers WHERE \"approvalStepId\" = :stepId AND \"positionId\" = :positionId")
				.bind("stepId", step.getId())
				.bind("positionId", position.getId())
				.execute();
	}
}
