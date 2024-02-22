package mil.dds.anet;

import com.codahale.metrics.MetricRegistry;
import com.google.inject.Injector;
import io.dropwizard.core.Application;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.CustomSensitiveInformationDao;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportActionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.ReportSensitiveInformationDao;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.database.SubscriptionDao;
import mil.dds.anet.database.SubscriptionUpdateDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.database.UserActivityDao;
import mil.dds.anet.search.ISearcher;
import mil.dds.anet.search.Searcher;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.BatchingUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.UuidFetcher;
import ru.vyarus.dropwizard.guice.injector.lookup.InjectorLookup;

public class AnetObjectEngine {

  private final PersonDao personDao;
  private final TaskDao taskDao;
  private final LocationDao locationDao;
  private final OrganizationDao orgDao;
  private final PositionDao positionDao;
  private final ApprovalStepDao asDao;
  private final AttachmentDao attachmentDao;
  private final ReportActionDao reportActionDao;
  private final ReportDao reportDao;
  private final CommentDao commentDao;
  private final AdminDao adminDao;
  private final SavedSearchDao savedSearchDao;
  private final EmailDao emailDao;
  private final ReportSensitiveInformationDao reportSensitiveInformationDao;
  private final CustomSensitiveInformationDao customSensitiveInformationDao;
  private final AuthorizationGroupDao authorizationGroupDao;
  private final NoteDao noteDao;
  private final JobHistoryDao jobHistoryDao;
  private final SubscriptionDao subscriptionDao;
  private final SubscriptionUpdateDao subscriptionUpdateDao;
  private final UserActivityDao userActivityDao;
  private final MetricRegistry metricRegistry;
  private ThreadLocal<Map<String, Object>> context;

  ISearcher searcher;

  private static AnetObjectEngine instance;
  private static AnetConfiguration configuration;

  private final String dbUrl;
  private final Injector injector;

  public AnetObjectEngine(String dbUrl, Application<?> application, AnetConfiguration config,
      MetricRegistry metricRegistry) {
    this.dbUrl = dbUrl;
    injector = InjectorLookup.getInjector(application).get();
    personDao = injector.getInstance(PersonDao.class);
    taskDao = injector.getInstance(TaskDao.class);
    locationDao = injector.getInstance(LocationDao.class);
    orgDao = injector.getInstance(OrganizationDao.class);
    positionDao = injector.getInstance(PositionDao.class);
    asDao = injector.getInstance(ApprovalStepDao.class);
    reportActionDao = injector.getInstance(ReportActionDao.class);
    reportDao = injector.getInstance(ReportDao.class);
    commentDao = injector.getInstance(CommentDao.class);
    adminDao = injector.getInstance(AdminDao.class);
    savedSearchDao = injector.getInstance(SavedSearchDao.class);
    reportSensitiveInformationDao = injector.getInstance(ReportSensitiveInformationDao.class);
    customSensitiveInformationDao = injector.getInstance(CustomSensitiveInformationDao.class);
    emailDao = injector.getInstance(EmailDao.class);
    authorizationGroupDao = injector.getInstance(AuthorizationGroupDao.class);
    noteDao = injector.getInstance(NoteDao.class);
    attachmentDao = injector.getInstance(AttachmentDao.class);
    jobHistoryDao = injector.getInstance(JobHistoryDao.class);
    subscriptionDao = injector.getInstance(SubscriptionDao.class);
    subscriptionUpdateDao = injector.getInstance(SubscriptionUpdateDao.class);
    userActivityDao = injector.getInstance(UserActivityDao.class);
    this.metricRegistry = metricRegistry;
    searcher = Searcher.getSearcher(DaoUtils.getDbType(dbUrl), injector);
    configuration = config;
    instance = this;
  }

  public String getDbUrl() {
    return dbUrl;
  }

  public Injector getInjector() {
    return injector;
  }

  public PersonDao getPersonDao() {
    return personDao;
  }

  public TaskDao getTaskDao() {
    return taskDao;
  }

  public LocationDao getLocationDao() {
    return locationDao;
  }

  public OrganizationDao getOrganizationDao() {
    return orgDao;
  }

  public ReportActionDao getReportActionDao() {
    return reportActionDao;
  }

  public PositionDao getPositionDao() {
    return positionDao;
  }

  public ApprovalStepDao getApprovalStepDao() {
    return asDao;
  }

  public ReportDao getReportDao() {
    return reportDao;
  }

  public CommentDao getCommentDao() {
    return commentDao;
  }

  public AdminDao getAdminDao() {
    return adminDao;
  }

  public SavedSearchDao getSavedSearchDao() {
    return savedSearchDao;
  }

  public ReportSensitiveInformationDao getReportSensitiveInformationDao() {
    return reportSensitiveInformationDao;
  }

