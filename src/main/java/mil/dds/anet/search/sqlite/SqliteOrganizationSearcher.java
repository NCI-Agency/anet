package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.search.AbstractOrganizationSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqliteOrganizationSearcher extends AbstractOrganizationSearcher {

  private final SqliteSearchQueryBuilder<Organization, OrganizationSearchQuery> outerQb;

  public SqliteOrganizationSearcher() {
    super(new SqliteSearchQueryBuilder<Organization, OrganizationSearchQuery>(""));
    outerQb = new SqliteSearchQueryBuilder<Organization, OrganizationSearchQuery>(
        "SqliteOrganizationSearch");
  }

  @InTransaction
  @Override
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query) {
    buildQuery(query);
    outerQb.addSelectClause(OrganizationDao.ORGANIZATION_FIELDS);
    outerQb.addFromClause("organizations");
    outerQb.addSelectClause("organizations.uuid IN ( " + qb.build() + " )");
    outerQb.addSqlArgs(qb.getSqlArgs());
    outerQb.addListArgs(qb.getListArgs());
    return outerQb.buildAndRun(getDbHandle(), query, new OrganizationMapper());
  }

  @Override
  protected void addTextQuery(OrganizationSearchQuery query) {
    qb.addWhereClause(
        "(organizations.\"shortName\" LIKE '%' || :text || '%' OR organizations.\"longName\" LIKE '%' || :text || '%')");
    final String text = query.getText();
    qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
  }

  @Override
  protected void addParentOrgUuidQuery(OrganizationSearchQuery query) {
    if (Boolean.TRUE.equals(query.getParentOrgRecursively())) {
      qb.addWhereClause("(organizations.\"parentOrgUuid\" IN ("
          + " WITH RECURSIVE parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :parentOrgUuid UNION ALL"
          + " SELECT o.uuid FROM parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
          + ") SELECT uuid FROM parent_orgs) OR organizations.uuid = :parentOrgUuid)");
    } else {
      qb.addWhereClause("organizations.\"parentOrgUuid\" = :parentOrgUuid");
    }
    qb.addSqlArg("parentOrgUuid", query.getParentOrgUuid());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      OrganizationSearchQuery query) {
    super.addOrderByClauses(outerQb, query);
  }

}
