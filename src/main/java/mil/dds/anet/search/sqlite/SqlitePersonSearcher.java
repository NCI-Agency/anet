package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.search.mssql.MssqlSearchQueryBuilder;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqlitePersonSearcher extends AbstractSearcher implements IPersonSearcher {

  @InTransaction
  @Override
  public AnetBeanList<Person> runSearch(PersonSearchQuery query) {
    final MssqlSearchQueryBuilder<Person, PersonSearchQuery> outerQb =
        new MssqlSearchQueryBuilder<Person, PersonSearchQuery>("SqlitePersonSearch");
    final MssqlSearchQueryBuilder<Person, PersonSearchQuery> innerQb =
        new MssqlSearchQueryBuilder<Person, PersonSearchQuery>("SqlitePersonSearch");
    innerQb.addSelectClause("people.uuid");
    innerQb.addFromClause("people");

    if (query.getOrgUuid() != null || query.getLocationUuid() != null
        || query.getMatchPositionName()) {
      innerQb.addFromClause("LEFT JOIN positions ON people.uuid = positions.\"currentPersonUuid\"");
    }

    if (query.isTextPresent()) {
      if (query.getMatchPositionName()) {
        innerQb.addWhereClause("(people.name LIKE '%' || :text || '%'"
            + " OR \"emailAddress\" LIKE '%' || :text || '%'"
            + " OR biography LIKE '%' || :text || '%' OR positions.name LIKE '%' || :text || '%'"
            + " OR positions.code LIKE '%' || :text || '%')");
      } else {
        innerQb.addWhereClause("(people.name LIKE '%' || :text || '%'"
            + " OR \"emailAddress\" LIKE '%' || :text || '%'"
            + " OR biography LIKE '%' || :text || '%')");
      }
      final String text = query.getText();
      innerQb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
    }

    innerQb.addEqualsClause("role", "people.role", query.getRole());
    innerQb.addInClause("statuses", "people.status", query.getStatus());
    innerQb.addEqualsClause("rank", "people.rank", query.getRank());
    innerQb.addEqualsClause("country", "people.country", query.getCountry());
    innerQb.addEqualsClause("pendingVerification", "people.pendingVerification",
        query.getPendingVerification());

    if (query.getOrgUuid() != null) {
      if (!query.getIncludeChildOrgs()) {
        innerQb.addWhereClause("positions.\"organizationUuid\" = :orgUuid");
      } else {
        innerQb.addWhereClause("positions.\"organizationUuid\" IN ("
            + " WITH RECURSIVE parent_orgs(uuid) AS ("
            + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
            + " SELECT o.uuid from parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
            + ") SELECT uuid from parent_orgs)");
      }
      innerQb.addSqlArg("orgUuid", query.getOrgUuid());
    }

    innerQb.addEqualsClause("locationUuid", "positions.\"locationUuid\"", query.getLocationUuid());

    outerQb.addSelectClause(PersonDao.PERSON_FIELDS);
    outerQb.addFromClause("people");
    outerQb.addSelectClause("people.uuid IN ( " + innerQb.build() + " )");
    outerQb.addSqlArgs(innerQb.getSqlArgs());
    outerQb.addListArgs(innerQb.getListArgs());
    addOrderByClauses(outerQb, query);
    return outerQb.buildAndRun(getDbHandle(), query, new PersonMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PersonSearchQuery query) {
    switch (query.getSortBy()) {
      case RANK:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), null, "people.rank"));
        break;
      case CREATED_AT:
        qb.addAllOrderByClauses(
            Utils.addOrderBy(query.getSortOrder(), null, "people.\"createdAt\""));
        break;
      case NAME:
      default:
        // case-insensitive ordering! could use COLLATE NOCASE but not if we want this to
        // work as a generic new-database searcher for pg/mysql
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), null, "LOWER(people.name)"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, null, "uuid"));
  }

}
