package mil.dds.anet.database;

import javax.inject.Inject;
import mil.dds.anet.utils.AnetDbLogger;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.statement.SqlStatements;

public class StatementLogger {

  @Inject
  public StatementLogger(final Jdbi jdbi) {
    final SqlStatements sqlStatements = jdbi.getConfig(SqlStatements.class);
    sqlStatements.setSqlLogger(new AnetDbLogger());
  }

}
