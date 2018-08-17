package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.Comparator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import javax.ws.rs.WebApplicationException;

import org.joda.time.DateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.IdFetcher;

public class Report extends AbstractAnetBean {

	public enum ReportState { DRAFT, PENDING_APPROVAL, RELEASED, REJECTED, CANCELLED, FUTURE }
	public enum Atmosphere { POSITIVE, NEUTRAL, NEGATIVE }
	public enum ReportCancelledReason { CANCELLED_BY_ADVISOR,
										CANCELLED_BY_PRINCIPAL,
										CANCELLED_DUE_TO_TRANSPORTATION,
										CANCELLED_DUE_TO_FORCE_PROTECTION,
										CANCELLED_DUE_TO_ROUTES,
										CANCELLED_DUE_TO_THREAT }

	ApprovalStep approvalStep;
	ReportState state;
	DateTime releasedAt;
	
	DateTime engagementDate;
	private Integer engagementDayOfWeek;
	Location location;
	String intent;
	String exsum; //can be null to autogenerate
	Atmosphere atmosphere;
	String atmosphereDetails;
	ReportCancelledReason cancelledReason;
	
	List<ReportPerson> attendees;
	List<Task> tasks;

	String keyOutcomes;
	String nextSteps;
	String reportText;
	
	Person author;	
	
	Organization advisorOrg;
	Organization principalOrg;
	ReportPerson primaryAdvisor;
	ReportPerson primaryPrincipal;

	List<Comment> comments;
	private List<Tag> tags;
	private ReportSensitiveInformation reportSensitiveInformation;
	// The user who instantiated this; needed to determine access to sensitive information
	private Person user;
	private List<AuthorizationGroup> authorizationGroups;

	@GraphQLIgnore
	public ApprovalStep getApprovalStep() {
		return approvalStep;
	}

	public void setApprovalStep(ApprovalStep approvalStep) {
		this.approvalStep = approvalStep;
	}

	@GraphQLQuery(name="approvalStep")
	public CompletableFuture<ApprovalStep> loadApprovalStep(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<ApprovalStep>().load(context, "approvalSteps", approvalStep)
				.thenApply(o -> { approvalStep = o; return o; });
	}
	
	@GraphQLQuery(name="state")
	public ReportState getState() {
		return state;
	}	

	public void setState(ReportState state) {
		this.state = state;
	}

	@GraphQLQuery(name="releasedAt")
	public DateTime getReleasedAt() {
		return releasedAt;
	}

	public void setReleasedAt(DateTime releasedAt) {
		this.releasedAt = releasedAt;
	}

	@GraphQLQuery(name="engagementDate")
	public DateTime getEngagementDate() {
		return engagementDate;
	}

	public void setEngagementDate(DateTime engagementDate) {
		this.engagementDate = engagementDate;
	}

	/**
	 * Returns an Integer value from the set (1,2,3,4,5,6,7) in accordance with
	 * week days [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday].
	 *
	 * @return Integer engagement day of week
	 */
	@GraphQLQuery(name="engagementDayOfWeek")
	public Integer getEngagementDayOfWeek() {
		return engagementDayOfWeek;
	}

	public void setEngagementDayOfWeek(Integer engagementDayOfWeek) {
		this.engagementDayOfWeek = engagementDayOfWeek;
	}

	@GraphQLQuery(name="location")
	public CompletableFuture<Location> loadLocation(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Location>().load(context, "locations", location)
				.thenApply(o -> { location = o; return o; });
	}

	public void setLocation(Location location) {
		this.location = location;
	}
	
	@GraphQLIgnore
	public Location getLocation() { 
		return location;
	}

	@GraphQLQuery(name="intent")
	public String getIntent() {
		return intent;
	}

	@GraphQLQuery(name="exsum")
	public String getExsum() {
		return exsum;
	}

	public void setExsum(String exsum) {
		this.exsum = Utils.trimStringReturnNull(exsum);
	}

	@GraphQLQuery(name="atmosphere")
	public Atmosphere getAtmosphere() {
		return atmosphere;
	}

	public void setAtmosphere(Atmosphere atmosphere) {
		this.atmosphere = atmosphere;
	}

