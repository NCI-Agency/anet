package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.search.AbstractPersonSearcher;

public class PostgresqlPersonSearcher extends AbstractPersonSearcher {

  public PostgresqlPersonSearcher() {
    super(new PostgresqlSearchQueryBuilder<Person, PersonSearchQuery>("PostgresqlPersonSearch"));
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

}
