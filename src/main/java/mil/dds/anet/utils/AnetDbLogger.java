package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import java.time.temporal.ChronoUnit;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.ReportSensitiveInformationDao;
import mil.dds.anet.database.SubscriptionDao;
import mil.dds.anet.database.SubscriptionUpdateDao;
import mil.dds.anet.database.TaskDao;
import org.jdbi.v3.core.statement.SqlLogger;
import org.jdbi.v3.core.statement.StatementContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Logger that specifically looks for the very long column definitions that ANET uses and will
 * replace them in the log with a shortened version. This just makes the logs easier to read and
 * debug.
 */
public class AnetDbLogger implements SqlLogger {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
  public void logAfterExecution(StatementContext context) {
    final String renderedSql = context.getRenderedSql();
    if (logger.isDebugEnabled() && renderedSql != null
        && !renderedSql.startsWith("INSERT INTO \"userActivities\"")) {
      final String msg =
          renderedSql.replace(AttachmentDao.ATTACHMENT_FIELDS, " <ATTACHMENT_FIELDS> ")
              .replace(AuthorizationGroupDao.AUTHORIZATION_GROUP_FIELDS,
                  " <AUTHORIZATION_GROUP_FIELDS> ")
              .replace(CommentDao.COMMENT_FIELDS, " <COMMENT_FIELDS> ")
              .replace(EmailAddressDao.EMAIL_ADDRESS_FIELDS, " <EMAIL_ADDRESS_FIELDS> ")
              .replace(LocationDao.LOCATION_FIELDS, " <LOCATION_FIELDS> ")
              .replace(OrganizationDao.ORGANIZATION_FIELDS, " <ORGANIZATION_FIELDS> ")
              .replace(PersonDao.PERSON_FIELDS, " <PERSON_FIELDS> ")
              .replace(PositionDao.POSITION_FIELDS, " <POSITION_FIELDS> ")
              .replace(ReportDao.REPORT_FIELDS, " <REPORT_FIELDS> ")
              .replace(ReportSensitiveInformationDao.REPORT_SENSITIVE_INFORMATION_FIELDS,
                  " <REPORT_SENSITIVE_INFORMATION_FIELDS> ")
              .replace(SubscriptionDao.SUBSCRIPTION_FIELDS, " <SUBSCRIPTION_FIELDS> ")
              .replace(SubscriptionUpdateDao.SUBSCRIPTION_UPDATE_FIELDS,
                  " <SUBSCRIPTION_UPDATE_FIELDS> ")
              .replace(TaskDao.TASK_FIELDS, " <TASK_FIELDS> ")
              .replaceFirst("LEFT JOIN (mv_fts_\\S+) ON \\S+\\s*=\\s*\\S+", "<$1>")
              .replaceFirst("\\(?(EXP|ISNULL|CASE|ts_rank).* AS (search_rank)", "<$2>");
      logger.debug("{}\t{}", context.getElapsedTime(ChronoUnit.MILLIS), msg);
    }
  }
}
