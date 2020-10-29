package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.database.AdminDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MaterializedViewRefreshWorker extends AbstractWorker {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String[] materializedViews =
      {"mv_fts_authorizationGroups", "mv_fts_locations", "mv_fts_organizations", "mv_fts_people",
          "mv_fts_positions", "mv_fts_reports", "mv_fts_tags", "mv_fts_tasks"};

  private final AdminDao dao;

  public MaterializedViewRefreshWorker(AdminDao dao) {
    super("Refreshing materialized views");
    this.dao = dao;
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory) {
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
