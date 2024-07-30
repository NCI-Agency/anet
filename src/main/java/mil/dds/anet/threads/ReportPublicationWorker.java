package mil.dds.anet.threads;

import graphql.GraphQLContext;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.utils.AnetAuditLogger;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false}")
public class ReportPublicationWorker extends AbstractWorker {

  private final ReportDao dao;

  public ReportPublicationWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao, ReportDao dao) {
    super(dict, jobHistoryDao,
        "Report Publication Worker waking up to check for reports to be published");
    this.dao = dao;
  }

  @Scheduled(initialDelay = 5, fixedRate = 300, timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    super.run();
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    final Instant quarantineApproval =
        now.minus((Integer) dict.getDictionaryEntry("reportWorkflow.nbOfHoursQuarantineApproved"),
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
