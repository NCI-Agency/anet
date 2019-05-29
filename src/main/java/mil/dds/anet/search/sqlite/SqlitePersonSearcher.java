package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractPersonSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqlitePersonSearcher extends AbstractPersonSearcher {

  private final SqliteSearchQueryBuilder<Person, PersonSearchQuery> outerQb;

  public SqlitePersonSearcher() {
    super(new SqliteSearchQueryBuilder<Person, PersonSearchQuery>(""));
    outerQb = new SqliteSearchQueryBuilder<Person, PersonSearchQuery>("SqlitePersonSearch");
  }

  @InTransaction
  @Override
  public AnetBeanList<Person> runSearch(PersonSearchQuery query) {
    buildQuery(query);
    outerQb.addSelectClause(PersonDao.PERSON_FIELDS);
    outerQb.addFromClause("people");
    outerQb.addSelectClause("people.uuid IN ( " + qb.build() + " )");
    outerQb.addSqlArgs(qb.getSqlArgs());
    outerQb.addListArgs(qb.getListArgs());
    return outerQb.buildAndRun(getDbHandle(), query, new PersonMapper());
  }

  @Override
  protected void addTextQuery(PersonSearchQuery query) {
    if (query.getMatchPositionName()) {
      qb.addWhereClause("(people.name LIKE '%' || :text || '%'"
          + " OR people.\"emailAddress\" LIKE '%' || :text || '%'"
          + " OR people.biography LIKE '%' || :text || '%'"
          + " OR positions.name LIKE '%' || :text || '%'"
          + " OR positions.code LIKE '%' || :text || '%')");
    } else {
      qb.addWhereClause("(people.name LIKE '%' || :text || '%'"
          + " OR people.\"emailAddress\" LIKE '%' || :text || '%'"
          + " OR people.biography LIKE '%' || :text || '%')");
    }
    final String text = query.getText();
    qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
  }

  @Override
  protected void addOrgUuidQuery(PersonSearchQuery query) {
    if (!query.getIncludeChildOrgs()) {
      qb.addWhereClause("positions.\"organizationUuid\" = :orgUuid");
    } else {
      qb.addWhereClause("positions.\"organizationUuid\" IN ("
          + " WITH RECURSIVE parent_orgs(uuid) AS ("
          + " SELECT uuid FROM organizations WHERE uuid = :orgUuid UNION ALL"
          + " SELECT o.uuid FROM parent_orgs po, organizations o WHERE o.\"parentOrgUuid\" = po.uuid"
          + ") SELECT uuid FROM parent_orgs)");
    }
    qb.addSqlArg("orgUuid", query.getOrgUuid());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PersonSearchQuery query) {
    super.addOrderByClauses(outerQb, query);
  }

}
