package mil.dds.anet.database;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.ApprovalActionMapper;
import mil.dds.anet.views.ForeignKeyFetcher;

public class ApprovalActionDao implements IAnetDao<ApprovalAction> {

	Handle dbHandle;
	private final ForeignKeyBatcher<ApprovalAction> reportIdBatcher;

	public ApprovalActionDao(Handle db) { 
		this.dbHandle = db;
		final String reportIdBatcherSql = "/* batch.getReportApprovals */ SELECT * FROM \"approvalActions\" "
				+ "WHERE \"reportId\" IN ( %1$s ) ORDER BY \"createdAt\" ASC";
		this.reportIdBatcher = new ForeignKeyBatcher<ApprovalAction>(db, reportIdBatcherSql, new ApprovalActionMapper(), "reportId");
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
	public CompletableFuture<List<ApprovalAction>> getActionsForReport(Map<String, Object> context, Integer reportId) {
		return new ForeignKeyFetcher<ApprovalAction>()
				.load(context, "report.approvalActions", reportId);
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
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	@Override
	public ApprovalAction getById(int id) {
		throw new UnsupportedOperationException();
	}

	@Override
	public List<ApprovalAction> getByIds(List<Integer> ids) {
		throw new UnsupportedOperationException();
	}

	@Override
	public int update(ApprovalAction obj) {
		throw new UnsupportedOperationException();
	}

	public List<List<ApprovalAction>> getApprovalActions(List<Integer> foreignKeys) {
		return reportIdBatcher.getByForeignKeys(foreignKeys);
	}
}
