package mil.dds.anet.threads;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.concurrent.TimeUnit;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.JobHistoryDao;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false}")
public class MaterializedViewForLinksRefreshWorker extends AbstractWorker {

  public static final String[] materializedViews =
      {"mv_lts_attachments", "mv_lts_locations", "mv_lts_organizations", "mv_lts_people",
          "mv_lts_positions", "mv_lts_reports", "mv_lts_tasks"};

  private final AdminDao dao;

  public MaterializedViewForLinksRefreshWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao,
      AdminDao dao) {
    super(dict, jobHistoryDao, "Refreshing materialized views");
    this.dao = dao;
  }

  @Scheduled(initialDelay = 5, fixedDelay = 15, timeUnit = TimeUnit.MINUTES)
  @Override
  public void run() {
    super.run();
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    for (final String materializedView : materializedViews) {
      try {
        dao.updateMaterializedView(materializedView);
      } catch (Throwable e) {
        // Log and continue with next view
        logger.error("Exception in runInternal()", e);
      }
    }
  }

}
