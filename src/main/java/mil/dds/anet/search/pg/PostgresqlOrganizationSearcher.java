package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.search.AbstractOrganizationSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class PostgresqlOrganizationSearcher extends AbstractOrganizationSearcher {

  private final PostgresqlSearchQueryBuilder<Organization, OrganizationSearchQuery> outerQb;

  public PostgresqlOrganizationSearcher() {
    super(new PostgresqlSearchQueryBuilder<Organization, OrganizationSearchQuery>(""));
    outerQb = new PostgresqlSearchQueryBuilder<Organization, OrganizationSearchQuery>(
        "PostgresqlOrganizationSearch");
  }

  @Override
  protected void buildQuery(OrganizationSearchQuery query, Person user) {
    qb.addSelectClause("organizations.uuid");
    super.buildQuery(query, user);
  }

  @InTransaction
  @Override
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query, Person user) {
    buildQuery(query, user);
    outerQb.addSelectClause(OrganizationDao.ORGANIZATION_FIELDS);
    outerQb.addTotalCount();
    outerQb.addFromClause("organizations");
    outerQb.addWhereClause("organizations.uuid IN ( " + qb.build() + " )");
    outerQb.addSqlArgs(qb.getSqlArgs());
    outerQb.addListArgs(qb.getListArgs());
    return outerQb.buildAndRun(getDbHandle(), query, new OrganizationMapper());
  }

  @Override
  protected void addTextQuery(OrganizationSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClauses("text",
        new String[] {"organizations.\"shortName\"", "organizations.\"longName\""}, text);
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
