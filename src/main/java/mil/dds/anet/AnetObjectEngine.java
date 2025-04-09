package mil.dds.anet;

import graphql.GraphQLContext;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.AssessmentDao;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.CustomSensitiveInformationDao;
import mil.dds.anet.database.EmailAddressDao;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.EntityAvatarDao;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.MartImportedReportDao;
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
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.BatchingUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.UuidFetcher;
import org.springframework.stereotype.Component;

@Component
public class AnetObjectEngine {

  private ThreadLocal<GraphQLContext> context;

  public PersonDao getPersonDao() {
    return ApplicationContextProvider.getBean(PersonDao.class);
  }

  public TaskDao getTaskDao() {
    return ApplicationContextProvider.getBean(TaskDao.class);
  }

  public LocationDao getLocationDao() {
    return ApplicationContextProvider.getBean(LocationDao.class);
  }

  public OrganizationDao getOrganizationDao() {
    return ApplicationContextProvider.getBean(OrganizationDao.class);
  }

  public ReportActionDao getReportActionDao() {
    return ApplicationContextProvider.getBean(ReportActionDao.class);
  }

  public PositionDao getPositionDao() {
    return ApplicationContextProvider.getBean(PositionDao.class);
  }

  public ApprovalStepDao getApprovalStepDao() {
    return ApplicationContextProvider.getBean(ApprovalStepDao.class);
  }

  public ReportDao getReportDao() {
    return ApplicationContextProvider.getBean(ReportDao.class);
  }

  public CommentDao getCommentDao() {
    return ApplicationContextProvider.getBean(CommentDao.class);
  }

  public AdminDao getAdminDao() {
    return ApplicationContextProvider.getBean(AdminDao.class);
  }

  public SavedSearchDao getSavedSearchDao() {
    return ApplicationContextProvider.getBean(SavedSearchDao.class);
  }

  public ReportSensitiveInformationDao getReportSensitiveInformationDao() {
    return ApplicationContextProvider.getBean(ReportSensitiveInformationDao.class);
  }

  public CustomSensitiveInformationDao getCustomSensitiveInformationDao() {
    return ApplicationContextProvider.getBean(CustomSensitiveInformationDao.class);
  }

  public AuthorizationGroupDao getAuthorizationGroupDao() {
    return ApplicationContextProvider.getBean(AuthorizationGroupDao.class);
  }

  public NoteDao getNoteDao() {
    return ApplicationContextProvider.getBean(NoteDao.class);
  }

  public AttachmentDao getAttachmentDao() {
    return ApplicationContextProvider.getBean(AttachmentDao.class);
  }

  public JobHistoryDao getJobHistoryDao() {
    return ApplicationContextProvider.getBean(JobHistoryDao.class);
  }

  public SubscriptionDao getSubscriptionDao() {
    return ApplicationContextProvider.getBean(SubscriptionDao.class);
  }

  public SubscriptionUpdateDao getSubscriptionUpdateDao() {
    return ApplicationContextProvider.getBean(SubscriptionUpdateDao.class);
  }

  public UserActivityDao getUserActivityDao() {
    return ApplicationContextProvider.getBean(UserActivityDao.class);
  }

  public EmailAddressDao getEmailAddressDao() {
    return ApplicationContextProvider.getBean(EmailAddressDao.class);
  }

  public EmailDao getEmailDao() {
    return ApplicationContextProvider.getBean(EmailDao.class);
  }

  public EntityAvatarDao getEntityAvatarDao() {
    return ApplicationContextProvider.getBean(EntityAvatarDao.class);
  }

  public EventSeriesDao getEventSeriesDao() {
    return ApplicationContextProvider.getBean(EventSeriesDao.class);
  }

  public EventDao getEventDao() {
    return ApplicationContextProvider.getBean(EventDao.class);
  }

  public MartImportedReportDao getMartImportedReportDao() {
    return ApplicationContextProvider.getBean(MartImportedReportDao.class);
  }

  public AssessmentDao getAssessmentDao() {
    return ApplicationContextProvider.getBean(AssessmentDao.class);
  }

  public CompletableFuture<Boolean> canUserApproveStep(GraphQLContext context, String userUuid,
      String approvalStepUuid, String advisorOrgUuid) {
    return new UuidFetcher<ApprovalStep>()
        .load(context, IdDataLoaderKey.APPROVAL_STEPS, approvalStepUuid).thenCompose(
            approvalStep -> canUserApproveStep(context, userUuid, approvalStep, advisorOrgUuid));
  }

