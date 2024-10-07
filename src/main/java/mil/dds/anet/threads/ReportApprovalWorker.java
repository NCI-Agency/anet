package mil.dds.anet.threads;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;

public class ReportApprovalWorker extends AbstractWorker {

  private final ReportDao dao;

  public ReportApprovalWorker(AnetConfiguration config, ReportDao dao) {
    super(config, "Report Approval Worker waking up to check for reports to be approved");
    this.dao = dao;
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, Map<String, Object> context) {
    final Instant approvalTimeout =
        now.minus((Integer) config.getDictionaryEntry("reportWorkflow.nbOfHoursApprovalTimeout"),
            ChronoUnit.HOURS);
    // Get a list of all PENDING_APPROVAL reports
    final ReportSearchQuery query = new ReportSearchQuery();
    query.setPageSize(0);
    query.setState(Collections.singletonList(ReportState.PENDING_APPROVAL));
    query.setSystemSearch(true);
    final List<Report> reports = dao.search(query).getList();
    final CompletableFuture<?>[] allFutures = reports.stream().map(r -> {
      return r.loadWorkflow(context).thenApply(workflow -> {
        if (workflow.isEmpty()) {
          logger.error("Couldn't process report approval for report {}, it has no workflow",
              r.getUuid());
        } else {
          for (int i = workflow.size() - 1; i >= 1; i--) {
            final ReportAction reportAction = workflow.get(i);
            final ReportAction previousAction = workflow.get(i - 1);
            if (reportAction.getCreatedAt() == null
                // Check previous action
                && previousAction.getCreatedAt() != null
                && previousAction.getCreatedAt().isBefore(approvalTimeout)) {
              // Approve the report
              try {
                final ApprovalStep approvalStep = reportAction.getStep();
                final int numRows = dao.approve(r, null, approvalStep);
                if (numRows == 0) {
                  logger.error("Couldn't process report approval for report {} step {}",
                      r.getUuid(), DaoUtils.getUuid(approvalStep));
                } else {
                  AnetAuditLogger.log(
                      "report {} step {} automatically approved by the ReportApprovalWorker",
                      r.getUuid(), DaoUtils.getUuid(approvalStep));
                }
              } catch (Exception e) {
                logger.error("Exception when approving report", e);
              }
              break;
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