	@GraphQLQuery(name="atmosphereDetails")
	public String getAtmosphereDetails() {
		return atmosphereDetails;
	}

	public void setAtmosphereDetails(String atmosphereDetails) {
		this.atmosphereDetails = Utils.trimStringReturnNull(atmosphereDetails);
	}

	@GraphQLQuery(name="cancelledReason")
	public ReportCancelledReason getCancelledReason() {
		return cancelledReason;
	}

	public void setCancelledReason(ReportCancelledReason cancelledReason) {
		this.cancelledReason = cancelledReason;
	}

	public void setIntent(String intent) {
		this.intent = Utils.trimStringReturnNull(intent);
	}

	@GraphQLQuery(name="attendees")
	public CompletableFuture<List<ReportPerson>> loadAttendees(@GraphQLRootContext Map<String, Object> context) {
		return AnetObjectEngine.getInstance().getReportDao().getAttendeesForReport(context, id)
				.thenApply(o -> { attendees = o; return o; });
	}
	
	@GraphQLIgnore
	public List<ReportPerson> getAttendees() {
		return attendees;
	}

	public void setAttendees(List<ReportPerson> attendees) {
		this.attendees = attendees;
	}

	@GraphQLQuery(name="primaryAdvisor")
	public CompletableFuture<ReportPerson> loadPrimaryAdvisor(@GraphQLRootContext Map<String, Object> context) {
		return loadAttendees(context) //Force the load of attendees
				.thenApply(l ->
		{
			primaryAdvisor = l.stream().filter(p -> p.isPrimary() && p.getRole().equals(Role.ADVISOR))
					.findFirst().orElse(null);
			return primaryAdvisor;
		});
	}

	@GraphQLQuery(name="primaryPrincipal")
	public CompletableFuture<ReportPerson> loadPrimaryPrincipal(@GraphQLRootContext Map<String, Object> context) {
		return loadAttendees(context) //Force the load of attendees
				.thenApply(l ->
		{
			primaryPrincipal = l.stream().filter(p -> p.isPrimary() && p.getRole().equals(Role.PRINCIPAL))
					.findFirst().orElse(null);
			return primaryPrincipal;
		});
	}

	@GraphQLIgnore
	public ReportPerson getPrimaryAdvisor() {
		return primaryAdvisor;
	}

	@GraphQLIgnore
	public ReportPerson getPrimaryPrincipal() {
		return primaryPrincipal;
	}
	
	@GraphQLQuery(name="tasks")
	public CompletableFuture<List<Task>> loadTasks(@GraphQLRootContext Map<String, Object> context) {
		return AnetObjectEngine.getInstance().getReportDao().getTasksForReport(context, id)
				.thenApply(o -> { tasks = o; return o; });
	}

	public void setTasks(List<Task> tasks) {
		this.tasks = tasks;
	}
	
	@GraphQLIgnore
	public List<Task> getTasks() { 
		return tasks;
	}

	@GraphQLQuery(name="keyOutcomes")
	public String getKeyOutcomes() {
		return keyOutcomes;
	}

	public void setKeyOutcomes(String keyOutcomes) {
		this.keyOutcomes = Utils.trimStringReturnNull(keyOutcomes);
	}

	@GraphQLQuery(name="reportText")
	public String getReportText() {
		return reportText;
	}

	public void setReportText(String reportText) {
		this.reportText = Utils.trimStringReturnNull(reportText);
	}

	@GraphQLQuery(name="nextSteps")
	public String getNextSteps() {
		return nextSteps;
	}

	public void setNextSteps(String nextSteps) {
		this.nextSteps = Utils.trimStringReturnNull(nextSteps);
	}

	@GraphQLQuery(name="author")
	public CompletableFuture<Person> loadAuthor(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Person>().load(context, "people", author)
				.thenApply(o -> { author = o; return o; });
	}

	@JsonSetter("author")
	public void setAuthor(Person author) {
		this.author = author;
	}
	
	@GraphQLIgnore
	public Person getAuthor() { 
		return author;
	}
	
	@GraphQLIgnore
	public Organization getAdvisorOrg() {
		return advisorOrg;
	}

