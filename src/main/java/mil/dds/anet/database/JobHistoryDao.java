package mil.dds.anet.database;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import java.time.Instant;
import java.util.function.BiConsumer;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.database.mappers.JobHistoryMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class JobHistoryDao {

  @Inject
  private Provider<Handle> handle;

  protected Handle getDbHandle() {
    return handle.get();
  }

  @InTransaction
  public JobHistory getByJobName(String jobName) {
    return getDbHandle()
        .createQuery("/* getJobHistoryByJobName */ SELECT * FROM \"jobHistory\""
            + " WHERE \"jobName\" = :jobName")
        .bind("jobName", jobName).map(new JobHistoryMapper()).findFirst().orElse(null);
  }

  @InTransaction
  public JobHistory insert(JobHistory jobHistory) {
    getDbHandle()
        .createUpdate("/* insertJobHistory */ INSERT INTO \"jobHistory\""
            + " (\"jobName\", \"lastRun\") VALUES (:jobName, :lastRun)")
        .bindBean(jobHistory).bind("lastRun", DaoUtils.asLocalDateTime(jobHistory.getLastRun()))
        .execute();
    return jobHistory;
  }

  @InTransaction
  public int update(JobHistory jobHistory) {
    return getDbHandle()
        .createUpdate("/* updateJobHistory */ UPDATE \"jobHistory\""
            + " SET \"lastRun\" = :lastRun WHERE \"jobName\" = :jobName")
        .bindBean(jobHistory).bind("lastRun", DaoUtils.asLocalDateTime(jobHistory.getLastRun()))
        .execute();
  }

  @InTransaction
  public void runInTransaction(String jobName, BiConsumer<Instant, JobHistory> runner) {
    final Instant now = Instant.now().atZone(DaoUtils.getServerNativeZoneId()).toInstant();
    final JobHistory jobHistory = getByJobName(jobName);
    runner.accept(now, jobHistory);
    final JobHistory newJobHistory = new JobHistory(jobName, now);
    if (jobHistory == null) {
      insert(newJobHistory);
    } else {
      update(newJobHistory);
    }
  }

}
