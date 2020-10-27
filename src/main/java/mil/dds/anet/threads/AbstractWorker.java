package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.utils.BatchingUtils;
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

  protected abstract void runInternal(Instant now, JobHistory jobHistory,
      Map<String, Object> context);

  @Override
  public final void run() {
    final String className = this.getClass().getSimpleName();
    logger.debug("Starting {}: {}", className, startMessage);
    final RunStatus runStatus = new RunStatus();
    BatchingUtils batchingUtils = null;
    try {
      batchingUtils = startDispatcher(runStatus);
      final Map<String, Object> context = new HashMap<>();
      context.put("dataLoaderRegistry", batchingUtils.getDataLoaderRegistry());
      jobHistoryDao.runInTransaction(className,
          (now, jobHistory) -> runInternal(now, jobHistory, context));
    } catch (Throwable e) {
      // Cannot let this thread die. Otherwise ANET will stop checking.
      logger.error("Exception in run()", e);
    } finally {
      runStatus.setDone(true);
      if (batchingUtils != null) {
        batchingUtils.updateStats(AnetObjectEngine.getInstance().getMetricRegistry(),
            batchingUtils.getDataLoaderRegistry());
        batchingUtils.shutdown();
      }
    }
    logger.debug("Ending {}", className);
  }

  private static class RunStatus {
    private boolean done = false;

    public boolean isDone() {
      return done;
    }

    public void setDone(boolean done) {
      this.done = done;
    }

    @Override
    public String toString() {
      return "RunStatus [done=" + done + "]";
    }
  }

  private BatchingUtils startDispatcher(final RunStatus runStatus) {
    final BatchingUtils batchingUtils =
        new BatchingUtils(AnetObjectEngine.getInstance(), true, true);
    final Runnable dispatcher = () -> {
      while (!runStatus.isDone()) {
        // Wait a while, giving other threads the chance to do some work
        try {
          Thread.yield();
          Thread.sleep(50);
        } catch (InterruptedException ignored) {
          // just retry
        }

        // Dispatch all our data loaders until the request is done;
        // we have data loaders at various depths (one dependent on another),
        // e.g. in {@link Report#loadWorkflow}
        final CompletableFuture<?>[] dispatchersWithWork = batchingUtils.getDataLoaderRegistry()
            .getDataLoaders().stream().filter(dl -> dl.dispatchDepth() > 0)
            .map(dl -> (CompletableFuture<?>) dl.dispatch()).toArray(CompletableFuture<?>[]::new);
        if (dispatchersWithWork.length > 0) {
          CompletableFuture.allOf(dispatchersWithWork).join();
        }
      }
    };
    Executors.newSingleThreadExecutor().execute(dispatcher);
    return batchingUtils;
  }

}