	public void setAdvisorOrg(Organization advisorOrg) {
		this.advisorOrg = advisorOrg;
	}

	@GraphQLQuery(name="advisorOrg")
	public CompletableFuture<Organization> loadAdvisorOrg(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Organization>().load(context, "organizations", advisorOrg)
				.thenApply(o -> { advisorOrg = o; return o; });
	}
	
	@GraphQLIgnore
	public Organization getPrincipalOrg() {
		return principalOrg;
	}

	public void setPrincipalOrg(Organization principalOrg) {
		this.principalOrg = principalOrg;
	}

	@GraphQLQuery(name="principalOrg")
	public CompletableFuture<Organization> loadPrincipalOrg(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Organization>().load(context, "organizations", principalOrg)
				.thenApply(o -> { principalOrg = o; return o; });
	}
	
	@GraphQLQuery(name="comments") // TODO: batch load? (used in reports/{Minimal,Show}.js
	public List<Comment> loadComments() {
		if (comments == null) {
			comments = AnetObjectEngine.getInstance().getCommentDao().getCommentsForReport(this);
		}
		return comments;
	}

	@JsonSetter("comments")
	public void setComments(List<Comment> comments) {
		this.comments = comments;
	}
	
	@GraphQLIgnore
	public List<Comment> getComments() { 
		return comments;
	}
	
	/*Returns a full list of the approval steps and statuses for this report
	 * There will be an approval action for each approval step for this report
	 * With information about the 
	 */
	@GraphQLQuery(name="approvalStatus") // TODO: batch load (used in ReportCollection.js)
	public List<ApprovalAction> loadApprovalStatus() {
		AnetObjectEngine engine = AnetObjectEngine.getInstance();
		List<ApprovalAction> actions = engine.getApprovalActionDao().getActionsForReport(this.getId()); // queries db!
		
		if (this.getState() == ReportState.RELEASED) {
			//Compact to only get the most recent event for each step.
			if (actions.size() == 0) { 
				//Magically released, probably imported this way. 
				return actions;
			}
			ApprovalAction last = actions.get(0);
			List<ApprovalAction> compacted = new LinkedList<ApprovalAction>();
			for (ApprovalAction action : actions) {
				if (action.getStep() != null && last.getStep() != null && action.getStep().getId().equals(last.getStep().getId()) == false) { 
					compacted.add(last);
				}
				last = action;
			}
			compacted.add(actions.get(actions.size() - 1));
			return compacted;
		}
		
		Organization ao = engine.getOrganizationForPerson(getAuthor()); // queries db!
		if (ao == null) {
			//use the default approval workflow.
			String defaultOrgId = engine.getAdminSetting(AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION);
			if (defaultOrgId == null) { 
				throw new WebApplicationException("Missing the DEFAULT_APPROVAL_ORGANIZATION admin setting");
			}
			ao = Organization.createWithId(Integer.parseInt(defaultOrgId));
		}
		
		List<ApprovalStep> steps = engine.getApprovalStepsForOrg(ao); // queries db!
		if (steps == null || steps.size() == 0) {
			//No approval steps for this organization
			String defaultOrgId = engine.getAdminSetting(AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION);
			if (defaultOrgId == null) { 
				throw new WebApplicationException("Missing the DEFAULT_APPROVAL_ORGANIZATION admin setting");
			}
			steps = engine.getApprovalStepsForOrg(Organization.createWithId(Integer.parseInt(defaultOrgId))); // queries db!
		}
				
		List<ApprovalAction> workflow = new LinkedList<ApprovalAction>();
		for (ApprovalStep step : steps) { 
			//If there is an Action for this step, grab the last one (date wise)
			Optional<ApprovalAction> existing = actions.stream().filter(a -> 
					Objects.equals(step.getId(), DaoUtils.getId(a.getStep()))
				).max(new Comparator<ApprovalAction>() {
					public int compare(ApprovalAction a, ApprovalAction b) {
						return a.getCreatedAt().compareTo(b.getCreatedAt());
					}
				});
			ApprovalAction action;
			if (existing.isPresent()) { 
				action = existing.get();
			} else { 
				//If not then create a new one and attach this step
				action = new ApprovalAction();		
			}
			action.setStep(step);
			workflow.add(action);
		}
		return workflow;
	}

