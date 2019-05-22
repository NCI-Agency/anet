package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReportPublicationWorker implements Runnable {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final ReportDao dao;
  private final Integer nbOfHoursQuarantineApproved;

  public ReportPublicationWorker(ReportDao dao, AnetConfiguration config) {
    this.dao = dao;
    this.nbOfHoursQuarantineApproved =
        (Integer) config.getDictionaryEntry("reportWorkflow.nbOfHoursQuarantineApproved");
  }

  @Override
  public void run() {
    logger.debug("Report Publication Worker waking up to check for reports to be published");
    try {
      runInternal();
    } catch (Throwable e) {
      // Cannot let this thread die. Otherwise ANET will stop checking for reports which are to be
      // published.
      logger.error("Exception in run()", e);
    }
  }

  private void runInternal() {
    final Instant now = Instant.now().atZone(DaoUtils.getDefaultZoneId())
        .minusHours(this.nbOfHoursQuarantineApproved).toInstant();
    // Get a list of all APPROVED reports
    final ReportSearchQuery query = new ReportSearchQuery();
    query.setPageSize(0);
    query.setState(Collections.singletonList(ReportState.APPROVED));
    final List<Report> reports = dao.search(query, null, true).getList();
    final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
    for (final Report r : reports) {
      final List<ReportAction> workflow = r.loadWorkflow(context).join();
      if (workflow.isEmpty()) {
        logger.error("Couldn't process report publication for report {}, it has no workflow",
            r.getUuid());
      } else {
        if (workflow.get(workflow.size() - 1).getCreatedAt().isBefore(now)) {
          // Publish the report
          try {
            final int numRows = dao.publish(r, null);
            if (numRows == 0) {
              logger.error("Couldn't process report publication for report {}", r.getUuid());
            } else {
              AnetAuditLogger.log(
                  "report {} automatically published by the ReportPublicationWorker", r.getUuid());
            }
          } catch (Exception e) {
            logger.error("Exception when publishing report", e);
          }
        }
      }
    }
  }

}
