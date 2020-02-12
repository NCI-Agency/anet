package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import mil.dds.anet.database.AdminDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MaterializedViewRefreshWorker implements Runnable {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String[] materializedViews =
      {"mv_fts_authorizationGroups", "mv_fts_locations", "mv_fts_organizations", "mv_fts_people",
          "mv_fts_positions", "mv_fts_reports", "mv_fts_tags", "mv_fts_tasks"};

  private final AdminDao dao;

  public MaterializedViewRefreshWorker(AdminDao dao) {
    this.dao = dao;
  }

  @Override
  public void run() {
    logger.debug("Refreshing materialized views");
    for (final String materializedView : materializedViews) {
      try {
        dao.updateMaterializedView(materializedView);
      } catch (Throwable e) {
        // Cannot let this thread die, otherwise ANET will stop this worker.
        logger.error("Exception in run()", e);
      }
    }
  }

}
