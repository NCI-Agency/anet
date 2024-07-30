package mil.dds.anet.threads;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.beans.Report;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.emails.FutureEngagementUpdated;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false}")
public class FutureEngagementWorker extends AbstractWorker {

  private final ReportDao dao;

  public FutureEngagementWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao, ReportDao dao) {
    super(dict, jobHistoryDao,
        "Future Engagement Worker waking up to check for Future Engagements");
    this.dao = dao;
  }

  @Scheduled(initialDelay = 15, fixedRate = 10800, timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    super.run();
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    // Get a list of all reports related to upcoming engagements which have just
    // become past engagements and need to change their report status to draft.
    // When a report is for an engagement which just moved from future to past
    // engagement, it needs to get the draft status again as the report author
    // needs to fill in extra information after the engagement took place and
    // afterwards this report needs to go through the approval process of past
    // engagements.
    List<Report> reports = engine().getReportDao().getFutureToPastReports(now);

    // update to draft state and send emails to the authors to let them know we updated their
    // report.
    reports.forEach(r -> {
      try {
        final FutureEngagementUpdated action = new FutureEngagementUpdated();
        action.setReport(r);
        ReportDao.sendEmailToReportAuthors(action, r);
        dao.updateToDraftState(r);
      } catch (Exception e) {
        logger.error("Exception when updating", e);
      }
    });
  }

}
