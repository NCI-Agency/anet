package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.ReportActionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;

@Component
public class ReportActionDao extends AnetBaseDao<ReportAction, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "reportActions";

  public ReportActionDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public ReportAction insertInternal(ReportAction action) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate("/* insertReportAction */ INSERT INTO \"reportActions\" "
          + "(\"approvalStepUuid\", \"personUuid\", \"reportUuid\", \"createdAt\", type, planned) "
          + "VALUES (:approvalStepUuid, :personUuid, :reportUuid, :createdAt, :type, :planned)")
          .bind("approvalStepUuid", action.getStepUuid()).bind("personUuid", action.getPersonUuid())
          .bind("reportUuid", action.getReportUuid())
          .bind("createdAt", DaoUtils.asLocalDateTime(action.getCreatedAt()))
          .bind("type", DaoUtils.getEnumId(action.getType())).bind("planned", action.isPlanned())
          .execute();
      return action;
    } finally {
      closeDbHandle(handle);
    }
  }

  /**
   * Returns all approval actions ever taken for a particular report. Ordered by their date
   * ascending (earliest to most recent).
   */
  public CompletableFuture<List<ReportAction>> getActionsForReport(GraphQLContext context,
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

  class ReportActionsBatcher extends ForeignKeyBatcher<ReportAction> {
    private static final String SQL =
        "/* batch.getReportApprovals */ SELECT * FROM \"reportActions\" "
            + "WHERE \"reportUuid\" IN ( <foreignKeys> ) ORDER BY \"createdAt\" ASC";

    public ReportActionsBatcher() {
      super(ReportActionDao.this.databaseHandler, SQL, "foreignKeys", new ReportActionMapper(),
          "reportUuid");
    }
  }

  public List<List<ReportAction>> getReportActions(List<String> foreignKeys) {
    return new ReportActionsBatcher().getByForeignKeys(foreignKeys);
  }
}
