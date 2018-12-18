package mil.dds.anet.database;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.ApprovalActionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;

public class ApprovalActionDao implements IAnetDao<ApprovalAction> {

	Handle dbHandle;
	private final ForeignKeyBatcher<ApprovalAction> reportIdBatcher;

	public ApprovalActionDao(Handle db) { 
		this.dbHandle = db;
		final String reportIdBatcherSql = "/* batch.getReportApprovals */ SELECT * FROM \"approvalActions\" "
				+ "WHERE \"reportUuid\" IN ( <foreignKeys> ) ORDER BY \"createdAt\" ASC";
		this.reportIdBatcher = new ForeignKeyBatcher<ApprovalAction>(db, reportIdBatcherSql, "foreignKeys", new ApprovalActionMapper(), "reportUuid");
	}
	
	public ApprovalAction insert(ApprovalAction action) {
		DaoUtils.setInsertFields(action);
		dbHandle.createUpdate("/* insertApprovalAction */ INSERT INTO \"approvalActions\" "
				+ "(\"approvalStepUuid\", \"personUuid\", \"reportUuid\", \"createdAt\", type) "
				+ "VALUES (:approvalStepUuid, :personUuid, :reportUuid, :createdAt, :type)")
			.bind("approvalStepUuid", action.getStepUuid())
			.bind("personUuid", action.getPersonUuid())
			.bind("reportUuid", action.getReportUuid())
			.bind("createdAt", action.getCreatedAt())
			.bind("type", DaoUtils.getEnumId(action.getType()))
			.execute();
		return action;
	}

	/**
	 * Returns all approval actions ever taken for a particular report. 
	 * Ordered by their date ascending (earliest to most recent). 
	 */
	public CompletableFuture<List<ApprovalAction>> getActionsForReport(Map<String, Object> context, String reportUuid) {
		return new ForeignKeyFetcher<ApprovalAction>()
				.load(context, "report.approvalActions", reportUuid);
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

	public List<List<ApprovalAction>> getApprovalActions(List<String> foreignKeys) {
		return reportIdBatcher.getByForeignKeys(foreignKeys);
	}
}
