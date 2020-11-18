package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.beans.Report;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.emails.FutureEngagementUpdated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FutureEngagementWorker extends AbstractWorker {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private ReportDao dao;

  public FutureEngagementWorker(ReportDao dao) {
    super("Future Engagement Worker waking up to check for Future Engagements");
    this.dao = dao;
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory) {
    // Get a list of all reports related to upcoming engagements which have just
    // become past engagements and need to change their report status to draft.
    // When a report is for an engagement which just moved from future to past
    // engagement, it needs to get the draft status again as the report author
    // needs to fill in extra information after the engagement took place and
    // afterwards this report needs to go through the approval process of past
    // engagements.
    List<Report> reports =
        AnetObjectEngine.getInstance().getReportDao().getFutureToPastReports(now);

    // update to draft state and send emails to the authors to let them know we updated their
    // report.
    final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
    for (Report r : reports) {
      try {
        AnetEmail email = new AnetEmail();
        FutureEngagementUpdated action = new FutureEngagementUpdated();
        action.setReport(r);
        email.setAction(action);
        email.setToAddresses(r.loadAuthors(context).join().stream().map(rp -> rp.getEmailAddress())
            .collect(Collectors.toList()));
        AnetEmailWorker.sendEmailAsync(email);
        dao.updateToDraftState(r);
      } catch (Exception e) {
        logger.error("Exception when updating", e);
      }
    }
  }

}