	@GraphQLQuery(name="tags")
	public CompletableFuture<List<Tag>> loadTags(@GraphQLRootContext Map<String, Object> context) {
		return AnetObjectEngine.getInstance().getReportDao().getTagsForReport(context, id)
				.thenApply(o -> { tags = o; return o; });
	}

	@GraphQLIgnore
	public List<Tag> getTags() {
		return tags;
	}

	public void setTags(List<Tag> tags) {
		this.tags = tags;
	}

	@GraphQLQuery(name="reportSensitiveInformation")
	public CompletableFuture<ReportSensitiveInformation> loadReportSensitiveInformation(@GraphQLRootContext Map<String, Object> context) {
		return AnetObjectEngine.getInstance().getReportSensitiveInformationDao().getForReport(context, this, user)
				.thenApply(o -> { reportSensitiveInformation = o; return o; });
	}

	@GraphQLIgnore
	public ReportSensitiveInformation getReportSensitiveInformation() {
		return reportSensitiveInformation;
	}

	public void setReportSensitiveInformation(ReportSensitiveInformation reportSensitiveInformation) {
		this.reportSensitiveInformation = reportSensitiveInformation;
	}

	@JsonIgnore
	@GraphQLIgnore
	public Person getUser() {
		return user;
	}

	@JsonIgnore
	@GraphQLIgnore
	public void setUser(Person user) {
		this.user = user;
	}

	@GraphQLQuery(name="authorizationGroups") // TODO: batch load? (used in reports/{Edit,Show}.js)
	public List<AuthorizationGroup> loadAuthorizationGroups() {
		if (authorizationGroups == null && id != null) {
			authorizationGroups = AnetObjectEngine.getInstance().getReportDao().getAuthorizationGroupsForReport(id);
		}
		return authorizationGroups;
	}

	public void setAuthorizationGroups(List<AuthorizationGroup> authorizationGroups) {
		this.authorizationGroups = authorizationGroups;
	}

	@GraphQLIgnore
	public List<AuthorizationGroup> getAuthorizationGroups() {
		return authorizationGroups;
	}

	@Override
	public boolean equals(Object other) {
		if (other == null || other.getClass() != this.getClass()) {
			return false;
		}
		Report r = (Report) other;
		return Objects.equals(r.getId(), id)
				&& Objects.equals(r.getState(), state)
				&& idEqual(r.getApprovalStep(), approvalStep)
				&& Objects.equals(r.getCreatedAt(), createdAt)
				&& Objects.equals(r.getUpdatedAt(), updatedAt)
				&& Objects.equals(r.getEngagementDate(), engagementDate)
				&& idEqual(r.getLocation(), location)
				&& Objects.equals(r.getIntent(), intent)
				&& Objects.equals(r.getExsum(), exsum)
				&& Objects.equals(r.getAtmosphere(), atmosphere)
				&& Objects.equals(r.getAtmosphereDetails(), atmosphereDetails)
				&& Objects.equals(r.getAttendees(), attendees)
				&& Objects.equals(r.getTasks(), tasks)
				&& Objects.equals(r.getReportText(), reportText)
				&& Objects.equals(r.getNextSteps(), nextSteps)
				&& idEqual(r.getAuthor(), author)
				&& Objects.equals(r.getComments(), comments)
				&& Objects.equals(r.getTags(), tags)
				&& Objects.equals(r.getReportSensitiveInformation(), reportSensitiveInformation)
				&& Objects.equals(r.getAuthorizationGroups(), authorizationGroups);
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(id, state, approvalStep, createdAt, updatedAt, 
			location, intent, exsum, attendees, tasks, reportText, 
			nextSteps, author, comments, atmosphere, atmosphereDetails, engagementDate,
			tags, reportSensitiveInformation, authorizationGroups);
	}

	public static Report createWithId(Integer id) {
		Report r = new Report();
		r.setId(id);
		return r;
	}
	
	@Override
	public String toString() { 
		return String.format("[id:%d, intent:%s]", id, intent);
	}
}
