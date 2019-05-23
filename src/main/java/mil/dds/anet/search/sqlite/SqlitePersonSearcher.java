package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.utils.Utils;

public class SqlitePersonSearcher extends AbstractSqliteSearcherBase<Person, PersonSearchQuery>
    implements IPersonSearcher {

  @Override
  public AnetBeanList<Person> runSearch(PersonSearchQuery query) {
    start("SqlitePersonSearch");
    selectClauses.add("people.uuid");
    fromClauses.add("people");

    if (query.getOrgUuid() != null || query.getLocationUuid() != null
        || query.getMatchPositionName()) {
      fromClauses.add("LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\"");
    }

    if (query.isTextPresent()) {
      if (query.getMatchPositionName()) {
        whereClauses.add("(people.name LIKE '%' || :text || '%'"
            + " OR \"emailAddress\" LIKE '%' || :text || '%'"
            + " OR biography LIKE '%' || :text || '%' OR positions.name LIKE '%' || :text || '%'"
            + " OR positions.code LIKE '%' || :text || '%')");
      } else {
        whereClauses.add("(people.name LIKE '%' || :text || '%'"
            + " OR \"emailAddress\" LIKE '%' || :text || '%'"
            + " OR biography LIKE '%' || :text || '%')");
      }
      final String text = query.getText();
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    addEqualsClause("role", "people.role", query.getRole());
    addInClause("statuses", "people.status", query.getStatus());
    addEqualsClause("rank", "people.rank", query.getRank());
    addEqualsClause("country", "people.country", query.getCountry());
    addEqualsClause("pendingVerification", "people.pendingVerification",
        query.getPendingVerification());

    if (query.getOrgUuid() != null) {
      if (!query.getIncludeChildOrgs()) {
        whereClauses.add("positions.\"organizationUuid\" = :orgUuid");
      } else {
        whereClauses.add("positions.\"organizationUuid\" IN ("
            + " WITH RECURSIVE parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ") SELECT uuid from parent_orgs)");
      }
      sqlArgs.put("orgUuid", query.getOrgUuid());
    }

    addEqualsClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());

    finish(query);
    return getResult(query, new PersonMapper());
  }

  @Override
  protected void finish(PersonSearchQuery query) {
    addWithClauses();
    sql.append("SELECT " + PersonDao.PERSON_FIELDS + " FROM people WHERE people.uuid IN (");
    addSelectClauses();
    addFromClauses();
    addWhereClauses();
    sql.append(")");
    addOrderByClauses(query);
  }

  @Override
  protected void getOrderByClauses(PersonSearchQuery query) {
    switch (query.getSortBy()) {
      case RANK:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "people.rank"));
        break;
      case CREATED_AT:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "people.\"createdAt\""));
        break;
      case NAME:
      default:
        // case-insensitive ordering! could use COLLATE NOCASE but not if we want this to
        // work as a generic new-database searcher for pg/mysql
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "LOWER(people.name)"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, null, "uuid"));
  }

}
