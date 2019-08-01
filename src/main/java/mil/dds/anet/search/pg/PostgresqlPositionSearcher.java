package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.search.AbstractPositionSearcher;

public class PostgresqlPositionSearcher extends AbstractPositionSearcher {

  public PostgresqlPositionSearcher() {
    super(new PostgresqlSearchQueryBuilder<Position, PositionSearchQuery>(""));
  }

  @Override
  protected void addTextQuery(PositionSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    if (query.getMatchPersonName()) {
      qb.addLikeClauses("text", new String[] {"positions.name", "positions.code", "people.name"},
          text);
    } else {
      qb.addLikeClauses("text", new String[] {"positions.name", "positions.code"}, text);
    }
  }

}
