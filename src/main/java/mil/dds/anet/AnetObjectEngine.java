package mil.dds.anet;

import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.function.BiFunction;
import java.util.function.Function;

import org.dataloader.DataLoaderRegistry;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.Handle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.ApprovalActionDao;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.ReportSensitiveInformationDao;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.database.TagDao;
import mil.dds.anet.search.ISearcher;
import mil.dds.anet.search.Searcher;
import mil.dds.anet.utils.BatchingUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class AnetObjectEngine {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	PersonDao personDao;
	TaskDao taskDao;
	LocationDao locationDao;
	OrganizationDao orgDao;
	PositionDao positionDao;
	ApprovalStepDao asDao;
	ApprovalActionDao approvalActionDao;
	ReportDao reportDao;
	CommentDao commentDao;
	AdminDao adminDao;
	SavedSearchDao savedSearchDao;
	private EmailDao emailDao;
	private final TagDao tagDao;
	private final ReportSensitiveInformationDao reportSensitiveInformationDao;
	private final AuthorizationGroupDao authorizationGroupDao;
	private final NoteDao noteDao;
	private final Map<String, Object> context;

	ISearcher searcher;
	private final DataLoaderRegistry dataLoaderRegistry;

	private static AnetObjectEngine instance; 
	
	private final Handle dbHandle;
	
	public AnetObjectEngine(Jdbi jdbi) {
		dbHandle = jdbi.open();
		
		personDao = new PersonDao(dbHandle);
		taskDao = new TaskDao(dbHandle);
		locationDao =  new LocationDao(dbHandle);
		orgDao = new OrganizationDao(dbHandle);
		positionDao = new PositionDao(dbHandle);
		asDao = new ApprovalStepDao(dbHandle);
		approvalActionDao = new ApprovalActionDao(dbHandle);
		reportDao = new ReportDao(dbHandle);
		commentDao = new CommentDao(dbHandle);
		adminDao = new AdminDao(dbHandle);
		savedSearchDao = new SavedSearchDao(dbHandle);
		tagDao = new TagDao(dbHandle);
		reportSensitiveInformationDao = new ReportSensitiveInformationDao(dbHandle);
		emailDao = new EmailDao(dbHandle);
		authorizationGroupDao = new AuthorizationGroupDao(dbHandle);
		noteDao = new NoteDao(dbHandle);
		searcher = Searcher.getSearcher(DaoUtils.getDbType(dbHandle));
		// FIXME: create this per Jersey (non-GraphQL) request, and make it batch and cache
		dataLoaderRegistry = BatchingUtils.registerDataLoaders(this, false, false);
		context = new HashMap<>();
		context.put("dataLoaderRegistry", dataLoaderRegistry);

		instance = this;
	}

	public Handle getDbHandle() {
		return dbHandle;
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

	public ApprovalActionDao getApprovalActionDao() {
		return approvalActionDao;
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

	public EmailDao getEmailDao() {
		return emailDao;
	}

	public ISearcher getSearcher() {
		return searcher;
	}

	public String getDefaultOrgUuid() {
		return getAdminSetting(AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION);
	}

	public CompletableFuture<Organization> getOrganizationForPerson(Map<String, Object> context, String personUuid) {
		if (personUuid == null) {
			return CompletableFuture.completedFuture(null);
		}
		return orgDao.getOrganizationsForPerson(context, personUuid)
				.thenApply(l -> l.isEmpty() ? null : l.get(0));
	}

	public <T, R> R executeInTransaction(Function<T, R> processor, T input) {
		logger.debug("Wrapping a transaction around {}", processor);
		return getDbHandle().inTransaction(h -> processor.apply(input));
	}

	public <T, U, R> R executeInTransaction(BiFunction<T, U, R> processor, T arg1, U arg2) {
		logger.debug("Wrapping a transaction around {}", processor);
		return getDbHandle().inTransaction(h -> processor.apply(arg1, arg2));
	}

	public CompletableFuture<List<ApprovalStep>> getApprovalStepsForOrg(Map<String, Object> context, String aoUuid) {
		return asDao.getByAdvisorOrganizationUuid(context, aoUuid)
				.thenApply(unordered -> orderSteps(unordered));
	}

	private List<ApprovalStep> orderSteps(List<ApprovalStep> unordered) {
		int numSteps = unordered.size();
		LinkedList<ApprovalStep> ordered = new LinkedList<ApprovalStep>();
		String nextStep = null;
		for (int i = 0;i < numSteps;i++) {
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
	
	public boolean canUserApproveStep(Map<String, Object> context, String userUuid, String approvalStepUuid) {
		ApprovalStep as = asDao.getByUuid(approvalStepUuid);
		final List<Position> approvers;
		try {
			approvers = as.loadApprovers(context).get();
		} catch (InterruptedException | ExecutionException e) {
			return false;
		}
		for (Position approverPosition: approvers) {
			//approverPosition.getPerson() has the currentPersonUuid already loaded, so this is safe.
			if (Objects.equals(userUuid, approverPosition.getPersonUuid())) { return true; }
		}
		return false;
	}

	/*
	 * Helper function to build a map of organization UUIDs to their top level parent organization object.
	 * @param orgType: The Organzation Type (ADVISOR_ORG, or PRINCIPAL_ORG) to look for. pass NULL to get all orgs.
	 */
	public Map<String,Organization> buildTopLevelOrgHash(OrganizationType orgType) {
		OrganizationSearchQuery orgQuery = new OrganizationSearchQuery();
		orgQuery.setPageSize(Integer.MAX_VALUE);
		orgQuery.setType(orgType);
		List<Organization> orgs = getOrganizationDao().search(orgQuery).getList();

		return Utils.buildParentOrgMapping(orgs, null);
	}
	
	/* Helper function to build a map or organization UUIDs to their top parent
	 * capped at a certain point in the hierarchy.
	 * parentOrg will map to parentOrg, and all children will map to the highest
	 * parent that is NOT the parentOrgUuid.
	 */
	public Map<String,Organization> buildTopLevelOrgHash(String parentOrgUuid) {
		OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setParentOrgUuid(parentOrgUuid);
		query.setParentOrgRecursively(true);
		query.setPageSize(Integer.MAX_VALUE);
		List<Organization> orgList = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
		return Utils.buildParentOrgMapping(orgList, parentOrgUuid);
	}
	
	public static AnetObjectEngine getInstance() { 
		return instance;
	}
	
	public String getAdminSetting(AdminSettingKeys key) { 
		return adminDao.getSetting(key);
	}

	public Map<String, Object> getContext() {
		return context;
	}
}
