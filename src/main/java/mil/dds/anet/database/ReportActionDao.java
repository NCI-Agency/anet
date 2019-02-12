package mil.dds.anet.database;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.database.mappers.ReportActionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;

public class ReportActionDao extends AnetBaseDao<ReportAction> {

	private final ForeignKeyBatcher<ReportAction> reportIdBatcher;

	public ReportActionDao(Handle db) { 
		super(db, "ReportActions", "reportActions", "*", null);
		final String reportIdBatcherSql = "/* batch.getReportApprovals */ SELECT * FROM \"reportActions\" "
				+ "WHERE \"reportUuid\" IN ( <foreignKeys> ) ORDER BY \"createdAt\" ASC";
		this.reportIdBatcher = new ForeignKeyBatcher<ReportAction>(db, reportIdBatcherSql, "foreignKeys", new ReportActionMapper(), "reportUuid");
	}

	@Override
	public ReportAction insertInternal(ReportAction action) {
		dbHandle.createUpdate("/* insertReportAction */ INSERT INTO \"reportActions\" "
				+ "(\"approvalStepUuid\", \"personUuid\", \"reportUuid\", \"createdAt\", type) "
				+ "VALUES (:approvalStepUuid, :personUuid, :reportUuid, :createdAt, :type)")
			.bind("approvalStepUuid", action.getStepUuid())
			.bind("personUuid", action.getPersonUuid())
			.bind("reportUuid", action.getReportUuid())
			.bind("createdAt", DaoUtils.asLocalDateTime(action.getCreatedAt()))
			.bind("type", DaoUtils.getEnumId(action.getType()))
			.execute();
		return action;
	}

	/**
	 * Returns all approval actions ever taken for a particular report. 
	 * Ordered by their date ascending (earliest to most recent). 
	 */
	public CompletableFuture<List<ReportAction>> getActionsForReport(Map<String, Object> context, String reportUuid) {
		return new ForeignKeyFetcher<ReportAction>()
				.load(context, "report.reportActions", reportUuid);
	}

	/**
	 * Gets the approval actions for this report, but only returning the most recent
	 * where there were multiple actions on the same step (ie a reject then an approval
	 * will only return the approval).
	 */
	public List<ReportAction> getFinalActionsForReport(String reportUuid) {
		//TODO: test this. I don't think it works.... 
		return dbHandle.createQuery("/* getReportFinalActions */ SELECT * FROM \"reportActions\" "
				+ "WHERE \"reportUuid\" = :reportUuid GROUP BY \"approvalStepUuid\" "
				+ "ORDER BY \"createdAt\" DESC")
			.bind("reportUuid", reportUuid)
			.map(new ReportActionMapper())
			.list();
	}
	
	@Override
	public AnetBeanList<?> getAll(int pageNum, int pageSize) {
		throw new UnsupportedOperationException();
	}

	public ReportAction getByUuid(String uuid) {
		throw new UnsupportedOperationException();
	}

	@Override
	public List<ReportAction> getByIds(List<String> uuids) {
		throw new UnsupportedOperationException();
	}

	@Override
	public int updateInternal(ReportAction obj) {
		throw new UnsupportedOperationException();
	}

	@Override
	public int deleteInternal(String uuid) {
		throw new UnsupportedOperationException();
	}

	public List<List<ReportAction>> getReportActions(List<String> foreignKeys) {
		return reportIdBatcher.getByForeignKeys(foreignKeys);
	}
}
