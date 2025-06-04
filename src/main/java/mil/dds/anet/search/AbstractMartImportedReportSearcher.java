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
    qb.addSelectClause(
        (Utils.isEmptyOrNull(query.getReportUuid()) ? "ON (\"martImportedReports\".\"reportUuid\") "
            : "") + MartImportedReportDao.MART_IMPORTED_REPORTS_FIELDS);
    qb.addFromClause("\"martImportedReports\"");

    if (!Utils.isEmptyOrNull(query.getPersonUuid())) {
      qb.addStringEqualsClause("personUuid", "\"martImportedReports\".\"personUuid\"",
          query.getPersonUuid());
    }
    if (!Utils.isEmptyOrNull(query.getReportUuid())) {
      qb.addStringEqualsClause("reportUuid", "\"martImportedReports\".\"reportUuid\"",
          query.getReportUuid());
    }
    if (query.getState() != null) {
      qb.addEnumEqualsClause("state", "\"martImportedReports\".state", query.getState());
    }
    if (!Utils.isEmptyOrNull(query.getSequences())) {
      qb.addInListClause("sequence", "\"martImportedReports\".sequence", query.getSequences());
    }

    if (Utils.isEmptyOrNull(query.getReportUuid())) {
      qb.addInnerOrderByClause(
          "\"martImportedReports\".\"reportUuid\", \"martImportedReports\".sequence DESC");
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
}
