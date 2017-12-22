package mil.dds.anet.database;

import java.util.List;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.lists.AbstractAnetBeanList;
import mil.dds.anet.database.mappers.ApprovalActionMapper;

public class ApprovalActionDao implements IAnetDao<ApprovalAction> {

	Handle dbHandle;
	
	public ApprovalActionDao(Handle db) { 
		this.dbHandle = db;
	}
	
	@Override
	public ApprovalAction insert(ApprovalAction action) {
		action.setCreatedAt(DateTime.now());
		dbHandle.createStatement("/* insertApprovalAction */ INSERT INTO \"approvalActions\" "
				+ "(\"approvalStepId\", \"personId\", \"reportId\", \"createdAt\", type) "
				+ "VALUES (:approvalStepId, :personId, :reportId, :createdAt, :type)")
			.bind("approvalStepId", action.getStep().getId())
			.bind("personId", action.getPerson().getId())
			.bind("reportId", action.getReport().getId())
			.bind("createdAt", action.getCreatedAt())
			.bind("type", action.getType().ordinal())
			.execute();
		return action;
	}

	/**
	 * Returns all approval actions ever taken for a particular report. 
	 * Ordered by their date ascending (earliest to most recent). 
	 */
	public List<ApprovalAction> getActionsForReport(int reportId) {
		Query<ApprovalAction> query = dbHandle.createQuery("/* getReportApprovals */ SELECT * FROM \"approvalActions\" " 
				+ "WHERE \"reportId\" = :reportId ORDER BY \"createdAt\" ASC")
			.bind("reportId", reportId)
			.map(new ApprovalActionMapper());
		return query.list();
	}

	/**
	 * Gets the approval actions for this report, but only returning the most recent
	 * where there were multiple actions on the same step (ie a reject then an approval
	 * will only return the approval).
	 */
	public List<ApprovalAction> getFinalActionsForReport(int reportId) {
		//TODO: test this. I don't think it works.... 
		return dbHandle.createQuery("/* getReportFinalActions */ SELECT * FROM \"approvalActions\" "
				+ "WHERE \"reportId\" = :reportId GROUP BY \"approvalStepId\" "
				+ "ORDER BY \"createdAt\" DESC")
			.bind("reportId", reportId)
			.map(new ApprovalActionMapper())
			.list();
	}
	
	@Override
	public AbstractAnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	@Override
	public ApprovalAction getById(int id) {
		throw new UnsupportedOperationException();
	}

	@Override
	public int update(ApprovalAction obj) {
		throw new UnsupportedOperationException();
	}
}
