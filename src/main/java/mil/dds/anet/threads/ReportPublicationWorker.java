package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.utils.AnetAuditLogger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReportPublicationWorker extends AbstractWorker {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final ReportDao dao;
  private final Integer nbOfHoursQuarantineApproved;

  public ReportPublicationWorker(ReportDao dao, AnetConfiguration config) {
    super("Report Publication Worker waking up to check for reports to be published");
    this.dao = dao;
    this.nbOfHoursQuarantineApproved =
        (Integer) config.getDictionaryEntry("reportWorkflow.nbOfHoursQuarantineApproved");
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory) {
    final Instant quarantineApproval =
        now.minus(this.nbOfHoursQuarantineApproved, ChronoUnit.HOURS);
    // Get a list of all APPROVED reports
    final ReportSearchQuery query = new ReportSearchQuery();
    query.setPageSize(0);
    query.setState(Collections.singletonList(ReportState.APPROVED));
    query.setSystemSearch(true);
    final List<Report> reports = dao.search(query).getList();
    final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
    for (final Report r : reports) {
      final List<ReportAction> workflow = r.loadWorkflow(context).join();
      if (workflow.isEmpty()) {
        logger.error("Couldn't process report publication for report {}, it has no workflow",
            r.getUuid());
      } else {
        if (workflow.get(workflow.size() - 1).getCreatedAt().isBefore(quarantineApproval)) {
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
