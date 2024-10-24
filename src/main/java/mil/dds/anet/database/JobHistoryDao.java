package mil.dds.anet.database;

import java.time.Instant;
import java.util.function.BiConsumer;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.database.mappers.JobHistoryMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class JobHistoryDao {

  protected final DatabaseHandler databaseHandler;

  public JobHistoryDao(DatabaseHandler databaseHandler) {
    this.databaseHandler = databaseHandler;
  }

  protected Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  protected void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }

  @Transactional
  public JobHistory getByJobName(String jobName) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery("/* getJobHistoryByJobName */ SELECT * FROM \"jobHistory\""
              + " WHERE \"jobName\" = :jobName")
          .bind("jobName", jobName).map(new JobHistoryMapper()).findFirst().orElse(null);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public JobHistory insert(JobHistory jobHistory) {
    final Handle handle = getDbHandle();
    try {
      handle
          .createUpdate("/* insertJobHistory */ INSERT INTO \"jobHistory\""
              + " (\"jobName\", \"lastRun\") VALUES (:jobName, :lastRun)")
          .bindBean(jobHistory).bind("lastRun", DaoUtils.asLocalDateTime(jobHistory.getLastRun()))
          .execute();
      return jobHistory;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int update(JobHistory jobHistory) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* updateJobHistory */ UPDATE \"jobHistory\""
              + " SET \"lastRun\" = :lastRun WHERE \"jobName\" = :jobName")
          .bindBean(jobHistory).bind("lastRun", DaoUtils.asLocalDateTime(jobHistory.getLastRun()))
          .execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
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
