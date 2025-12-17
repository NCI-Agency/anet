package mil.dds.anet.search;

import mil.dds.anet.beans.AuditTrail;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuditTrailSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.mappers.AuditTrailMapper;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractAuditTrailSearcher
    extends AbstractSearcher<AuditTrail, AuditTrailSearchQuery> implements IAuditTrailSearcher {

  protected AbstractAuditTrailSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<AuditTrail, AuditTrailSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<AuditTrail> runSearch(AuditTrailSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new AuditTrailMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(AuditTrailSearchQuery query) {
    final String quotedTableName = "\"" + AuditTrailDao.TABLE_NAME + "\"";
    qb.addSelectClause(AuditTrailDao.AUDIT_TRAIL_FIELDS);
    qb.addFromClause(quotedTableName);

    qb.addEnumEqualsClause("updateType", quotedTableName + ".\"updateType\"",
        query.getUpdateType());

    if (!Utils.isEmptyOrNull(query.getPersonUuid())) {
      qb.addStringEqualsClause("personUuid", quotedTableName + ".\"personUuid\"",
          query.getPersonUuid());
    }

    if (query.getRelatedObjectUuid() != null) {
      qb.addStringEqualsClause("relatedObjectUuid", quotedTableName + ".\"relatedObjectUuid\"",
          query.getRelatedObjectUuid());
    } else {
      // Must be admin to see everything
      AuthUtils.assertAdministrator(query.getUser());
    }

    addOrderByClauses(qb, query);
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AuditTrailSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "auditTrail_createdAt"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(ISearchQuery.SortOrder.ASC, "auditTrail_uuid"));
  }

}
