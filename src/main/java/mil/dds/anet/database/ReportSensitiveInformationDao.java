package mil.dds.anet.database;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.ReportSensitiveInformationMapper;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class ReportSensitiveInformationDao
    extends AnetBaseDao<ReportSensitiveInformation, AbstractSearchQuery<?>> {

  private static final String[] fields = {"uuid", "text", "reportUuid", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "reportsSensitiveInformation";
  public static final String REPORTS_SENSITIVE_INFORMATION_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public ReportSensitiveInformation getByUuid(String uuid) {
    throw new UnsupportedOperationException();
  }

  @Override
  public List<ReportSensitiveInformation> getByIds(List<String> reportUuids) {
    throw new UnsupportedOperationException();
  }

  static class ReportsSensitiveInformationBatcher
      extends ForeignKeyBatcher<ReportSensitiveInformation> {
    private static final String sql =
        "/* batch.getReportSensitiveInformationsByReportUuids */ SELECT "
            + REPORTS_SENSITIVE_INFORMATION_FIELDS + " FROM \"" + TABLE_NAME + "\""
            + " WHERE \"reportUuid\" IN ( <foreignKeys> )";

    public ReportsSensitiveInformationBatcher() {
      super(sql, "foreignKeys", new ReportSensitiveInformationMapper(),
          "reportsSensitiveInformation_reportUuid");
    }
  }

  public List<List<ReportSensitiveInformation>> getReportSensitiveInformation(
      List<String> foreignKeys) {
    final ForeignKeyBatcher<ReportSensitiveInformation> reportIdBatcher = AnetObjectEngine
        .getInstance().getInjector().getInstance(ReportsSensitiveInformationBatcher.class);
    return reportIdBatcher.getByForeignKeys(foreignKeys);
  }

  @Override
  public ReportSensitiveInformation insertInternal(ReportSensitiveInformation rsi) {
    throw new UnsupportedOperationException();
  }

  @InTransaction
  public ReportSensitiveInformation insert(ReportSensitiveInformation rsi, Person user,
      Report report) {
    if (rsi == null || !isAuthorized(user, report) || Utils.isEmptyHtml(rsi.getText())) {
      return null;
    }
    DaoUtils.setInsertFields(rsi);
    getDbHandle()
        .createUpdate("/* insertReportsSensitiveInformation */ INSERT INTO \"" + TABLE_NAME + "\" "
            + " (uuid, text, \"reportUuid\", \"createdAt\", \"updatedAt\") "
            + "VALUES (:uuid, :text, :reportUuid, :createdAt, :updatedAt)")
        .bindBean(rsi).bind("createdAt", DaoUtils.asLocalDateTime(rsi.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(rsi.getUpdatedAt()))
        .bind("reportUuid", report.getUuid()).execute();
    AnetAuditLogger.log("ReportSensitiveInformation {} created by {} ", rsi, user);
    return rsi;
  }

  @Override
  public int updateInternal(ReportSensitiveInformation rsi) {
    throw new UnsupportedOperationException();
  }

  @InTransaction
  public int update(ReportSensitiveInformation rsi, Person user, Report report) {
    if (rsi == null || !isAuthorized(user, report)) {
      return 0;
    }
    final int numRows;
    if (Utils.isEmptyHtml(rsi.getText())) {
      numRows = getDbHandle().createUpdate("/* deleteReportsSensitiveInformation */ DELETE FROM \""
          + TABLE_NAME + "\" WHERE uuid = :uuid").bind("uuid", rsi.getUuid()).execute();
      AnetAuditLogger.log("Empty ReportSensitiveInformation {} deleted by {} ", rsi, user);
    } else {
      // Update relevant fields, but do not allow the reportUuid to be updated by the query!
      rsi.setUpdatedAt(Instant.now());
      numRows = getDbHandle()
          .createUpdate("/* updateReportsSensitiveInformation */ UPDATE \"" + TABLE_NAME + "\""
              + " SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(rsi).bind("updatedAt", DaoUtils.asLocalDateTime(rsi.getUpdatedAt())).execute();
      AnetAuditLogger.log("ReportSensitiveInformation {} updated by {} ", rsi, user);
    }
    return numRows;
  }

  public Object insertOrUpdate(ReportSensitiveInformation rsi, Person user, Report report) {
    return (DaoUtils.getUuid(rsi) == null) ? insert(rsi, user, report) : update(rsi, user, report);
  }

  @InTransaction
  public CompletableFuture<ReportSensitiveInformation> getForReport(Map<String, Object> context,
      Report report, Person user) {
    if (!isAuthorized(user, report)) {
      return CompletableFuture.completedFuture(null);
    }
    return new ForeignKeyFetcher<ReportSensitiveInformation>()
        .load(context, FkDataLoaderKey.REPORT_REPORT_SENSITIVE_INFORMATION, report.getUuid())
        .thenApply(l -> {
          ReportSensitiveInformation rsi = Utils.isEmptyOrNull(l) ? null : l.get(0);
          if (rsi != null) {
            AnetAuditLogger.log("ReportSensitiveInformation {} retrieved by {} ", rsi, user);
          } else {
            rsi = new ReportSensitiveInformation();
          }
          return rsi;
        });
  }

  /**
   * A user is allowed to access a report's sensitive information if either of the following holds
   * true: • the user is the author of the report; • the user is in an authorization group for the
   * report.
   *
   * @param user the user executing the request
   * @param report the report
   * @return true if the user is allowed to access the report's sensitive information
   */
  private boolean isAuthorized(Person user, Report report) {
    final String userUuid = DaoUtils.getUuid(user);
    final String reportUuid = DaoUtils.getUuid(report);
    if (userUuid == null || reportUuid == null) {
      // No user or no report
      return false;
    }
    if (Objects.equals(userUuid, report.getAuthorUuid())) {
      // Author is always authorized
      return true;
    }

    // Check authorization groups
    final Query query = getDbHandle()
        .createQuery("/* checkReportAuthorization */ SELECT COUNT(*) AS count"
            + " FROM \"reportAuthorizationGroups\" rag"
            + " LEFT JOIN \"authorizationGroupPositions\" agp ON agp.\"authorizationGroupUuid\" = rag.\"authorizationGroupUuid\" "
            + " LEFT JOIN positions p ON p.uuid = agp.\"positionUuid\" WHERE rag.\"reportUuid\" = :reportUuid"
            + " AND p.\"currentPersonUuid\" = :userUuid")
        .bind("reportUuid", reportUuid).bind("userUuid", userUuid);
    final Optional<Map<String, Object>> result = query.map(new MapMapper(false)).findFirst();
    return result.isPresent() && ((Number) result.get().get("count")).intValue() > 0;
  }

}
