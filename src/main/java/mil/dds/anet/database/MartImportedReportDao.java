package mil.dds.anet.database;

import static org.jdbi.v3.core.statement.EmptyHandling.NULL_KEYWORD;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.MartImportedReportMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MartImportedReportDao extends AbstractDao {
  @Autowired
  private PersonDao personDao;

  static List<String> ALLOWED_SORT_FIELDS = Arrays.asList("sequence", "submittedAt", "receivedAt");

  public MartImportedReportDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Transactional
  public List<MartImportedReport> getAll() {
    return getAll(0, 0, null, null, null, null).getList();
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
  public AnetBeanList<MartImportedReport> getAll(int pageNum, int pageSize, List<String> states,
      String sortBy, String sortOrder, String authorUuid) {
    final Handle handle = getDbHandle();
    try {
      String sortField = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "sequence";
      String order = "asc".equalsIgnoreCase(sortOrder) ? "ASC" : "DESC";
      String quotedSortField = "\"" + sortField + "\"";

      final StringBuilder sql = new StringBuilder();
      sql.append(
          "/* MartImportedReportCheck */ SELECT *, COUNT(*) OVER() AS \"totalCount\" FROM (");
      sql.append("  SELECT * FROM \"martImportedReports\"");
      List<String> stateConditions = new ArrayList<>();
      if (states != null && !states.isEmpty()) {
        for (String state : states) {
          switch (state) {
            case "success":
              stateConditions.add("success = TRUE");
              break;
            case "warning":
              stateConditions.add("success = FALSE AND errors LIKE 'While importing%'");
              break;
            case "failure":
              stateConditions.add("success = FALSE AND errors NOT LIKE 'While importing%'");
              break;
            default:
              break;
          }
        }
      }

      String authorCondition = null;
      if (authorUuid != null && !authorUuid.isEmpty()) {
        authorCondition = "\"personUuid\" = :authorUuid";
      }

      List<String> allConditions = new ArrayList<>();
      if (!stateConditions.isEmpty()) {
        allConditions.add("(" + String.join(" OR ", stateConditions) + ")");
      }
      if (authorCondition != null) {
        allConditions.add(authorCondition);
      }
      if (!allConditions.isEmpty()) {
        sql.append(" WHERE ").append(String.join(" AND ", allConditions));
      }

      sql.append(") AS results");
      sql.append(" ORDER BY ").append(quotedSortField).append(" ").append(order);
      if (pageSize > 0) {
        sql.append(" OFFSET :offset LIMIT :limit");
      }
      final Query query = handle.createQuery(sql.toString());
      if (authorUuid != null && !authorUuid.isEmpty()) {
        query.bind("authorUuid", authorUuid);
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
  public List<Person> getUniqueMartReportAuthors() {
    final Handle handle = getDbHandle();
    try {
      String sql =
          "SELECT DISTINCT \"personUuid\" FROM \"martImportedReports\" WHERE \"personUuid\" IS NOT NULL";
      List<String> personUuids = handle.createQuery(sql).mapTo(String.class).list();

      return personDao.getByIds(personUuids);
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
