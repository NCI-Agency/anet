package mil.dds.anet.database;

import mil.dds.anet.utils.AnetDbLogger;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.statement.SqlStatements;
import org.springframework.stereotype.Component;

@Component
public class StatementLogger {

  public StatementLogger(final Jdbi jdbi) {
    final SqlStatements sqlStatements = jdbi.getConfig(SqlStatements.class);
    sqlStatements.setSqlLogger(new AnetDbLogger());
  }

}
