package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.JobHistoryDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class AbstractWorker implements Runnable {

  protected static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected final AnetConfiguration config;
  private final String startMessage;
  private JobHistoryDao jobHistoryDao;

  public AbstractWorker(AnetConfiguration config, String startMessage) {
    this.config = config;
    this.startMessage = startMessage;
    this.jobHistoryDao = AnetObjectEngine.getInstance().getJobHistoryDao();
  }

  protected abstract void runInternal(Instant now, JobHistory jobHistory);

  @Override
  public final void run() {
    final String className = this.getClass().getSimpleName();
    logger.debug("Starting {}: {}", className, startMessage);
    try {
      jobHistoryDao.runInTransaction(className, (now, jobHistory) -> runInternal(now, jobHistory));
    } catch (Throwable e) {
      // Cannot let this thread die. Otherwise ANET will stop checking.
      logger.error("Exception in run()", e);
    }
    logger.debug("Ending {}", className);
  }

}
