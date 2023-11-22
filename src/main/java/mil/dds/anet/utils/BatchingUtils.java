package mil.dds.anet.utils;

import com.codahale.metrics.MetricRegistry;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.CustomSensitiveInformation;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.dataloader.BatchLoader;
import org.dataloader.DataLoaderFactory;
import org.dataloader.DataLoaderOptions;
import org.dataloader.DataLoaderRegistry;
import org.dataloader.stats.SimpleStatisticsCollector;
import org.dataloader.stats.Statistics;

public final class BatchingUtils {

  private final ExecutorService dispatcherService;
  private final DataLoaderRegistry dataLoaderRegistry;
  private final DataLoaderOptions dataLoaderOptions;

  public BatchingUtils(AnetObjectEngine engine, boolean batchingEnabled, boolean cachingEnabled) {
    final int maxBatchSize = 25000;
    // Give each registry its own thread pool
    dispatcherService = Executors.newFixedThreadPool(3);
    dataLoaderRegistry = new DataLoaderRegistry();
    dataLoaderOptions = DataLoaderOptions.newOptions()
        .setStatisticsCollector(SimpleStatisticsCollector::new).setBatchingEnabled(batchingEnabled)
        .setCachingEnabled(cachingEnabled).setMaxBatchSize(maxBatchSize);
    registerDataLoaders(engine);
  }

  public DataLoaderRegistry getDataLoaderRegistry() {
    return dataLoaderRegistry;
  }

  /**
   * Call this when you're done with this batcher; it shuts down the thread pool being used (which
   * may free up some resources). If you don't call this yourself, eventually it will be done
   * through {@link #finalize()}, but that might be delayed.
   */
  public void shutdown() {
    dispatcherService.shutdown();
  }

  @Override
  @Deprecated(since = "9")
  @SuppressWarnings("checkstyle:NoFinalizer")
  protected void finalize() throws Throwable {
    shutdown();
    super.finalize();
  }

  private void registerDataLoaders(AnetObjectEngine engine) {
    dataLoaderRegistry.register(IdDataLoaderKey.APPROVAL_STEPS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, ApprovalStep>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getApprovalStepDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.APPROVAL_STEP_APPROVERS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Position>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getApprovalStepDao().getApprovers(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.ATTACHMENT_ATTACHMENT_RELATED_OBJECTS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<GenericRelatedObject>>) foreignKeys -> CompletableFuture
                .supplyAsync(
                    () -> engine.getAttachmentDao().getAttachmentRelatedObjects(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.ATTACHMENT_RELATED_OBJECT_ATTACHMENTS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Attachment>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getAttachmentDao().getAttachments(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.AUTHORIZATION_GROUPS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, AuthorizationGroup>) keys -> CompletableFuture.supplyAsync(
                () -> engine.getAuthorizationGroupDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(
        FkDataLoaderKey.AUTHORIZATION_GROUP_AUTHORIZATION_GROUP_RELATED_OBJECTS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<GenericRelatedObject>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getAuthorizationGroupDao()
                    .getAuthorizationGroupRelatedObjects(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.COMMENTS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Comment>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getCommentDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.LOCATIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Location>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getLocationDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.NOTE_NOTE_RELATED_OBJECTS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<GenericRelatedObject>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getNoteDao().getNoteRelatedObjects(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.NOTE_RELATED_OBJECT_NOTES.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Note>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getNoteDao().getNotes(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.ORGANIZATIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Organization>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getOrganizationDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(SqDataLoaderKey.ORGANIZATIONS_SEARCH.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<ImmutablePair<String, OrganizationSearchQuery>, List<Organization>>) foreignKeys -> CompletableFuture
                .supplyAsync(
                    () -> engine.getOrganizationDao().getOrganizationsBySearch(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.ORGANIZATION_ADMINISTRATIVE_POSITIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Position>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getOrganizationDao().getAdministratingPositions(foreignKeys),
                dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.PEOPLE.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Person>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getPersonDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.PERSON_ORGANIZATIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Organization>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getOrganizationDao().getOrganizations(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.PERSON_PERSON_POSITION_HISTORY.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<PersonPositionHistory>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getPersonDao().getPersonPositionHistory(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.POSITIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Position>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getPositionDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(SqDataLoaderKey.POSITIONS_SEARCH.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<ImmutablePair<String, PositionSearchQuery>, List<Position>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getPositionDao().getPositionsBySearch(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.POSITION_ASSOCIATED_POSITIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Position>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getPositionDao().getAssociatedPositionsForPosition(foreignKeys),
                dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.POSITION_CURRENT_POSITION_FOR_PERSON.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Position>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getPositionDao().getCurrentPersonForPosition(foreignKeys),
                dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.POSITION_PERSON_POSITION_HISTORY.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<PersonPositionHistory>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getPositionDao().getPersonPositionHistory(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.RELATED_OBJECT_APPROVAL_STEPS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<ApprovalStep>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getApprovalStepDao().getApprovalSteps(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(
        FkDataLoaderKey.RELATED_OBJECT_CUSTOM_SENSITIVE_INFORMATION.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<CustomSensitiveInformation>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getCustomSensitiveInformationDao()
                    .getCustomSensitiveInformation(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.RELATED_OBJECT_PLANNING_APPROVAL_STEPS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<ApprovalStep>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getApprovalStepDao().getPlanningApprovalSteps(foreignKeys),
                dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.REPORTS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Report>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getReportDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(SqDataLoaderKey.REPORTS_SEARCH.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<ImmutablePair<String, ReportSearchQuery>, List<Report>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getReportDao().getReportsBySearch(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_REPORT_ACTIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<ReportAction>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getReportActionDao().getReportActions(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_PEOPLE.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<ReportPerson>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getReportDao().getReportPeople(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_REPORT_SENSITIVE_INFORMATION.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<ReportSensitiveInformation>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getReportSensitiveInformationDao()
                    .getReportSensitiveInformation(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_TASKS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Task>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getReportDao().getTasks(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.SUBSCRIPTIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Subscription>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getSubscriptionDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.TASKS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Task>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getTaskDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(SqDataLoaderKey.TASKS_SEARCH.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<ImmutablePair<String, TaskSearchQuery>, List<Task>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getTaskDao().getTasksBySearch(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.TASK_RESPONSIBLE_POSITIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Position>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getTaskDao().getResponsiblePositions(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.TASK_TASKED_ORGANIZATIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Organization>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getTaskDao().getTaskedOrganizations(foreignKeys), dispatcherService),
            dataLoaderOptions));
  }

  public void updateStats(MetricRegistry metricRegistry, DataLoaderRegistry dataLoaderRegistry) {
    // Combined stats for all data loaders
    updateStats(metricRegistry, "DataLoaderRegistry", dataLoaderRegistry.getStatistics());
    for (final String key : dataLoaderRegistry.getKeys()) {
      // Individual stats per data loader
      updateStats(metricRegistry, key, dataLoaderRegistry.getDataLoader(key).getStatistics());
    }
  }

  private void updateStats(MetricRegistry metricRegistry, String name, Statistics statistics) {
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
