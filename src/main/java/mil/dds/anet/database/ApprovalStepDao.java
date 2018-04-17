package mil.dds.anet.database;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

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
	
	public Collection<ApprovalStep> getByAdvisorOrganizationUuid(String aoUuid) {
		Query<ApprovalStep> query = dbHandle.createQuery("/* getApprovalStepsByOrg */ SELECT * from \"approvalSteps\" WHERE \"advisorOrganizationUuid\" = :aoUuid")
				.bind("aoUuid", aoUuid)
				.map(new ApprovalStepMapper());
		return query.list();
	}

	@Deprecated
	public ApprovalStep getById(int id) {
		Query<ApprovalStep> query = dbHandle.createQuery("/* getApprovalStepById */ SELECT * from \"approvalSteps\" where id = :id")
				.bind("id", id)
				.map(new ApprovalStepMapper());
		List<ApprovalStep> results = query.list();
		if (results.size() == 0) { return null; }
		return results.get(0);
	}

	public ApprovalStep getByUuid(String uuid) {
		return dbHandle.createQuery("/* getApprovalStepByUuid */ SELECT * from \"approvalSteps\" where uuid = :uuid")
				.bind("uuid", uuid)
				.map(new ApprovalStepMapper())
				.first();
	}

	public ApprovalStep insert(ApprovalStep as) {
		DaoUtils.setInsertFields(as);
		dbHandle.createStatement(
				"/* insertApprovalStep */ INSERT into \"approvalSteps\" (uuid, name, \"nextStepUuid\", \"advisorOrganizationUuid\") "
				+ "VALUES (:uuid, :name, :nextStepUuid, :advisorOrganizationUuid)")
			.bindFromProperties(as)
			.execute();

		if (as.getApprovers() != null) {
			for (Position approver : as.getApprovers()) {
				if (approver.getUuid() == null) {
					throw new WebApplicationException("Invalid Position UUID of Null for Approver");
				}
				dbHandle.createStatement("/* insertApprovalStep.approvers */ "
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
		dbHandle.createStatement("/* insertApprovalAtEnd */ UPDATE \"approvalSteps\" SET \"nextStepUuid\" = :uuid "
				+ "WHERE \"advisorOrganizationUuid\" = :advisorOrganizationUuid "
				+ "AND \"nextStepUuid\" IS NULL AND uuid != :uuid")
			.bindFromProperties(as)
			.execute();
		return as;
	}
	
	/**
	 * Updates the name, nextStepUuid, and advisorOrgUuid on this Approval Step
	 * DOES NOT update the list of members for this step. 
	 */
	public int update(ApprovalStep as) {
		DaoUtils.setUpdateFields(as);
		return dbHandle.createStatement("/* updateApprovalStep */ UPDATE \"approvalSteps\" SET name = :name, "
				+ "\"nextStepUuid\" = :nextStepUuid, \"advisorOrganizationUuid\" = :advisorOrganizationUuid "
				+ "WHERE uuid = :uuid")
			.bindFromProperties(as)
			.execute();
	}

	/**
	 * Delete the Approval Step with the given UUID.
	 * Will patch up the Approval Process list after the removal. 
	 */
	public boolean deleteStep(String uuid) {
		//ensure there is nothing currently on this step
		List<Map<String, Object>> rs = dbHandle.select("/* deleteApproval.check */ SELECT count(*) AS ct FROM reports WHERE \"approvalStepUuid\" = ?", uuid);
		Map<String,Object> result = rs.get(0);
		int count = ((Number) result.get("ct")).intValue();
		if (count != 0) {
			throw new WebApplicationException("Reports are currently pending at this step", Status.NOT_ACCEPTABLE);
		}

		//fix up the linked list.
		dbHandle.createStatement("/* deleteApproval.update */ UPDATE \"approvalSteps\" "
				+ "SET \"nextStepUuid\" = (SELECT \"nextStepUuid\" from \"approvalSteps\" where uuid = :stepToDeleteUuid) "
				+ "WHERE \"nextStepUuid\" = :stepToDeleteUuid")
			.bind("stepToDeleteUuid", uuid)
			.execute();

		//Remove all approvers from this step
		dbHandle.execute("/* deleteApproval.delete1 */ DELETE FROM approvers where \"approvalStepUuid\" = ?", uuid);

		//Update any approvals that happened at this step
		dbHandle.execute("/* deleteApproval.updateActions */ UPDATE \"approvalActions\" SET \"approvalStepUuid\" = ? WHERE \"approvalStepUuid\" = ?", null, uuid);

		dbHandle.execute("/* deleteApproval.delete2 */ DELETE FROM \"approvalSteps\" where uuid = ?", uuid);
		return true;
	}

	/**
	 * Returns the previous step for a given stepUuid.
	 */
	public ApprovalStep getStepByNextStepUuid(String uuid) {
		List<ApprovalStep> list = dbHandle.createQuery("/* getNextStep */ SELECT * FROM \"approvalSteps\" WHERE \"nextStepUuid\" = :uuid")
			.bind("uuid", uuid)
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
				+ "WHERE uuid IN "
				+ "(SELECT \"positionUuid\" from approvers where \"approvalStepUuid\" = :approvalStepUuid)")
			.bind("approvalStepUuid", as.getUuid())
			.map(new PositionMapper())
			.list();
	}

	public int addApprover(ApprovalStep step, Position position) {
		return dbHandle.createStatement("/* addApprover */ INSERT INTO approvers (\"approvalStepUuid\", \"positionUuid\") VALUES (:stepUuid, :positionUuid)")
				.bind("stepUuid", step.getUuid())
				.bind("positionUuid", position.getUuid())
				.execute();
	}
	
	public int removeApprover(ApprovalStep step, Position position) {
		return dbHandle.createStatement("/* removeApprover */ DELETE FROM approvers WHERE \"approvalStepUuid\" = :stepUuid AND \"positionUuid\" = :positionUuid")
				.bind("stepUuid", step.getUuid())
				.bind("positionUuid", position.getUuid())
				.execute();
	}
}
