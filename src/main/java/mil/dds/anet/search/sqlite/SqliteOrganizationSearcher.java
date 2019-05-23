package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteOrganizationSearcher
    extends AbstractSqliteSearcherBase<Organization, OrganizationSearchQuery>
    implements IOrganizationSearcher {

  @Override
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query) {
    start("SqliteOrganizationSearch");
    selectClauses.add("organizations.uuid");
    fromClauses.add("organizations");

    if (query.isTextPresent()) {
      whereClauses
          .add("(\"shortName\" LIKE '%' || :text || '%' OR \"longName\" LIKE '%' || :text || '%')");
      final String text = query.getText();
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    addEqualsClause("status", "organizations.status", query.getStatus());
    addEqualsClause("type", "organizations.type", query.getType());

    if (query.getParentOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getParentOrgRecursively())) {
        whereClauses.add("(organizations.\"parentOrgUuid\" IN ("
            + " WITH RECURSIVE parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :parentOrgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ") SELECT uuid from parent_orgs) OR organizations.uuid = :parentOrgUuid)");
      } else {
        whereClauses.add("organizations.\"parentOrgUuid\" = :parentOrgUuid");
      }
      sqlArgs.put("parentOrgUuid", query.getParentOrgUuid());
    }

    finish(query);
    return getResult(query, new OrganizationMapper());
  }

  @Override
  protected void finish(OrganizationSearchQuery query) {
    addWithClauses();
    sql.append("SELECT " + OrganizationDao.ORGANIZATION_FIELDS
        + " FROM organizations WHERE organizations.uuid IN (");
    addSelectClauses();
    addFromClauses();
    addWhereClauses();
    sql.append(")");
    addOrderByClauses(query);
  }

  @Override
  protected void getOrderByClauses(OrganizationSearchQuery query) {
    orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "organizations", "\"shortName\""));
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "organizations", "uuid"));
  }

}
