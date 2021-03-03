package mil.dds.anet.threads;

import java.time.Instant;
import java.util.Map;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.utils.PendingAssessmentsHelper;

public class PendingAssessmentsNotificationWorker extends AbstractWorker {

  public PendingAssessmentsNotificationWorker(AnetConfiguration config) {
    super(config,
        "Pending Assessments Notification Worker waking up to check for pending periodic assessments");
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, Map<String, Object> context) {
    new PendingAssessmentsHelper(config)
        .loadAll(context, now, JobHistory.getLastRun(jobHistory), true).join();
  }

}
