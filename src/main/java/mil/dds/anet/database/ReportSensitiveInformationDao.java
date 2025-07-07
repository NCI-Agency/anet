package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.ReportSensitiveInformationMapper;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ReportSensitiveInformationDao
    extends AnetBaseDao<ReportSensitiveInformation, AbstractSearchQuery<?>> {

  private static final String[] fields = {"uuid", "text", "reportUuid", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "reportsSensitiveInformation";
  public static final String REPORT_SENSITIVE_INFORMATION_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public ReportSensitiveInformationDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public ReportSensitiveInformation getByUuid(String uuid) {
    throw new UnsupportedOperationException();
  }

  @Override
  public List<ReportSensitiveInformation> getByIds(List<String> reportUuids) {
    throw new UnsupportedOperationException();
  }

  class ReportsSensitiveInformationBatcher extends ForeignKeyBatcher<ReportSensitiveInformation> {
    private static final String SQL =
        "/* batch.getReportSensitiveInformationsByReportUuids */ SELECT "
            + REPORT_SENSITIVE_INFORMATION_FIELDS + " FROM \"" + TABLE_NAME + "\""
            + " WHERE \"reportUuid\" IN ( <foreignKeys> )";

    public ReportsSensitiveInformationBatcher() {
      super(ReportSensitiveInformationDao.this.databaseHandler, SQL, "foreignKeys",
          new ReportSensitiveInformationMapper(), "reportsSensitiveInformation_reportUuid");
    }
  }

  public List<List<ReportSensitiveInformation>> getReportSensitiveInformation(
      List<String> foreignKeys) {
    return new ReportsSensitiveInformationBatcher().getByForeignKeys(foreignKeys);
  }

  @Override
  public ReportSensitiveInformation insertInternal(ReportSensitiveInformation rsi) {
    throw new UnsupportedOperationException();
  }

  @Transactional
  public ReportSensitiveInformation insert(ReportSensitiveInformation rsi, Person user,
      Report report) {
    final Handle handle = getDbHandle();
    try {
      if (rsi == null || !isAuthorized(user, report) || Utils.isEmptyHtml(rsi.getText())) {
        return null;
      }
      DaoUtils.setInsertFields(rsi);
      handle
          .createUpdate("/* insertReportsSensitiveInformation */ INSERT INTO \"" + TABLE_NAME
              + "\" " + " (uuid, text, \"reportUuid\", \"createdAt\", \"updatedAt\") "
              + "VALUES (:uuid, :text, :reportUuid, :createdAt, :updatedAt)")
          .bindBean(rsi).bind("createdAt", DaoUtils.asLocalDateTime(rsi.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(rsi.getUpdatedAt()))
          .bind("reportUuid", report.getUuid()).execute();
      AnetAuditLogger.log("ReportSensitiveInformation {} created by {} ", rsi, user);
      return rsi;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(ReportSensitiveInformation rsi) {
    throw new UnsupportedOperationException();
  }

  @Transactional
  public int update(ReportSensitiveInformation rsi, Person user, Report report) {
    final Handle handle = getDbHandle();
    try {
      if (rsi == null || !isAuthorized(user, report)) {
        return 0;
      }
      final int numRows;
      if (Utils.isEmptyHtml(rsi.getText())) {
        numRows = handle.createUpdate("/* deleteReportsSensitiveInformation */ DELETE FROM \""
            + TABLE_NAME + "\" WHERE uuid = :uuid").bind("uuid", rsi.getUuid()).execute();
        AnetAuditLogger.log("Empty ReportSensitiveInformation {} deleted by {} ", rsi, user);
      } else {
        // Update relevant fields, but do not allow the reportUuid to be updated by the query!
        rsi.setUpdatedAt(Instant.now());
        numRows = handle
            .createUpdate("/* updateReportsSensitiveInformation */ UPDATE \"" + TABLE_NAME + "\""
                + " SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
            .bindBean(rsi).bind("updatedAt", DaoUtils.asLocalDateTime(rsi.getUpdatedAt()))
            .execute();
        AnetAuditLogger.log("ReportSensitiveInformation {} updated by {} ", rsi, user);
      }
      return numRows;
    } finally {
      closeDbHandle(handle);
    }
  }

  public Object insertOrUpdate(ReportSensitiveInformation rsi, Person user, Report report) {
    return (DaoUtils.getUuid(rsi) == null) ? insert(rsi, user, report) : update(rsi, user, report);
  }

  @Transactional
  public CompletableFuture<ReportSensitiveInformation> getForReport(GraphQLContext context,
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
   * true: • the user is an author of the report; • the user is in a community for the report.
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
    if (report.isAuthor(user)) {
      // Author is always authorized
      return true;
    }

    // Check communities
    final ReportDao reportDao = engine().getReportDao();
    final List<String> authorizationGroupUuids =
        reportDao.getAuthorizationGroupsForReport(reportUuid).stream()
            .map(AbstractAnetBean::getUuid).toList();
    final Set<String> userAuthorizationGroupUuids = DaoUtils.getAuthorizationGroupUuids(user);
    return DaoUtils.isInAuthorizationGroup(userAuthorizationGroupUuids, authorizationGroupUuids);
  }

}
