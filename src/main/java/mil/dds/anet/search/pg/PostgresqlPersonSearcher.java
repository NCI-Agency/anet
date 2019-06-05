package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.search.AbstractPersonSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class PostgresqlPersonSearcher extends AbstractPersonSearcher {

  private final PostgresqlSearchQueryBuilder<Person, PersonSearchQuery> outerQb;

  public PostgresqlPersonSearcher() {
    super(new PostgresqlSearchQueryBuilder<Person, PersonSearchQuery>(""));
    outerQb = new PostgresqlSearchQueryBuilder<Person, PersonSearchQuery>("PostgresqlPersonSearch");
  }

  @Override
  protected void buildQuery(PersonSearchQuery query) {
    qb.addSelectClause("people.uuid");
    super.buildQuery(query);
  }

  @InTransaction
  @Override
  public AnetBeanList<Person> runSearch(PersonSearchQuery query) {
    buildQuery(query);
    outerQb.addSelectClause(PersonDao.PERSON_FIELDS);
    outerQb.addTotalCount();
    outerQb.addFromClause("people");
    outerQb.addWhereClause("people.uuid IN ( " + qb.build() + " )");
    outerQb.addSqlArgs(qb.getSqlArgs());
    outerQb.addListArgs(qb.getListArgs());
    return outerQb.buildAndRun(getDbHandle(), query, new PersonMapper());
  }

  @Override
  protected void addTextQuery(PersonSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    if (query.getMatchPositionName()) {
      qb.addLikeClauses("text", new String[] {"people.name", "people.\"emailAddress\"",
          "people.biography", "positions.name", "positions.code"}, text);
    } else {
      qb.addLikeClauses("text",
          new String[] {"people.name", "people.\"emailAddress\"", "people.biography"}, text);
    }
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
