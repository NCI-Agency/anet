package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqliteOrganizationSearcher extends AbstractSearcher implements IOrganizationSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query) {
    final SqliteSearchQueryBuilder<Organization, OrganizationSearchQuery> outerQb =
        new SqliteSearchQueryBuilder<Organization, OrganizationSearchQuery>("");
    final SqliteSearchQueryBuilder<Organization, OrganizationSearchQuery> innerQb =
        new SqliteSearchQueryBuilder<Organization, OrganizationSearchQuery>(
            "SqliteOrganizationSearch");
    innerQb.addSelectClause("organizations.uuid");
    innerQb.addFromClause("organizations");

    if (query.isTextPresent()) {
      innerQb.addWhereClause(
          "(organizations.\"shortName\" LIKE '%' || :text || '%' OR organizations.\"longName\" LIKE '%' || :text || '%')");
      final String text = query.getText();
      innerQb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
    }

    innerQb.addEqualsClause("status", "organizations.status", query.getStatus());
    innerQb.addEqualsClause("type", "organizations.type", query.getType());

    if (query.getParentOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getParentOrgRecursively())) {
        innerQb.addWhereClause("(organizations.\"parentOrgUuid\" IN ("
            + " WITH RECURSIVE parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :parentOrgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ") SELECT uuid from parent_orgs) OR organizations.uuid = :parentOrgUuid)");
      } else {
        innerQb.addWhereClause("organizations.\"parentOrgUuid\" = :parentOrgUuid");
      }
      innerQb.addSqlArg("parentOrgUuid", query.getParentOrgUuid());
    }

    outerQb.addSelectClause(OrganizationDao.ORGANIZATION_FIELDS);
    outerQb.addFromClause("organizations");
    outerQb.addSelectClause("organizations.uuid IN ( " + innerQb.build() + " )");
    outerQb.addSqlArgs(innerQb.getSqlArgs());
    outerQb.addListArgs(innerQb.getListArgs());
    addOrderByClauses(outerQb, query);
    return outerQb.buildAndRun(getDbHandle(), query, new OrganizationMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      OrganizationSearchQuery query) {
    qb.addAllOrderByClauses(
        Utils.addOrderBy(query.getSortOrder(), "organizations", "\"shortName\""));
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, "organizations", "uuid"));
  }

}
