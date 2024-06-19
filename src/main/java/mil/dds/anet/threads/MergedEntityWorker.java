package mil.dds.anet.threads;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;

public class MergedEntityWorker extends AbstractWorker {

  private record FieldWithEntityReference(String tableName, String columnName) {}

  private static final List<FieldWithEntityReference> fieldsWithEntityReference = List.of(// -
      new FieldWithEntityReference("attachments", "description"), // -
      new FieldWithEntityReference("customSensitiveInformation", "customFieldValue"), // -
      new FieldWithEntityReference("locations", "description"),
      new FieldWithEntityReference("locations", "customFields"), // -
      new FieldWithEntityReference("notes", "text"), // -
      new FieldWithEntityReference("organizations", "profile"), // -
      new FieldWithEntityReference("organizations", "customFields"), // -
      new FieldWithEntityReference("people", "biography"), // -
      new FieldWithEntityReference("people", "customFields"), // -
      new FieldWithEntityReference("positions", "customFields"), // -
      new FieldWithEntityReference("reports", "text"), // -
      new FieldWithEntityReference("reports", "customFields"), // -
      new FieldWithEntityReference("reportsSensitiveInformation", "text"), // -
      new FieldWithEntityReference("tasks", "description"), // -
      new FieldWithEntityReference("tasks", "customFields")// -
  );

  private final AdminDao dao;

  public MergedEntityWorker(AnetConfiguration config, AdminDao dao) {
    super(config, "Waking up to check for merged entities");
    this.dao = dao;
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, Map<String, Object> context) {
    final var mergedEntities = dao.getMergedEntities();
    mergedEntities.forEach(mergedEntity -> {
      fieldsWithEntityReference.forEach(
          tuple -> dao.updateMergedEntity(tuple.tableName(), tuple.columnName(), mergedEntity));
      dao.deleteMergedEntity(mergedEntity);
    });
  }
}
