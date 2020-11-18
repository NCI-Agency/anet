package mil.dds.anet.beans;

import java.time.Instant;

public class JobHistory {

  private String jobName;
  private Instant lastRun;

  public JobHistory() {}

  public JobHistory(String jobName, Instant lastRun) {
    this.jobName = jobName;
    this.lastRun = lastRun;
  }

  public String getJobName() {
    return jobName;
  }

  public void setJobName(String jobName) {
    this.jobName = jobName;
  }

  public Instant getLastRun() {
    return lastRun;
  }

  public void setLastRun(Instant lastRun) {
    this.lastRun = lastRun;
  }

  public static Instant getLastRun(JobHistory jobHistory) {
    return jobHistory == null ? null : jobHistory.getLastRun();
  }

}
