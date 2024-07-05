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
public class MaterializedViewRefreshWorker extends AbstractWorker {

  public static final String[] materializedViews =
      {"mv_fts_attachments", "mv_fts_authorizationGroups", "mv_fts_events", "mv_fts_eventSeries",
          "mv_fts_locations", "mv_fts_organizations", "mv_fts_people", "mv_fts_positions",
          "mv_fts_reports", "mv_fts_tasks"};

  private final AdminDao dao;

  public MaterializedViewRefreshWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao,
      AdminDao dao) {
    super(dict, jobHistoryDao, "Refreshing materialized views");
    this.dao = dao;
  }

  @Scheduled(initialDelay = 30, fixedDelay = 60, timeUnit = TimeUnit.SECONDS)
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