  public CompletableFuture<Boolean> canUserApproveStep(GraphQLContext context, String userUuid,
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

  private CompletableFuture<Boolean> checkApprovalStep(GraphQLContext context, String userUuid,
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
            aos.stream().map(DaoUtils::getUuid).collect(Collectors.toSet());
        matchingOrgs.retainAll(taskedAdvisorOrgParentUuids);
        return CompletableFuture.completedFuture(!matchingOrgs.isEmpty());
      });
    });
  }

  private CompletableFuture<Set<String>> getTaskedAdvisorOrgParentUuids(GraphQLContext context,
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
                    tos.stream().map(DaoUtils::getUuid).collect(Collectors.toSet());
                return advisorOrg.loadAscendantOrgs(context, null).thenCompose(aaos -> {
                  taskedAdvisorOrgParentUuids
                      .retainAll(aaos.stream().map(DaoUtils::getUuid).collect(Collectors.toSet()));
                  return CompletableFuture.completedFuture(taskedAdvisorOrgParentUuids);
                });
              });
            }));
  }

  public CompletableFuture<Boolean> canUserRejectStep(GraphQLContext context, String userUuid,
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

    return Utils.buildOrgToParentOrgMapping(orgs, null);
  }

  /**
   * Helper function to build a map of organization UUIDs to their top parent capped at a certain
   * point in the hierarchy. The parentOrgUuid will map to parentOrg, and all children will map to
   * the highest parent that is NOT the parentOrgUuid.
   */
  public Map<String, String> buildTopLevelOrgHash(String parentOrgUuid) {
    final OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setParentOrgUuid(List.of(parentOrgUuid));
    query.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    query.setPageSize(0);
    final List<Organization> orgList = getOrganizationDao().search(query).getList();
    return Utils.buildParentOrgMapping(orgList, parentOrgUuid);
  }

  public Map<String, Organization> buildTopLevelOrgToOrgHash(String parentOrgUuid) {
    final OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setParentOrgUuid(List.of(parentOrgUuid));
    query.setOrgRecurseStrategy(RecurseStrategy.CHILDREN);
    query.setPageSize(0);
    final List<Organization> orgList = getOrganizationDao().search(query).getList();
    return Utils.buildOrgToParentOrgMapping(orgList, parentOrgUuid);
  }

  /**
   * Helper function to build a map of task UUIDs to their top parent capped at a certain point in
   * the hierarchy. The parentTaskUuid will map to parentTask, and all children will map to the
   * highest parent that is NOT the parentTaskUuid.
   */
  public Map<String, String> buildTopLevelTaskHash(String parentTaskUuid) {
    final TaskSearchQuery query = new TaskSearchQuery();
    query.setParentTaskUuid(List.of(parentTaskUuid));
    query.setParentTaskRecurseStrategy(RecurseStrategy.CHILDREN);
    query.setPageSize(0);
    final List<Task> taskList = getTaskDao().search(query).getList();
    return Utils.buildParentTaskMapping(taskList, parentTaskUuid);
  }

  /**
   * Helper function to build a map of location UUIDs to their top parent capped at a certain point
   * in the hierarchy. The locationUuid will map to parentLocation, and all children will map to the
   * highest parent that is NOT the locationUuid.
   */
  public Map<String, Set<String>> buildLocationHash(String locationUuid, boolean findChildren) {
    final LocationSearchQuery query = new LocationSearchQuery();
    query.setLocationUuid(List.of(locationUuid));
    query.setLocationRecurseStrategy(
        findChildren ? RecurseStrategy.CHILDREN : RecurseStrategy.PARENTS);
    query.setPageSize(0);
    final List<Location> locationList = getLocationDao().search(query).getList();
    return Utils.buildParentLocationMapping(locationList, locationUuid);
  }

  public GraphQLContext getContext() {
    if (context == null) {
      final Map<String, Object> ctx = new HashMap<>();
      // FIXME: create this per (non-GraphQL) request, and make it batch and cache?
      final BatchingUtils batchingUtils = new BatchingUtils(this, false, false);
      ctx.put("dataLoaderRegistry", batchingUtils.getDataLoaderRegistry());
      context = ThreadLocal.withInitial(() -> GraphQLContext.of(ctx));
    }
    return context.get();
  }
}
