package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import java.util.List;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.search.MartImportedReportSearchQuery;
import mil.dds.anet.database.mappers.MartImportedReportMapper;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.ReportMapper;
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
  public AnetBeanList<MartImportedReport> getMartImportedReportHistory(
      MartImportedReportSearchQuery martImportedReportSearchQuery) {
    final Handle handle = getDbHandle();
    try {
      final StringBuilder sql = new StringBuilder(
          "/* MartImportedReportHistory */ SELECT * FROM \"martImportedReports\"");
      addFilters(sql, martImportedReportSearchQuery);
      sql.insert(0, "SELECT *, COUNT(*) OVER() AS \"totalCount\" FROM (");
      sql.append(") AS results");
      addOrder(sql, martImportedReportSearchQuery);

      return new AnetBeanList<>(getQuery(handle, sql, martImportedReportSearchQuery), 0, 0,
          new MartImportedReportMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public AnetBeanList<MartImportedReport> getMartImportedReports(
      MartImportedReportSearchQuery martImportedReportSearchQuery) {
    final Handle handle = getDbHandle();
    try {
      final StringBuilder sql = new StringBuilder(
          "/* MartImportedReportList */ SELECT DISTINCT ON (\"reportUuid\") * FROM \"martImportedReports\"");
      addFilters(sql, martImportedReportSearchQuery);
      sql.append(" ORDER BY \"reportUuid\", \"receivedAt\", sequence DESC");

      sql.insert(0, "SELECT *, COUNT(*) OVER() AS \"totalCount\" FROM (");
      sql.append(") AS results");
      addOrder(sql, martImportedReportSearchQuery);
      return new AnetBeanList<>(getQuery(handle, sql, martImportedReportSearchQuery),
          martImportedReportSearchQuery.getPageNum(), martImportedReportSearchQuery.getPageSize(),
          new MartImportedReportMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public AnetBeanList<MartImportedReport> getMartImportedReportHistory(List<Long> sequences) {
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

  @Transactional
  public AnetBeanList<Person> getUniqueMartReportAuthors() {
    final Handle handle = getDbHandle();
    try {
      final String sql =
          "SELECT DISTINCT p.uuid AS people_uuid, p.name AS people_name from \"martImportedReports\" mir inner join people p on mir.\"personUuid\"  = p.uuid";
      final Query query = handle.createQuery(sql);
      return new AnetBeanList<>(query, 0, 0, new PersonMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public AnetBeanList<Report> getUniqueMartReportReports() {
    final Handle handle = getDbHandle();
    try {
      final String sql =
          "SELECT DISTINCT r.uuid AS reports_uuid, r.intent AS reports_intent from \"martImportedReports\" mir inner join reports r on mir.\"reportUuid\"  = r.uuid";
      final Query query = handle.createQuery(sql);
      return new AnetBeanList<>(query, 0, 0, new ReportMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  private void addFilters(StringBuilder sql,
      MartImportedReportSearchQuery martImportedReportSearchQuery) {
    sql.append(" WHERE 1 = 1");
    if (martImportedReportSearchQuery.getState() != null) {
      sql.append(" AND \"state\" = ")
          .append(DaoUtils.getEnumId(martImportedReportSearchQuery.getState()));
    }
    if (martImportedReportSearchQuery.getPersonUuid() != null) {
      sql.append(" AND \"personUuid\" = '").append(martImportedReportSearchQuery.getPersonUuid())
          .append("'");
    }
    if (martImportedReportSearchQuery.getReportUuid() != null) {
      sql.append(" AND \"reportUuid\" = '").append(martImportedReportSearchQuery.getReportUuid())
          .append("'");
    }
  }

  private void addOrder(StringBuilder sql,
      MartImportedReportSearchQuery martImportedReportSearchQuery) {
    sql.append(" ORDER BY results.\"").append(martImportedReportSearchQuery.getSortBy())
        .append("\" ").append(martImportedReportSearchQuery.getSortOrder());
  }

  private Query getQuery(Handle handle, StringBuilder sql,
      MartImportedReportSearchQuery martImportedReportSearchQuery) {
    if (martImportedReportSearchQuery.getPageSize() > 0) {
      sql.append(" OFFSET :offset LIMIT :limit");
    }
    final Query query = handle.createQuery(sql);
    if (martImportedReportSearchQuery.getPageSize() > 0) {
      query
          .bind("offset",
              martImportedReportSearchQuery.getPageSize()
                  * martImportedReportSearchQuery.getPageNum())
          .bind("limit", martImportedReportSearchQuery.getPageSize());
    }
    return query;
  }
}
