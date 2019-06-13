package mil.dds.anet.utils;

import com.codahale.metrics.MetricRegistry;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.Task;
import org.dataloader.BatchLoader;
import org.dataloader.DataLoader;
import org.dataloader.DataLoaderOptions;
import org.dataloader.DataLoaderRegistry;
import org.dataloader.stats.SimpleStatisticsCollector;
import org.dataloader.stats.Statistics;

public final class BatchingUtils {

  private BatchingUtils() {}

  public static DataLoaderRegistry registerDataLoaders(AnetObjectEngine engine,
      boolean batchingEnabled, boolean cachingEnabled) {
    final DataLoaderOptions dataLoaderOptions =
        DataLoaderOptions.newOptions().setStatisticsCollector(() -> new SimpleStatisticsCollector())
            .setBatchingEnabled(batchingEnabled).setCachingEnabled(cachingEnabled)
            .setMaxBatchSize(1000);
    final DataLoaderRegistry dataLoaderRegistry = new DataLoaderRegistry();
    // Give each registry its own thread pool
    final ExecutorService dispatcherService = Executors.newFixedThreadPool(3);

    dataLoaderRegistry.register(IdDataLoaderKey.APPROVAL_STEPS.toString(),
        new DataLoader<>(new BatchLoader<String, ApprovalStep>() {
          @Override
          public CompletionStage<List<ApprovalStep>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(() -> engine.getApprovalStepDao().getByIds(keys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.APPROVAL_STEP_APPROVERS.toString(),
        new DataLoader<>(new BatchLoader<String, List<Position>>() {
          @Override
          public CompletionStage<List<List<Position>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getApprovalStepDao().getApprovers(foreignKeys), dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.AUTHORIZATION_GROUPS.toString(),
        new DataLoader<>(new BatchLoader<String, AuthorizationGroup>() {
          @Override
          public CompletionStage<List<AuthorizationGroup>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getAuthorizationGroupDao().getByIds(keys), dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.AUTHORIZATION_GROUP_POSITIONS.toString(),
        new DataLoader<>(new BatchLoader<String, List<Position>>() {
          @Override
          public CompletionStage<List<List<Position>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getAuthorizationGroupDao().getPositions(foreignKeys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.COMMENTS.toString(),
        new DataLoader<>(new BatchLoader<String, Comment>() {
          @Override
          public CompletionStage<List<Comment>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(() -> engine.getCommentDao().getByIds(keys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.LOCATIONS.toString(),
        new DataLoader<>(new BatchLoader<String, Location>() {
          @Override
          public CompletionStage<List<Location>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(() -> engine.getLocationDao().getByIds(keys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.NOTE_NOTE_RELATED_OBJECTS.toString(),
        new DataLoader<>(new BatchLoader<String, List<NoteRelatedObject>>() {
          @Override
          public CompletionStage<List<List<NoteRelatedObject>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getNoteDao().getNoteRelatedObjects(foreignKeys), dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.NOTE_RELATED_OBJECT_NOTES.toString(),
        new DataLoader<>(new BatchLoader<String, List<Note>>() {
          @Override
          public CompletionStage<List<List<Note>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(() -> engine.getNoteDao().getNotes(foreignKeys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.ORGANIZATIONS.toString(),
        new DataLoader<>(new BatchLoader<String, Organization>() {
          @Override
          public CompletionStage<List<Organization>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(() -> engine.getOrganizationDao().getByIds(keys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.ORGANIZATION_PLANNING_APPROVAL_STEPS.toString(),
        new DataLoader<>(new BatchLoader<String, List<ApprovalStep>>() {
          @Override
          public CompletionStage<List<List<ApprovalStep>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getApprovalStepDao().getPlanningApprovalSteps(foreignKeys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.ORGANIZATION_APPROVAL_STEPS.toString(),
        new DataLoader<>(new BatchLoader<String, List<ApprovalStep>>() {
          @Override
          public CompletionStage<List<List<ApprovalStep>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getApprovalStepDao().getApprovalSteps(foreignKeys), dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.PEOPLE.toString(),
        new DataLoader<>(new BatchLoader<String, Person>() {
          @Override
          public CompletionStage<List<Person>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(() -> engine.getPersonDao().getByIds(keys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.PERSON_ORGANIZATIONS.toString(),
        new DataLoader<>(new BatchLoader<String, List<Organization>>() {
          @Override
          public CompletionStage<List<List<Organization>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getOrganizationDao().getOrganizations(foreignKeys), dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.PERSON_PERSON_POSITION_HISTORY.toString(),
        new DataLoader<>(new BatchLoader<String, List<PersonPositionHistory>>() {
          @Override
          public CompletionStage<List<List<PersonPositionHistory>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getPersonDao().getPersonPositionHistory(foreignKeys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.POSITIONS.toString(),
        new DataLoader<>(new BatchLoader<String, Position>() {
          @Override
          public CompletionStage<List<Position>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(() -> engine.getPositionDao().getByIds(keys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.POSITION_ASSOCIATED_POSITIONS.toString(),
        new DataLoader<>(new BatchLoader<String, List<Position>>() {
          @Override
          public CompletionStage<List<List<Position>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getPositionDao().getAssociatedPositionsForPosition(foreignKeys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.POSITION_CURRENT_POSITION_FOR_PERSON.toString(),
        new DataLoader<>(new BatchLoader<String, List<Position>>() {
          @Override
          public CompletionStage<List<List<Position>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getPositionDao().getCurrentPersonForPosition(foreignKeys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.POSITION_PERSON_POSITION_HISTORY.toString(),
        new DataLoader<>(new BatchLoader<String, List<PersonPositionHistory>>() {
          @Override
          public CompletionStage<List<List<PersonPositionHistory>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getPositionDao().getPersonPositionHistory(foreignKeys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.REPORTS.toString(),
        new DataLoader<>(new BatchLoader<String, Report>() {
          @Override
          public CompletionStage<List<Report>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(() -> engine.getReportDao().getByIds(keys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_REPORT_ACTIONS.toString(),
        new DataLoader<>(new BatchLoader<String, List<ReportAction>>() {
          @Override
          public CompletionStage<List<List<ReportAction>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getReportActionDao().getReportActions(foreignKeys), dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_ATTENDEES.toString(),
        new DataLoader<>(new BatchLoader<String, List<ReportPerson>>() {
          @Override
          public CompletionStage<List<List<ReportPerson>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getReportDao().getAttendees(foreignKeys), dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_REPORT_SENSITIVE_INFORMATION.toString(),
        new DataLoader<>(new BatchLoader<String, List<ReportSensitiveInformation>>() {
          @Override
          public CompletionStage<List<List<ReportSensitiveInformation>>> load(
              List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(() -> engine.getReportSensitiveInformationDao()
                .getReportSensitiveInformation(foreignKeys), dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_TAGS.toString(),
        new DataLoader<>(new BatchLoader<String, List<Tag>>() {
          @Override
          public CompletionStage<List<List<Tag>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(() -> engine.getReportDao().getTags(foreignKeys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_TASKS.toString(),
        new DataLoader<>(new BatchLoader<String, List<Task>>() {
          @Override
          public CompletionStage<List<List<Task>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(() -> engine.getReportDao().getTasks(foreignKeys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.TAGS.toString(),
        new DataLoader<>(new BatchLoader<String, Tag>() {
          @Override
          public CompletionStage<List<Tag>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(() -> engine.getTagDao().getByIds(keys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.TASKS.toString(),
        new DataLoader<>(new BatchLoader<String, Task>() {
          @Override
          public CompletionStage<List<Task>> load(List<String> keys) {
            return CompletableFuture.supplyAsync(() -> engine.getTaskDao().getByIds(keys),
                dispatcherService);
          }
        }, dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.TASK_RESPONSIBLE_POSITIONS.toString(),
        new DataLoader<>(new BatchLoader<String, List<Position>>() {
          @Override
          public CompletionStage<List<List<Position>>> load(List<String> foreignKeys) {
            return CompletableFuture.supplyAsync(
                () -> engine.getTaskDao().getResponsiblePositions(foreignKeys), dispatcherService);
          }
        }, dataLoaderOptions));
    return dataLoaderRegistry;
  }

  public static void updateStats(MetricRegistry metricRegistry,
      DataLoaderRegistry dataLoaderRegistry) {
    // Combined stats for all data loaders
    updateStats(metricRegistry, "DataLoaderRegistry", dataLoaderRegistry.getStatistics());
    for (final String key : dataLoaderRegistry.getKeys()) {
      // Individual stats per data loader
      updateStats(metricRegistry, key, dataLoaderRegistry.getDataLoader(key).getStatistics());
    }
  }

  private static void updateStats(MetricRegistry metricRegistry, String name,
      Statistics statistics) {
    metricRegistry.counter(MetricRegistry.name(name, "BatchInvokeCount"))
        .inc(statistics.getBatchInvokeCount());
    metricRegistry.counter(MetricRegistry.name(name, "BatchLoadCount"))
        .inc(statistics.getBatchLoadCount());
    metricRegistry.counter(MetricRegistry.name(name, "BatchLoadExceptionCount"))
        .inc(statistics.getBatchLoadExceptionCount());
    metricRegistry.counter(MetricRegistry.name(name, "CacheHitCount"))
        .inc(statistics.getCacheHitCount());
    metricRegistry.counter(MetricRegistry.name(name, "CacheMissCount"))
        .inc(statistics.getCacheMissCount());
    metricRegistry.counter(MetricRegistry.name(name, "LoadCount")).inc(statistics.getLoadCount());
    metricRegistry.counter(MetricRegistry.name(name, "LoadErrorCount"))
        .inc(statistics.getLoadErrorCount());
  }

}
