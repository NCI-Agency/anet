package mil.dds.anet.threads;

import java.time.Instant;
import java.util.Map;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;

public class MaterializedViewRefreshWorker extends AbstractWorker {

  private static final String[] materializedViews = {"mv_fts_attachments",
      "mv_fts_authorizationGroups", "mv_fts_locations", "mv_fts_organizations", "mv_fts_people",
      "mv_fts_positions", "mv_fts_reports", "mv_fts_tasks"};

  private final AdminDao dao;

  public MaterializedViewRefreshWorker(AnetConfiguration config, AdminDao dao) {
    super(config, "Refreshing materialized views");
    this.dao = dao;
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, Map<String, Object> context) {
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
