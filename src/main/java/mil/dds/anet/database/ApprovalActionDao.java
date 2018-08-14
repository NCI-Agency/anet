package mil.dds.anet.database;

import java.util.List;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.ApprovalActionMapper;
import mil.dds.anet.utils.DaoUtils;

public class ApprovalActionDao implements IAnetDao<ApprovalAction> {

	Handle dbHandle;
	
	public ApprovalActionDao(Handle db) { 
		this.dbHandle = db;
	}
	
	public ApprovalAction insert(ApprovalAction action) {
		DaoUtils.setInsertFields(action);
		dbHandle.createStatement("/* insertApprovalAction */ INSERT INTO \"approvalActions\" "
				+ "(\"approvalStepUuid\", \"personUuid\", \"reportUuid\", \"createdAt\", type) "
				+ "VALUES (:approvalStepUuid, :personUuid, :reportUuid, :createdAt, :type)")
			.bind("approvalStepUuid", action.getStep().getUuid())
			.bind("personUuid", action.getPerson().getUuid())
			.bind("reportUuid", action.getReport().getUuid())
			.bind("createdAt", action.getCreatedAt())
			.bind("type", DaoUtils.getEnumId(action.getType()))
			.execute();
		return action;
	}

	/**
	 * Returns all approval actions ever taken for a particular report. 
	 * Ordered by their date ascending (earliest to most recent). 
	 */
	public List<ApprovalAction> getActionsForReport(String reportUuid) {
		Query<ApprovalAction> query = dbHandle.createQuery("/* getReportApprovals */ SELECT * FROM \"approvalActions\" "
				+ "WHERE \"reportUuid\" = :reportUuid ORDER BY \"createdAt\" ASC")
			.bind("reportUuid", reportUuid)
			.map(new ApprovalActionMapper());
		return query.list();
	}

	/**
	 * Gets the approval actions for this report, but only returning the most recent
	 * where there were multiple actions on the same step (ie a reject then an approval
	 * will only return the approval).
	 */
	public List<ApprovalAction> getFinalActionsForReport(String reportUuid) {
		//TODO: test this. I don't think it works.... 
		return dbHandle.createQuery("/* getReportFinalActions */ SELECT * FROM \"approvalActions\" "
				+ "WHERE \"reportUuid\" = :reportUuid GROUP BY \"approvalStepUuid\" "
				+ "ORDER BY \"createdAt\" DESC")
			.bind("reportUuid", reportUuid)
			.map(new ApprovalActionMapper())
			.list();
	}
	
	@Override
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	public ApprovalAction getByUuid(String uuid) {
		throw new UnsupportedOperationException();
	}

	@Override
	public List<ApprovalAction> getByIds(List<String> uuids) {
		throw new UnsupportedOperationException();
	}

	@Override
	public int update(ApprovalAction obj) {
		throw new UnsupportedOperationException();
	}
}