  public CustomSensitiveInformationDao getCustomSensitiveInformationDao() {
    return customSensitiveInformationDao;
  }

  public AuthorizationGroupDao getAuthorizationGroupDao() {
    return authorizationGroupDao;
  }

  public NoteDao getNoteDao() {
    return noteDao;
  }

  public AttachmentDao getAttachmentDao() {
    return attachmentDao;
  }

  public JobHistoryDao getJobHistoryDao() {
    return jobHistoryDao;
  }

  public SubscriptionDao getSubscriptionDao() {
    return subscriptionDao;
  }

  public SubscriptionUpdateDao getSubscriptionUpdateDao() {
    return subscriptionUpdateDao;
  }

  public UserActivityDao getUserActivityDao() {
    return userActivityDao;
  }

  public EmailDao getEmailDao() {
    return emailDao;
  }

  public MetricRegistry getMetricRegistry() {
    return metricRegistry;
  }

  public ISearcher getSearcher() {
    return searcher;
  }

  public String getDefaultOrgUuid() {
    return getAdminSetting(AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION);
  }

  public CompletableFuture<Organization> getOrganizationForPerson(Map<String, Object> context,
      String personUuid) {
    if (personUuid == null) {
      return CompletableFuture.completedFuture(null);
    }
    return orgDao.getOrganizationsForPerson(context, personUuid)
        .thenApply(l -> l.isEmpty() ? null : l.get(0));
  }

  public CompletableFuture<List<ApprovalStep>> getPlanningApprovalStepsForRelatedObject(
      Map<String, Object> context, String aoUuid) {
    return asDao.getPlanningByRelatedObjectUuid(context, aoUuid)
        .thenApply(unordered -> orderSteps(unordered));
  }

  public CompletableFuture<List<ApprovalStep>> getApprovalStepsForRelatedObject(
      Map<String, Object> context, String aoUuid) {
    return asDao.getByRelatedObjectUuid(context, aoUuid)
        .thenApply(unordered -> orderSteps(unordered));
  }

  private List<ApprovalStep> orderSteps(List<ApprovalStep> unordered) {
    int numSteps = unordered.size();
    LinkedList<ApprovalStep> ordered = new LinkedList<ApprovalStep>();
    String nextStep = null;
    for (int i = 0; i < numSteps; i++) {
      for (ApprovalStep as : unordered) {
        if (Objects.equals(as.getNextStepUuid(), nextStep)) {
          ordered.addFirst(as);
          nextStep = as.getUuid();
          break;
        }
      }
    }
    return ordered;
  }

  public CompletableFuture<Boolean> canUserApproveStep(Map<String, Object> context, String userUuid,
      String approvalStepUuid, String advisorOrgUuid) {
    return new UuidFetcher<ApprovalStep>()
        .load(context, IdDataLoaderKey.APPROVAL_STEPS, approvalStepUuid).thenCompose(
            approvalStep -> canUserApproveStep(context, userUuid, approvalStep, advisorOrgUuid));
  }

  public CompletableFuture<Boolean> canUserApproveStep(Map<String, Object> context, String userUuid,
      ApprovalStep approvalStep, String advisorOrgUuid) {
    return getTaskedAdvisorOrgParentUuids(context, approvalStep, advisorOrgUuid)
        .thenCompose(taskedAdvisorOrgParentUuids -> approvalStep.loadApprovers(context)
            .thenCompose(approvers -> {
              @SuppressWarnings("unchecked")
              final CompletableFuture<Boolean>[] allApprovers =
                  (CompletableFuture<Boolean>[]) approvers.stream()
                      .map(approverPosition -> checkApprovalStep(context, userUuid, approvalStep,
                          taskedAdvisorOrgParentUuids, approverPosition))
                      .toArray(CompletableFuture<?>[]::new);
              return CompletableFuture.allOf(allApprovers).thenCompose(v -> {
                for (final CompletableFuture<Boolean> cf : allApprovers) {
                  if (cf.join()) {
                    return CompletableFuture.completedFuture(true);
                  }
                }
                return CompletableFuture.completedFuture(false);
              });
            }));
  }

  private CompletableFuture<Boolean> checkApprovalStep(Map<String, Object> context, String userUuid,
      ApprovalStep approvalStep, Set<String> taskedAdvisorOrgParentUuids,
      Position approverPosition) {
    if (!Objects.equals(userUuid, approverPosition.getPersonUuid())) {
      // User does not match approver
      return CompletableFuture.completedFuture(false);
    }
    if (!approvalStep.isRestrictedApproval()) {
      // Approval is not restricted
      return CompletableFuture.completedFuture(true);
    }
    // Else check organization hierarchy
    return approverPosition.loadOrganization(context).thenCompose(approverOrg -> {
      if (approverOrg == null) {
        return CompletableFuture.completedFuture(false);
      }
      return approverOrg.loadAscendantOrgs(context, null).thenCompose(aos -> {
        final Set<String> matchingOrgs =
            aos.stream().map(o -> DaoUtils.getUuid(o)).collect(Collectors.toSet());
        matchingOrgs.retainAll(taskedAdvisorOrgParentUuids);
        return CompletableFuture.completedFuture(!matchingOrgs.isEmpty());
      });
    });
  }

