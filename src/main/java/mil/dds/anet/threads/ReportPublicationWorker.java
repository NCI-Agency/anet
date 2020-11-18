package mil.dds.anet.threads;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.utils.AnetAuditLogger;

public class ReportPublicationWorker extends AbstractWorker {

  private final ReportDao dao;

  public ReportPublicationWorker(AnetConfiguration config, ReportDao dao) {
    super(config, "Report Publication Worker waking up to check for reports to be published");
    this.dao = dao;
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, Map<String, Object> context) {
    final Instant quarantineApproval =
        now.minus((Integer) config.getDictionaryEntry("reportWorkflow.nbOfHoursQuarantineApproved"),
            ChronoUnit.HOURS);
    // Get a list of all APPROVED reports
    final ReportSearchQuery query = new ReportSearchQuery();
    query.setPageSize(0);
    query.setState(Collections.singletonList(ReportState.APPROVED));
    query.setSystemSearch(true);
    final List<Report> reports = dao.search(query).getList();
    final CompletableFuture<?>[] allFutures = reports.stream().map(r -> {
      return r.loadWorkflow(context).thenApply(workflow -> {
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
                    "report {} automatically published by the ReportPublicationWorker",
                    r.getUuid());
              }
            } catch (Exception e) {
              logger.error("Exception when publishing report", e);
            }
          }
        }
        return true;
      });
    }).toArray(CompletableFuture<?>[]::new);
    // Wait for all our futures to complete before returning
    CompletableFuture.allOf(allFutures).join();
  }

}
