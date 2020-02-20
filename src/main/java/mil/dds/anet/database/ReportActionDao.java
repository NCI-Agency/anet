package mil.dds.anet.database;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.ReportActionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;

public class ReportActionDao extends AnetBaseDao<ReportAction, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "reportActions";

  @Override
  public ReportAction insertInternal(ReportAction action) {
    getDbHandle()
        .createUpdate("/* insertReportAction */ INSERT INTO \"reportActions\" "
            + "(\"approvalStepUuid\", \"personUuid\", \"reportUuid\", \"createdAt\", type) "
            + "VALUES (:approvalStepUuid, :personUuid, :reportUuid, :createdAt, :type)")
        .bind("approvalStepUuid", action.getStepUuid()).bind("personUuid", action.getPersonUuid())
        .bind("reportUuid", action.getReportUuid())
        .bind("createdAt", DaoUtils.asLocalDateTime(action.getCreatedAt()))
        .bind("type", DaoUtils.getEnumId(action.getType())).execute();
    return action;
  }

  /**
   * Returns all approval actions ever taken for a particular report. Ordered by their date
   * ascending (earliest to most recent).
   */
  public CompletableFuture<List<ReportAction>> getActionsForReport(Map<String, Object> context,
      String reportUuid) {
    return new ForeignKeyFetcher<ReportAction>().load(context,
        FkDataLoaderKey.REPORT_REPORT_ACTIONS, reportUuid);
  }

  @Override
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

  static class ReportActionsBatcher extends ForeignKeyBatcher<ReportAction> {
    private static final String sql =
        "/* batch.getReportApprovals */ SELECT * FROM \"reportActions\" "
            + "WHERE \"reportUuid\" IN ( <foreignKeys> ) ORDER BY \"createdAt\" ASC";

    public ReportActionsBatcher() {
      super(sql, "foreignKeys", new ReportActionMapper(), "reportUuid");
    }
  }

  public List<List<ReportAction>> getReportActions(List<String> foreignKeys) {
    final ForeignKeyBatcher<ReportAction> reportIdBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(ReportActionsBatcher.class);
    return reportIdBatcher.getByForeignKeys(foreignKeys);
  }
}
