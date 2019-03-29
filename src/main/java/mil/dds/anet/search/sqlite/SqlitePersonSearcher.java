package mil.dds.anet.search.sqlite;

import com.google.common.base.Joiner;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.PersonSearchQuery.PersonSearchSortBy;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.Query;

public class SqlitePersonSearcher extends AbstractSearcherBase implements IPersonSearcher {

  protected String buildOrderBy(PersonSearchQuery query) {
    if (query.getSortBy() == null) {
      query.setSortBy(PersonSearchSortBy.NAME);
    }
    if (query.getSortOrder() == null) {
      query.setSortOrder(SortOrder.ASC);
    }
    StringBuilder orderBy = new StringBuilder(" ORDER BY ");
    switch (query.getSortBy()) {
      case RANK:
        orderBy.append("people.rank");
        break;
      case CREATED_AT:
        orderBy.append("people.\"createdAt\"");
        break;
      case NAME:
      default:
        // case-insensitive ordering! could use COLLATE NOCASE but not if we want this to
        // work as a generic new-database searcher for pg/mysql
        orderBy.append("LOWER(people.\"name\")");
        break;
    }
    switch (query.getSortOrder()) {
      case ASC:
        orderBy.append(" ASC ");
        break;
      case DESC:
      default:
        orderBy.append(" DESC ");
        break;
    }

    return orderBy.toString();
  }

  @Override
  public AnetBeanList<Person> runSearch(PersonSearchQuery query, Person user) {
    StringBuilder sql =
        new StringBuilder("/* SqlitePersonSearch */ SELECT " + PersonDao.PERSON_FIELDS
            + " FROM people WHERE people.uuid IN (SELECT people.uuid FROM people ");
    Map<String, Object> sqlArgs = new HashMap<String, Object>();
    final Map<String, List<?>> listArgs = new HashMap<>();

    if (query.getOrgUuid() != null || query.getLocationUuid() != null
        || query.getMatchPositionName()) {
      sql.append(" LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\" ");
    }

    sql.append(" WHERE ");
    List<String> whereClauses = new LinkedList<String>();
    final AnetBeanList<Person> result =
        new AnetBeanList<Person>(query.getPageNum(), query.getPageSize(), new ArrayList<Person>());

    final String text = query.getText();
    final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
    if (doFullTextSearch) {
      if (query.getMatchPositionName()) {
        whereClauses.add("(people.name LIKE '%' || :text || '%' "
            + "OR \"emailAddress\" LIKE '%' || :text || '%' "
            + "OR biography LIKE '%' || :text || '%'" + "OR positions.name LIKE '%' || :text || '%'"
            + "OR positions.code LIKE '%' || :text || '%')");
      } else {
        whereClauses.add("(people.name LIKE '%' || :text || '%' "
            + "OR \"emailAddress\" LIKE '%' || :text || '%' "
            + "OR biography LIKE '%' || :text || '%')");
      }
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    if (query.getRole() != null) {
      whereClauses.add(" people.role = :role ");
      sqlArgs.put("role", DaoUtils.getEnumId(query.getRole()));
    }

    if (!Utils.isEmptyOrNull(query.getStatus())) {
      whereClauses.add("people.status IN ( <statuses> )");
      listArgs.put("statuses", query.getStatus().stream().map(status -> DaoUtils.getEnumId(status))
          .collect(Collectors.toList()));
    }

    if (query.getRank() != null && query.getRank().trim().length() > 0) {
      whereClauses.add(" people.rank = :rank ");
      sqlArgs.put("rank", query.getRank());
    }

    if (query.getCountry() != null && query.getCountry().trim().length() > 0) {
      whereClauses.add(" people.country = :country ");
      sqlArgs.put("country", query.getCountry());
    }

    if (query.getPendingVerification() != null) {
      whereClauses.add(" people.\"pendingVerification\" = :pendingVerification ");
      sqlArgs.put("pendingVerification", query.getPendingVerification());
    }

    if (query.getOrgUuid() != null) {
      if (query.getIncludeChildOrgs() != null && query.getIncludeChildOrgs()) {
        whereClauses.add(" positions.\"organizationUuid\" IN ( "
            + "WITH RECURSIVE parent_orgs(uuid) AS ( "
            + "SELECT uuid FROM organizations WHERE uuid = :orgUuid " + "UNION ALL "
            + "SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid "
            + ") SELECT uuid from parent_orgs)");
      } else {
        whereClauses.add(" positions.\"organizationUuid\" = :orgUuid ");
      }
      sqlArgs.put("orgUuid", query.getOrgUuid());
    }

    if (query.getLocationUuid() != null) {
      whereClauses.add(" positions.\"locationUuid\" = :locationUuid ");
      sqlArgs.put("locationUuid", query.getLocationUuid());
    }

    if (whereClauses.size() == 0) {
      return result;
    }

    sql.append(Joiner.on(" AND ").join(whereClauses));

    // Sort Ordering
    String orderBy = buildOrderBy(query);
    sql.append(orderBy);
    sql.append(" LIMIT :limit OFFSET :offset)");
    // append outside the subselect to enforce ordering there
    sql.append(orderBy);

    final Query q = getDbHandle().createQuery(sql.toString()).bindMap(sqlArgs)
        .bind("offset", query.getPageSize() * query.getPageNum())
        .bind("limit", query.getPageSize());
    for (final Map.Entry<String, List<?>> listArg : listArgs.entrySet()) {
      q.bindList(listArg.getKey(), listArg.getValue());
    }
    final List<Person> list = q.map(new PersonMapper()).list();
    result.setList(list);
    result.setTotalCount(list.size()); // Sqlite cannot do true total counts, so this is a crutch.
    return result;
  }



}
