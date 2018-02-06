package mil.dds.anet.database;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.TransactionCallback;
import org.skife.jdbi.v2.TransactionStatus;

import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AbstractAnetBeanList;
import mil.dds.anet.database.mappers.ApprovalStepMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;

public class ApprovalStepDao implements IAnetDao<ApprovalStep> {

	Handle dbHandle;
	
	public ApprovalStepDao(Handle h) {
		this.dbHandle = h;
	}
	
	public AbstractAnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}
	
	public Collection<ApprovalStep> getByAdvisorOrganizationId(int aoId) {
		Query<ApprovalStep> query = dbHandle.createQuery("/* getApprovalStepsByOrg */ SELECT * from \"approvalSteps\" WHERE \"advisorOrganizationId\" = :aoId")
				.bind("aoId", aoId)
				.map(new ApprovalStepMapper());
		return query.list();
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
	public ApprovalStep insert(ApprovalStep as) { 
		return dbHandle.inTransaction(new TransactionCallback<ApprovalStep>() {
			public ApprovalStep inTransaction(Handle conn, TransactionStatus status) throws Exception {
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
		});
		
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
		return dbHandle.inTransaction(new TransactionCallback<Boolean>() {
			public Boolean inTransaction(Handle conn, TransactionStatus status) throws Exception {
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
		});
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
	public List<Position> getApproversForStep(ApprovalStep as) {
		return dbHandle.createQuery("/* getApproversForStep */ SELECT " + PositionDao.POSITIONS_FIELDS + " FROM positions "
				+ "WHERE id IN "
				+ "(SELECT \"positionId\" from approvers where \"approvalStepId\" = :approvalStepId)")
			.bind("approvalStepId", as.getId())
			.map(new PositionMapper())
			.list();
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
