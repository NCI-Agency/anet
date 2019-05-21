package mil.dds.anet.search.sqlite;

import com.google.common.base.Joiner;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class SqliteOrganizationSearcher extends AbstractSearcherBase
    implements IOrganizationSearcher {

  @Override
  public AnetBeanList<Organization> runSearch(OrganizationSearchQuery query) {
    StringBuilder sql = new StringBuilder("/* SqliteOrganizationSearch */ SELECT "
        + OrganizationDao.ORGANIZATION_FIELDS
        + " FROM organizations WHERE organizations.uuid IN (SELECT organizations.uuid FROM organizations ");
    Map<String, Object> sqlArgs = new HashMap<String, Object>();

    sql.append(" WHERE ");
    List<String> whereClauses = new LinkedList<String>();
    final AnetBeanList<Organization> result = new AnetBeanList<Organization>(query.getPageNum(),
        query.getPageSize(), new ArrayList<Organization>());

    final boolean doFullTextSearch = query.isTextPresent();
    if (doFullTextSearch) {
      final String text = query.getText();
      whereClauses.add(
          "(\"shortName\" LIKE '%' || :text || '%' OR \"longName\" LIKE '%' || :text || '%' )");
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    if (query.getStatus() != null) {
      whereClauses.add("organizations.status = :status");
      sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus()));
    }

    if (query.getType() != null) {
      whereClauses.add(" organizations.type = :type ");
      sqlArgs.put("type", DaoUtils.getEnumId(query.getType()));
    }

    if (query.getParentOrgUuid() != null) {
      if (Boolean.TRUE.equals(query.getParentOrgRecursively())) {
        whereClauses.add("(organizations.\"parentOrgUuid\" IN ("
            + "WITH RECURSIVE parent_orgs(uuid) AS ( "
            + "SELECT uuid FROM organizations WHERE uuid = :parentOrgUuid " + "UNION ALL "
            + "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
            + ") SELECT uuid from parent_orgs) OR organizations.uuid = :parentOrgUuid)");
      } else {
        whereClauses.add("organizations.\"parentOrgUuid\" = :parentOrgUuid");
      }
      sqlArgs.put("parentOrgUuid", query.getParentOrgUuid());
    }

    if (whereClauses.size() == 0) {
      return result;
    }

    sql.append(Joiner.on(" AND ").join(whereClauses));

    sql.append(" LIMIT :limit OFFSET :offset)");

    List<Organization> list = getDbHandle().createQuery(sql.toString()).bindMap(sqlArgs)
        .bind("offset", query.getPageSize() * query.getPageNum()).bind("limit", query.getPageSize())
        .map(new OrganizationMapper()).list();


    result.setList(list);
    // Sqlite cannot do true total counts, so this is a crutch.
    result.setTotalCount(result.getList().size());
    return result;
  }

}
