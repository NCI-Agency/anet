package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.time.temporal.ChronoUnit;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.ReportSensitiveInformationDao;
import org.jdbi.v3.core.statement.SqlLogger;
import org.jdbi.v3.core.statement.StatementContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Logger that specifically looks for the very long column definitions that ANET2 uses and will
 * replace them in the log with a shortened version. This just makes the logs easier to read and
 * debug.
 */
public class AnetDbLogger implements SqlLogger {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
  public void logAfterExecution(StatementContext context) {
    final String msg =
        context.getRenderedSql().replace(PersonDao.PERSON_FIELDS, " <PERSON_FIELDS> ")
            .replace(PersonDao.PERSON_FIELDS_NOAS, " <PERSON_FIELDS> ")
            .replace(PositionDao.POSITIONS_FIELDS, " <POSITION_FIELDS> ")
            .replace(OrganizationDao.ORGANIZATION_FIELDS, " <ORGANIZATION_FIELDS> ")
            .replace(ReportDao.REPORT_FIELDS, " <REPORT_FIELDS> ")
            .replace(ReportSensitiveInformationDao.REPORTS_SENSITIVE_INFORMATION_FIELDS,
                " <REPORTS_SENSITIVE_INFORMATION_FIELDS> ")
            .replace(CommentDao.COMMENT_FIELDS, " <COMMENT_FIELDS> ")
            .replaceAll("LEFT JOIN (CONTAINS|FREETEXT)TABLE[^=]*= (\\S+)\\.\\[Key\\]", "<$1_$2>")
            .replaceFirst("LEFT JOIN (mv_fts_\\S+) ON \\S+\\s*=\\s*\\S+", "<$1>")
            .replaceFirst("\\(?(EXP|ISNULL|CASE|ts_rank).* AS (search_rank)", "<$2>");
    logger.debug("{}\t{}", context.getElapsedTime(ChronoUnit.MILLIS), msg);
  }
}
