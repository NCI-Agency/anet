package mil.dds.anet.threads;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.utils.BatchingUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
public abstract class AbstractWorker {

  protected final Logger logger = LoggerFactory.getLogger(this.getClass());

  protected final AnetDictionary dict;
  private final JobHistoryDao jobHistoryDao;
  private final String startMessage;

  protected AbstractWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao, String startMessage) {
    this.dict = dict;
    this.jobHistoryDao = jobHistoryDao;
    this.startMessage = startMessage;
  }

  protected abstract void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context);

  public void run() {
    final String className = this.getClass().getSimpleName();
    logger.debug("Starting {}: {}", className, startMessage);
    final RunStatus runStatus = new RunStatus();
    BatchingUtils batchingUtils = null;
    try {
      batchingUtils = startDispatcher(runStatus);
      final GraphQLContext context = GraphQLContext.newContext()
          .of("dataLoaderRegistry", batchingUtils.getDataLoaderRegistry()).build();
      jobHistoryDao.runInTransaction(className,
          (now, jobHistory) -> runInternal(now, jobHistory, context));
    } catch (Throwable e) {
      // Cannot let this thread die. Otherwise ANET will stop checking.
      logger.error("Exception in run()", e);
    } finally {
      runStatus.setDone(true);
      if (batchingUtils != null) {
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
    final BatchingUtils batchingUtils = new BatchingUtils(engine(), true, true);
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

  protected AnetObjectEngine engine() {
    return ApplicationContextProvider.getEngine();
  }

}
