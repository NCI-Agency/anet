package mil.dds.anet;

import com.google.inject.Injector;
import io.dropwizard.Application;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.EmailDao;
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
import mil.dds.anet.database.TagDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.search.ISearcher;
import mil.dds.anet.search.Searcher;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.BatchingUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import ru.vyarus.dropwizard.guice.injector.lookup.InjectorLookup;

public class AnetObjectEngine {

  private final PersonDao personDao;
  private final TaskDao taskDao;
  private final LocationDao locationDao;
  private final OrganizationDao orgDao;
  private final PositionDao positionDao;
  private final ApprovalStepDao asDao;
  private final ReportActionDao reportActionDao;
  private final ReportDao reportDao;
  private final CommentDao commentDao;
  private final AdminDao adminDao;
  private final SavedSearchDao savedSearchDao;
  private final EmailDao emailDao;
  private final TagDao tagDao;
  private final ReportSensitiveInformationDao reportSensitiveInformationDao;
  private final AuthorizationGroupDao authorizationGroupDao;
  private final NoteDao noteDao;
  private final SubscriptionDao subscriptionDao;
  private final SubscriptionUpdateDao subscriptionUpdateDao;
  private ThreadLocal<Map<String, Object>> context;

  ISearcher searcher;

  private static AnetObjectEngine instance;

  private final String dbUrl;
  private final Injector injector;

  public AnetObjectEngine(String dbUrl, Application<?> application) {
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
    tagDao = injector.getInstance(TagDao.class);
    reportSensitiveInformationDao = injector.getInstance(ReportSensitiveInformationDao.class);
    emailDao = injector.getInstance(EmailDao.class);
    authorizationGroupDao = injector.getInstance(AuthorizationGroupDao.class);
    noteDao = injector.getInstance(NoteDao.class);
    subscriptionDao = injector.getInstance(SubscriptionDao.class);
    subscriptionUpdateDao = injector.getInstance(SubscriptionUpdateDao.class);
    searcher = Searcher.getSearcher(DaoUtils.getDbType(dbUrl), injector);
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

  public TagDao getTagDao() {
    return tagDao;
  }

  public ReportSensitiveInformationDao getReportSensitiveInformationDao() {
    return reportSensitiveInformationDao;
  }

  public AuthorizationGroupDao getAuthorizationGroupDao() {
    return authorizationGroupDao;
  }

  public NoteDao getNoteDao() {
    return noteDao;
  }

  public SubscriptionDao getSubscriptionDao() {
    return subscriptionDao;
  }

  public SubscriptionUpdateDao getSubscriptionUpdateDao() {
    return subscriptionUpdateDao;
  }

  public EmailDao getEmailDao() {
    return emailDao;
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

  public CompletableFuture<List<ApprovalStep>> getApprovalStepsForOrg(Map<String, Object> context,
      String aoUuid) {
    return asDao.getByAdvisorOrganizationUuid(context, aoUuid)
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

  public boolean canUserApproveStep(Map<String, Object> context, String userUuid,
      String approvalStepUuid) {
    ApprovalStep as = asDao.getByUuid(approvalStepUuid);
    final List<Position> approvers;
    try {
      approvers = as.loadApprovers(context).get();
    } catch (InterruptedException | ExecutionException e) {
      return false;
    }
    for (Position approverPosition : approvers) {
      // approverPosition.getPerson() has the currentPersonUuid already loaded, so this is safe.
      if (Objects.equals(userUuid, approverPosition.getPersonUuid())) {
        return true;
      }
    }
    return false;
  }

  public boolean canUserRejectStep(Map<String, Object> context, String userUuid,
      String approvalStepUuid) {
    final Person p = personDao.getByUuid(userUuid);
    // Admin users may reject any step
    if (AuthUtils.isAdmin(p)) {
      return true;
    }
    return canUserApproveStep(context, userUuid, approvalStepUuid);
  }

  /*
   * Helper function to build a map of organization UUIDs to their top level parent organization
   * object.
   * 
   * @param orgType: The Organzation Type (ADVISOR_ORG, or PRINCIPAL_ORG) to look for. pass NULL to
   * get all orgs.
   */
  public Map<String, Organization> buildTopLevelOrgHash(OrganizationType orgType) {
    OrganizationSearchQuery orgQuery = new OrganizationSearchQuery();
    orgQuery.setPageSize(Integer.MAX_VALUE);
    orgQuery.setType(orgType);
    List<Organization> orgs = getOrganizationDao().search(orgQuery, null).getList();

    return Utils.buildParentOrgMapping(orgs, null);
  }

  /**
   * Helper function to build a map of organization UUIDs to their top parent capped at a certain
   * point in the hierarchy. parentOrg will map to parentOrg, and all children will map to the
   * highest parent that is NOT the parentOrgUuid.
   */
  public Map<String, Organization> buildTopLevelOrgHash(String parentOrgUuid) {
    final OrganizationSearchQuery query = new OrganizationSearchQuery();
    query.setParentOrgUuid(parentOrgUuid);
    query.setParentOrgRecursively(true);
    query.setPageSize(Integer.MAX_VALUE);
    final List<Organization> orgList =
        AnetObjectEngine.getInstance().getOrganizationDao().search(query, null).getList();
    return Utils.buildParentOrgMapping(orgList, parentOrgUuid);
  }

  /**
   * Helper function to build a map of task UUIDs to their top parent capped at a certain point in
   * the hierarchy. parentTask will map to parentTask, and all children will map to the highest
   * parent that is NOT the parentTaskUuid.
   */
  public Map<String, Task> buildTopLevelTaskHash(String parentTaskUuid) {
    final TaskSearchQuery query = new TaskSearchQuery();
    query.setCustomFieldRef1Uuid(parentTaskUuid);
    query.setCustomFieldRef1Recursively(true);
    query.setPageSize(Integer.MAX_VALUE);
    final List<Task> taskList =
        AnetObjectEngine.getInstance().getTaskDao().search(query, null).getList();
    return Utils.buildParentTaskMapping(taskList, parentTaskUuid);
  }

  public static AnetObjectEngine getInstance() {
    return instance;
  }

  public String getAdminSetting(AdminSettingKeys key) {
    return adminDao.getSetting(key);
  }

  public Map<String, Object> getContext() {
    if (context == null) {
      final Map<String, Object> ctx = new HashMap<>();
      // FIXME: create this per Jersey (non-GraphQL) request, and make it batch and cache?
      ctx.put("dataLoaderRegistry", BatchingUtils.registerDataLoaders(this, false, false));
      context = ThreadLocal.withInitial(() -> ctx);
    }
    return context.get();
  }
}