  private CompletableFuture<Set<String>> getTaskedAdvisorOrgParentUuids(Map<String, Object> context,
      ApprovalStep approvalStep, String advisorOrgUuid) {
    if (!approvalStep.isRestrictedApproval()) {
      return CompletableFuture.completedFuture(null);
    }
    return new UuidFetcher<Task>()
        .load(context, IdDataLoaderKey.TASKS, approvalStep.getRelatedObjectUuid())
        .thenCompose(task -> new UuidFetcher<Organization>()
            .load(context, IdDataLoaderKey.ORGANIZATIONS, advisorOrgUuid)
            .thenCompose(advisorOrg -> {
              if (task == null || advisorOrg == null) {
                return CompletableFuture.completedFuture(new HashSet<>());
              }
              return task.loadTaskedOrganizations(context).thenCompose(tos -> {
                final Set<String> taskedAdvisorOrgParentUuids =
                    tos.stream().map(o -> DaoUtils.getUuid(o)).collect(Collectors.toSet());
                return advisorOrg.loadAscendantOrgs(context, null).thenCompose(aaos -> {
                  taskedAdvisorOrgParentUuids.retainAll(
                      aaos.stream().map(o -> DaoUtils.getUuid(o)).collect(Collectors.toSet()));
                  return CompletableFuture.completedFuture(taskedAdvisorOrgParentUuids);
                });
              });
            }));
  }

  public CompletableFuture<Boolean> canUserRejectStep(Map<String, Object> context, String userUuid,
      ApprovalStep approvalStep, String advisorOrgUuid) {
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, userUuid)
        .thenCompose(p -> {
          // Admin users may reject any step
          if (AuthUtils.isAdmin(p)) {
            return CompletableFuture.completedFuture(true);
          }
          return canUserApproveStep(context, userUuid, approvalStep, advisorOrgUuid);
        });
  }

  /*
   * Helper function to build a map of organization UUIDs to their top level parent organization
   * object.
   */
  public Map<String, Organization> buildTopLevelOrgHash() {
    OrganizationSearchQuery orgQuery = new OrganizationSearchQuery();
    orgQuery.setPageSize(0);
    List<Organization> orgs = getOrganizationDao().search(orgQuery).getList();

    return Utils.buildParentOrgMapping(orgs, null);
  }

  /**
   * Helper function to build a map of organization UUIDs to their top parent capped at a certain
   * point in the hierarchy. parentOrg will map to parentOrg, and all children will map to the
   * highest parent that is NOT the parentOrgUuid.
   */
  public Map<String, Organization> buildTopLevelOrgHash(String parentOrgUuid) {
    final OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setParentOrgUuid(Collections.singletonList(parentOrgUuid));
    query.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    query.setPageSize(0);
    final List<Organization> orgList = orgDao.search(query).getList();
    return Utils.buildParentOrgMapping(orgList, parentOrgUuid);
  }

  /**
   * Helper function to build a map of task UUIDs to their top parent capped at a certain point in
   * the hierarchy. parentTask will map to parentTask, and all children will map to the highest
   * parent that is NOT the parentTaskUuid.
   */
  public Map<String, Task> buildTopLevelTaskHash(String parentTaskUuid) {
    final TaskSearchQuery query = new TaskSearchQuery();
    query.setParentTaskUuid(Collections.singletonList(parentTaskUuid));
    query.setParentTaskRecurseStrategy(RecurseStrategy.CHILDREN);
    query.setPageSize(0);
    final List<Task> taskList = taskDao.search(query).getList();
    return Utils.buildParentTaskMapping(taskList, parentTaskUuid);
  }

  public static AnetObjectEngine getInstance() {
    return instance;
  }

  public static AnetConfiguration getConfiguration() {
    return configuration;
  }

  public String getAdminSetting(AdminSettingKeys key) {
    return adminDao.getSetting(key);
  }

  public Map<String, Object> getContext() {
    if (context == null) {
      final Map<String, Object> ctx = new HashMap<>();
      // FIXME: create this per Jersey (non-GraphQL) request, and make it batch and cache?
      final BatchingUtils batchingUtils = new BatchingUtils(this, false, false);
      ctx.put("dataLoaderRegistry", batchingUtils.getDataLoaderRegistry());
      context = ThreadLocal.withInitial(() -> ctx);
    }
    return context.get();
  }
}
