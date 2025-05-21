package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import java.util.List;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.database.mappers.MartImportedReportMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MartImportedReportDao extends AbstractDao {

  public MartImportedReportDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Transactional
  public List<MartImportedReport> getAll() {
    return getAll(0, 0, null).getList();
  }

  @Transactional
  public MartImportedReport getByReportUuid(String reportUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle.createQuery(
          "/* MartImportedReportGetByReportUuid*/ SELECT * FROM \"martImportedReports\" "
              + "WHERE \"reportUuid\" = :reportUuid ORDER BY sequence DESC, \"receivedAt\" DESC LIMIT 1")
          .bind("reportUuid", reportUuid).map(new MartImportedReportMapper()).findFirst()
          .orElse(null);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public AnetBeanList<MartImportedReport> getAll(int pageNum, int pageSize, Boolean success) {
    final Handle handle = getDbHandle();
    try {
      final StringBuilder sql =
          new StringBuilder("/* MartImportedReportCheck */ SELECT * FROM \"martImportedReports\"");
      sql.insert(0, "SELECT *, COUNT(*) OVER() AS \"totalCount\" FROM (");
      if (success != null) {
        sql.append(" WHERE success = :success");
      }
      sql.append(") AS results");
      sql.append(" ORDER BY sequence DESC, \"receivedAt\" DESC");
      if (pageSize > 0) {
        sql.append(" OFFSET :offset LIMIT :limit");
      }
      final Query query = handle.createQuery(sql);
      if (success != null) {
        query.bind("success", success);
      }
      if (pageSize > 0) {
        query.bind("offset", pageSize * pageNum).bind("limit", pageSize);
      }
      return new AnetBeanList<>(query, pageNum, pageSize, new MartImportedReportMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public AnetBeanList<MartImportedReport> getAllSequences(List<Long> sequences) {
    final Handle handle = getDbHandle();
    try {
      final Query query = handle.createQuery(
          "/* MartImportedReportSequencesCheck */ SELECT * FROM \"martImportedReports\" WHERE \"sequence\" IN (<sequences>)")
          .bindList(NULL_KEYWORD, "sequences", sequences);
      return new AnetBeanList<>(query, 0, 0, new MartImportedReportMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int insert(final MartImportedReport martImportedReport) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* insertMartImportedReport */ INSERT INTO \"martImportedReports\" "
              + "(sequence, \"personUuid\", \"reportUuid\", success, \"submittedAt\", \"receivedAt\", errors) "
              + "VALUES (:sequence, :personUuid, :reportUuid, :success, :submittedAt, :receivedAt, :errors) ")
          .bindBean(martImportedReport)
          .bind("submittedAt", DaoUtils.asLocalDateTime(martImportedReport.getSubmittedAt()))
          .bind("receivedAt", DaoUtils.asLocalDateTime(martImportedReport.getReceivedAt()))
          .execute();
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

}
