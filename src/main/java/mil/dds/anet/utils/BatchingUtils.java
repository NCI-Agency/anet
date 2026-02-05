package mil.dds.anet.utils;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.CustomSensitiveInformation;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.EventSeries;
import mil.dds.anet.beans.EventType;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.PersonPreference;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Preference;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.User;
import mil.dds.anet.beans.search.LocationSearchQuery;
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
   * may free up some resources).
   */
  public void shutdown() {
    dispatcherService.shutdown();
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
    dataLoaderRegistry.register(FkDataLoaderKey.ASSESSMENT_ASSESSMENT_RELATED_OBJECTS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<GenericRelatedObject>>) foreignKeys -> CompletableFuture
                .supplyAsync(
                    () -> engine.getAssessmentDao().getAssessmentRelatedObjects(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.ASSESSMENT_RELATED_OBJECT_ASSESSMENTS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Assessment>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getAssessmentDao().getAssessments(foreignKeys), dispatcherService),
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
        FkDataLoaderKey.AUTHORIZATION_GROUP_ADMINISTRATIVE_POSITIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Position>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getAuthorizationGroupDao().getAdministrativePositions(foreignKeys),
                dispatcherService),
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
    dataLoaderRegistry.register(FkDataLoaderKey.EMAIL_ADDRESSES_FOR_RELATED_OBJECT.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<EmailAddress>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getEmailAddressDao().getEmailAddressesForRelatedObjects(foreignKeys),
                dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.ENTITY_AVATAR.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, EntityAvatar>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getEntityAvatarDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.EVENTS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Event>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getEventDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.EVENT_TASKS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Task>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getEventDao().getTasks(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.EVENT_ORGANIZATIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Organization>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getEventDao().getOrganizations(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.EVENT_PEOPLE.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Person>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getEventDao().getPeople(foreignKeys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.EVENT_SERIES.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, EventSeries>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getEventSeriesDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.EVENT_TYPE.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, EventType>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getEventTypeDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.LOCATIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Location>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getLocationDao().getByIds(keys), dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(SqDataLoaderKey.LOCATIONS_SEARCH.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<ImmutablePair<String, LocationSearchQuery>, List<Location>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getLocationDao().getLocationsBySearch(foreignKeys),
                    dispatcherService),
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
    dataLoaderRegistry.register(FkDataLoaderKey.PERSON_ORGANIZATIONS_WHEN.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<ImmutablePair<String, Instant>, List<Organization>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getOrganizationDao().getOrganizationsByDate(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.PERSON_PERSON_ADDITIONAL_POSITIONS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Position>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getPersonDao().getPersonAdditionalPositions(foreignKeys),
                dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.PERSON_PERSON_POSITION_HISTORY.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<PersonPositionHistory>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getPersonDao().getPersonPositionHistory(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.PERSON_PERSON_PREFERENCES.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<PersonPreference>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getPersonDao().getPersonPreferences(foreignKeys),
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
    dataLoaderRegistry.register(FkDataLoaderKey.POSITION_PRIMARY_POSITION_FOR_PERSON.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<Position>>) foreignKeys -> CompletableFuture.supplyAsync(
                () -> engine.getPositionDao().getPrimaryPersonForPosition(foreignKeys),
                dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.POSITION_PERSON_POSITION_HISTORY.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<PersonPositionHistory>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getPositionDao().getPersonPositionHistory(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(IdDataLoaderKey.PREFERENCES.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, Preference>) keys -> CompletableFuture
                .supplyAsync(() -> engine.getPreferenceDao().getByIds(keys), dispatcherService),
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
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_REPORT_AUTHORIZED_MEMBERS.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<GenericRelatedObject>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getReportDao().getReportAuthorizedMembers(foreignKeys),
                    dispatcherService),
            dataLoaderOptions));
    dataLoaderRegistry.register(FkDataLoaderKey.REPORT_REPORT_COMMUNITIES.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<AuthorizationGroup>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getReportDao().getReportCommunities(foreignKeys),
                    dispatcherService),
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
    dataLoaderRegistry.register(FkDataLoaderKey.USER_PERSON.toString(),
        DataLoaderFactory.newDataLoader(
            (BatchLoader<String, List<User>>) foreignKeys -> CompletableFuture
                .supplyAsync(() -> engine.getUserDao().getUsers(foreignKeys), dispatcherService),
            dataLoaderOptions));
  }

}
