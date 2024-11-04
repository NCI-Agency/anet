package mil.dds.anet.threads;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.concurrent.TimeUnit;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.utils.PendingAssessmentsHelper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false}")
public class PendingAssessmentsNotificationWorker extends AbstractWorker {

  public PendingAssessmentsNotificationWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao) {
    super(dict, jobHistoryDao,
        "Pending Assessments Notification Worker waking up to check for pending periodic assessments");
  }

  @Scheduled(initialDelay = 25, fixedRate = 21600, timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    super.run();
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    new PendingAssessmentsHelper(dict)
        .loadAll(context, now, JobHistory.getLastRun(jobHistory), true).join();
  }

}
