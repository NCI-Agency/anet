package mil.dds.anet.threads;

import java.time.Instant;
import java.util.Map;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;

public class MaterializedViewForLinksRefreshWorker extends AbstractWorker {

  public static final String[] materializedViews =
      {"mv_lts_attachments", "mv_lts_locations", "mv_lts_organizations", "mv_lts_people",
          "mv_lts_positions", "mv_lts_reports", "mv_lts_tasks"};

  private final AdminDao dao;

  public MaterializedViewForLinksRefreshWorker(AnetConfiguration config, AdminDao dao) {
    super(config, "Refreshing materialized views for links to ANET objects");
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
