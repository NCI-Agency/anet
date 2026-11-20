package mil.dds.anet.threads;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.List;
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
public class MergedEntityWorker extends AbstractWorker {

  private record FieldWithEntityReference(String tableName, String columnName, boolean jsonb) {
    private FieldWithEntityReference(String tableName, String columnName) {
      this(tableName, columnName, false);
    }
  }

  private static final List<FieldWithEntityReference> fieldsWithEntityReference = List.of(// -
      new FieldWithEntityReference("assessments", "assessmentValues", true), // -
      new FieldWithEntityReference("attachments", "description"), // -
      new FieldWithEntityReference("events", "description"), // -
      new FieldWithEntityReference("eventSeries", "description"), // -
      new FieldWithEntityReference("customSensitiveInformation", "customFieldValue", true), // -
      new FieldWithEntityReference("locations", "description"),
      new FieldWithEntityReference("locations", "customFields", true), // -
      new FieldWithEntityReference("notes", "text"), // -
      new FieldWithEntityReference("organizations", "profile"), // -
      new FieldWithEntityReference("organizations", "customFields", true), // -
      new FieldWithEntityReference("people", "biography"), // -
      new FieldWithEntityReference("people", "customFields", true), // -
      new FieldWithEntityReference("positions", "description"), // -
      new FieldWithEntityReference("positions", "customFields", true), // -
      new FieldWithEntityReference("reports", "text"), // -
      new FieldWithEntityReference("reports", "customFields", true), // -
      new FieldWithEntityReference("reportsSensitiveInformation", "text"), // -
      new FieldWithEntityReference("tasks", "description"), // -
      new FieldWithEntityReference("tasks", "customFields", true)// -
  );

  private final AdminDao dao;

  public MergedEntityWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao, AdminDao dao) {
    super(dict, jobHistoryDao, "Waking up to check for merged entities");
    this.dao = dao;
  }

  @Scheduled(initialDelay = 60, fixedRate = 300, timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    super.run();
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    final var mergedEntities = dao.getMergedEntities();
    mergedEntities.forEach(mergedEntity -> {
      fieldsWithEntityReference.forEach(tuple -> dao.updateMergedEntity(tuple.tableName(),
          tuple.columnName(), tuple.jsonb(), mergedEntity));
      dao.deleteMergedEntity(mergedEntity);
    });
  }
}
