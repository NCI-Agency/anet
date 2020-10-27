package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReportApprovalWorker extends AbstractWorker {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final ReportDao dao;
  private final Integer nbOfHoursApprovalTimeout;

  public ReportApprovalWorker(ReportDao dao, AnetConfiguration config) {
    super("Report Approval Worker waking up to check for reports to be approved");
    this.dao = dao;
    this.nbOfHoursApprovalTimeout =
        (Integer) config.getDictionaryEntry("reportWorkflow.nbOfHoursApprovalTimeout");
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory) {
    final Instant approvalTimeout = now.minus(nbOfHoursApprovalTimeout, ChronoUnit.HOURS);
    // Get a list of all PENDING_APPROVAL reports
    final ReportSearchQuery query = new ReportSearchQuery();
    query.setPageSize(0);
    query.setState(Collections.singletonList(ReportState.PENDING_APPROVAL));
    query.setSystemSearch(true);
    final List<Report> reports = dao.search(query).getList();
    final Map<String, Object> context = AnetObjectEngine.getInstance().getContext();
    for (final Report r : reports) {
      final List<ReportAction> workflow = r.loadWorkflow(context).join();
      if (workflow.isEmpty()) {
        logger.error("Couldn't process report approval for report {}, it has no workflow",
            r.getUuid());
      } else {
        for (int i = workflow.size() - 1; i >= 0; i--) {
          final ReportAction reportAction = workflow.get(i);
          if (reportAction.getCreatedAt() == null && i > 1) {
            // Check previous action
            final ReportAction previousAction = workflow.get(i - 1);
            if (previousAction.getCreatedAt() != null
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
      }
    }
  }

}
