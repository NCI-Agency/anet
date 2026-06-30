package mil.dds.anet.search;

import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.search.MartImportedReportSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.MartImportedReportDao;
import mil.dds.anet.database.mappers.MartImportedReportMapper;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractMartImportedReportSearcher
    extends AbstractSearcher<MartImportedReport, MartImportedReportSearchQuery>
    implements IMartImportedReportSearcher {

  protected AbstractMartImportedReportSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<MartImportedReport, MartImportedReportSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<MartImportedReport> runSearch(final MartImportedReportSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new MartImportedReportMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(final MartImportedReportSearchQuery query) {
    final String tableName = String.format("\"%s\"", MartImportedReportDao.TABLE_NAME);
    final boolean applyGrouping = applyGrouping(query);
    qb.addSelectClause((applyGrouping ? "ON (" + tableName + ".\"reportUuid\") " : "")
        + MartImportedReportDao.MART_IMPORTED_REPORTS_FIELDS);
    qb.addFromClause(tableName);

    // Add the count for each imported report
    qb.addWithClause(
        "mir2 AS (SELECT COUNT(*), \"reportUuid\" FROM " + tableName + " GROUP BY \"reportUuid\")");
    qb.addSelectClause("mir2.count AS \"martImportedReports_historyCount\"");
    qb.addFromClause(", mir2");
    qb.addWhereClause("mir2.\"reportUuid\" = " + tableName + ".\"reportUuid\"");

    if (!Utils.isEmptyOrNull(query.getPersonUuid())) {
      qb.addStringEqualsClause("personUuid", tableName + ".\"personUuid\"", query.getPersonUuid());
    }
    if (!Utils.isEmptyOrNull(query.getReportUuid())) {
      qb.addStringEqualsClause("reportUuid", tableName + ".\"reportUuid\"", query.getReportUuid());
    }
    if (query.getState() != null) {
      qb.addEnumEqualsClause("state", tableName + ".state", query.getState());
    }
    if (!Utils.isEmptyOrNull(query.getSequences())) {
      qb.addInListClause("sequence", tableName + ".sequence", query.getSequences());
    }
    if (applyGrouping) {
      qb.addInnerOrderByClause(tableName + ".\"reportUuid\", " + tableName + ".sequence DESC");
    }
    addOrderByClauses(qb, query);
  }

  @Override
  protected void addTextQuery(final MartImportedReportSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void addOrderByClauses(final AbstractSearchQueryBuilder<?, ?> qb,
      final MartImportedReportSearchQuery query) {
    switch (query.getSortBy()) {
      case SEQUENCE:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "martImportedReports_sequence"));
        break;
      case SUBMITTED_AT:
        qb.addAllOrderByClauses(
            getOrderBy(query.getSortOrder(), "martImportedReports_submittedAt"));
        break;
      case RECEIVED_AT:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "martImportedReports_receivedAt"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "martImportedReports_sequence"));
  }

  private boolean applyGrouping(MartImportedReportSearchQuery query) {
    return Utils.isEmptyOrNull(query.getReportUuid()) && Utils.isEmptyOrNull(query.getSequences());
  }
}
