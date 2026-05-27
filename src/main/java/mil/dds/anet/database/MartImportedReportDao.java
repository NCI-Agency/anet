package mil.dds.anet.database;

import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.search.MartImportedReportSearchQuery;
import mil.dds.anet.search.pg.PostgresqlMartImportedReportSearcher;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MartImportedReportDao extends AbstractDao {

  private static final String[] fields =
      {"sequence", "personUuid", "reportUuid", "state", "submittedAt", "receivedAt", "errors"};
  public static final String TABLE_NAME = "martImportedReports";
  public static final String MART_IMPORTED_REPORTS_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public MartImportedReportDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Transactional
  public int insert(final MartImportedReport martImportedReport) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* insertMartImportedReport */ INSERT INTO \"martImportedReports\" "
              + "(sequence, \"personUuid\", \"reportUuid\", state, \"submittedAt\", \"receivedAt\", errors) "
              + "VALUES (:sequence, :personUuid, :reportUuid, :state, :submittedAt, :receivedAt, :errors) ")
          .bindBean(martImportedReport)
          .bind("submittedAt", DaoUtils.asLocalDateTime(martImportedReport.getSubmittedAt()))
          .bind("receivedAt", DaoUtils.asLocalDateTime(martImportedReport.getReceivedAt()))
          .bind("state", DaoUtils.getEnumId(martImportedReport.getState())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int delete(final MartImportedReport martImportedReport) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* deleteMartImportedReport */ DELETE FROM \"martImportedReports\" "
              + "WHERE sequence = :sequence")
          .bindBean(martImportedReport).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public AnetBeanList<MartImportedReport> search(MartImportedReportSearchQuery query) {
    return new PostgresqlMartImportedReportSearcher(databaseHandler).runSearch(query);
  }

}
