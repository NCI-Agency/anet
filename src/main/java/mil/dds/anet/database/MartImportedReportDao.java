package mil.dds.anet.database;

import java.util.List;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.database.mappers.MartImportedReportMapper;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MartImportedReportDao {

  protected final DatabaseHandler databaseHandler;

  public MartImportedReportDao(DatabaseHandler databaseHandler) {
    this.databaseHandler = databaseHandler;
  }

  protected Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  protected void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }

  @Transactional
  public List<MartImportedReport> getAll() {
    return getAll(0, 0).getList();
  }

  @Transactional
  public AnetBeanList<MartImportedReport> getAll(int pageNum, int pageSize) {
    final Handle handle = getDbHandle();
    try {
      final StringBuilder sql = new StringBuilder(
          "/* MartImportedReportCheck */ SELECT * FROM \"martImportedReports\" ORDER BY \"createdAt\" ASC");
      sql.insert(0, "SELECT *, COUNT(*) OVER() AS \"totalCount\" FROM (");
      sql.append(") AS results");
      sql.append(" ORDER BY \"createdAt\" DESC");
      if (pageSize > 0) {
        sql.append(" OFFSET :offset LIMIT :limit");
      }
      final Query query = handle.createQuery(sql);
      if (pageSize > 0) {
        query.bind("offset", pageSize * pageNum).bind("limit", pageSize);
      }
      return new AnetBeanList<>(query, pageNum, pageSize, new MartImportedReportMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  /**
   * Inserts martImportedReport in the database
   *
   * @param martImportedReport the mart imported report
   * @return number of rows inserted/updated
   */
  @Transactional
  public int insert(final MartImportedReport martImportedReport) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* upsertMartImportedReport */ INSERT INTO \"martImportedReports\" "
              + "(\"personUuid\", \"reportUuid\", success, \"createdAt\", errors) "
              + "VALUES (:personUuid, :reportUuid, :success, :createdAt, :errors) ")
          .bindBean(martImportedReport).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

}
