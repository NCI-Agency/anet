package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.emails.FutureEngagementUpdated;
import mil.dds.anet.utils.DaoUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FutureEngagementWorker implements Runnable {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private ReportDao dao;

  public FutureEngagementWorker(ReportDao dao) {
    this.dao = dao;
  }

  @Override
  public void run() {
    logger.debug("Future Engagement Worker waking up to check for Future Engagements");
    try {
      runInternal();
    } catch (Throwable e) {
      // CAnnot let this thread die. Otherwise ANET will stop checking for future engagements.
      logger.error("Exception in run()", e);
    }
  }

  private void runInternal() {
    // Get a list of all reports related to upcoming engagements which have just
    // become past engagements and need to change their report status to draft.
    // When a report is for an engagement which just moved from future to past
    // engagement, it needs to get the draft status again as the report author
    // needs to fill in extra information after the engagement took place and
    // afterwards this report needs to go through the approval process of past
    // engagements.
    Instant endOfToday = Instant.now().atZone(DaoUtils.getDefaultZoneId()).withHour(23)
        .withMinute(59).withSecond(59).withNano(999999999).toInstant();
    List<Report> reports =
        AnetObjectEngine.getInstance().getReportDao().getFutureToPastReports(endOfToday);

    // update to draft state and send emails to the authors to let them know we updated their
    // report.
    final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
    for (Report r : reports) {
      try {
        AnetEmail email = new AnetEmail();
        FutureEngagementUpdated action = new FutureEngagementUpdated();
        action.setReport(r);
        email.setAction(action);
        try {
          email.addToAddress(r.loadAuthor(context).get().getEmailAddress());
          AnetEmailWorker.sendEmailAsync(email);
          dao.updateToDraftState(r);
        } catch (InterruptedException | ExecutionException e) {
          logger.error("failed to load Author", e);
        }
      } catch (Exception e) {
        logger.error("Exception when updating", e);
      }
    }

  }

}
