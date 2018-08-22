package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.IdFetcher;

public class Organization extends AbstractAnetBean {

	public static enum OrganizationStatus { ACTIVE, INACTIVE }
	public static enum OrganizationType { ADVISOR_ORG, PRINCIPAL_ORG }
	
	String shortName;
	String longName;
	private OrganizationStatus status;
	private String identificationCode;
	Organization parentOrg;
	OrganizationType type;
	
	/* The following are all Lazy Loaded */
	List<Position> positions; /*Positions in this Org*/
	List<ApprovalStep> approvalSteps; /*Approval process for this Org */
	List<Organization> childrenOrgs; /* Immediate children */
	List<Organization> descendants; /* All descendants (children of children..)*/
	List<Task> tasks; 
	
	@GraphQLQuery(name="shortName")
	public String getShortName() {
		return shortName;
	}
	
	public void setShortName(String shortName) {
		this.shortName = Utils.trimStringReturnNull(shortName);
	}

	@GraphQLQuery(name="longName")
	public String getLongName() { 
		return longName;
	}
	
	public void setLongName(String longName) { 
		this.longName = Utils.trimStringReturnNull(longName);
	}
	
	@GraphQLQuery(name="status")
	public OrganizationStatus getStatus() {
		return status;
	}

	public void setStatus(OrganizationStatus status) {
		this.status = status;
	}

	@GraphQLQuery(name="identificationCode")
	public String getIdentificationCode() {
		return identificationCode;
	}

	public void setIdentificationCode(String identificationCode) {
		this.identificationCode = Utils.trimStringReturnNull(identificationCode);
	}

	@GraphQLQuery(name="parentOrg")
	public CompletableFuture<Organization> loadParentOrg(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Organization>().load(context, "organizations", parentOrg)
				.thenApply(o -> { parentOrg = o; return o; });
	}
	
	@GraphQLIgnore
	public Organization getParentOrg() {
		return parentOrg;
	}
	
	public void setParentOrg(Organization parentOrg) {
		this.parentOrg = parentOrg;
	}
	
	@GraphQLQuery(name="type")
	public OrganizationType getType() {
		return type;
	}
	
	public void setType(OrganizationType type) {
		this.type = type;
	}
	
	@GraphQLQuery(name="positions") // TODO: batch load? (used in organizations/Show.js)
	public List<Position> loadPositions() {
		if (positions == null) {
			positions = AnetObjectEngine.getInstance()
					.getPositionDao().getByOrganization(this);
		}
		return positions;
	}
	
	@GraphQLQuery(name="approvalSteps")
	public CompletableFuture<List<ApprovalStep>> loadApprovalSteps(@GraphQLRootContext Map<String, Object> context) {
		return AnetObjectEngine.getInstance()
				.getApprovalStepsForOrg(context, id).thenApply(o -> { approvalSteps = o; return o; });
	}
	
	@GraphQLIgnore
	public List<ApprovalStep> getApprovalSteps() { 
		return approvalSteps;
	}
	
	public void setApprovalSteps(List<ApprovalStep> steps) { 
		this.approvalSteps = steps;
	}
	
	@GraphQLQuery(name="childrenOrgs") // TODO: batch load? (used in organizations/Show.js)
	public List<Organization> loadChildrenOrgs() { 
		if (childrenOrgs == null) { 
			OrganizationSearchQuery query = new OrganizationSearchQuery();
			query.setPageSize(Integer.MAX_VALUE);
			query.setParentOrgId(id);
			query.setParentOrgRecursively(false);
			childrenOrgs = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
		}
		return childrenOrgs;
	}
	
	@GraphQLQuery(name="allDescendantOrgs") // TODO: batch load? (used in App.js for me → position → organization)
	public List<Organization> loadAllDescendants() { 
		if (descendants == null) { 
			OrganizationSearchQuery query = new OrganizationSearchQuery();
			query.setPageSize(Integer.MAX_VALUE);
			query.setParentOrgId(id);
			query.setParentOrgRecursively(true);
			descendants = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
		}
		return descendants;
	}
	
	@GraphQLQuery(name="tasks") // TODO: batch load? (used in organizations/Edit.js)
	public List<Task> loadTasks() { 
		if (tasks == null) { 
			tasks = AnetObjectEngine.getInstance().getTaskDao().getTasksByOrganizationId(this.getId());
		}
		return tasks;
	}
	
	@GraphQLIgnore
	public List<Task> getTasks() { 
		return tasks;
	}
	
	public void setTasks(List<Task> tasks) { 
		this.tasks = tasks;
	}
	
	@GraphQLQuery(name="reports") // TODO: batch load? (appears to be unused)
	public AnetBeanList<Report> fetchReports(@GraphQLArgument(name="pageNum") int pageNum,
			@GraphQLArgument(name="pageSize") int pageSize) {
		ReportSearchQuery query = new ReportSearchQuery();
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		if (this.getType() == OrganizationType.ADVISOR_ORG) { 
			query.setAdvisorOrgId(id);
		} else { 
			query.setPrincipalOrgId(id);
		}
		return AnetObjectEngine.getInstance().getReportDao().search(query);
	}
	
	public static Organization createWithId(Integer id) { 
		Organization ao = new Organization();
		ao.setId(id);
		return ao;
	}
	
	@Override
	public boolean equals(Object o) { 
		if (o == null || o.getClass() != this.getClass()) { 
			return false;
		}
		Organization other = (Organization) o;
		return Objects.equals(other.getId(), id) 
				&& Objects.equals(other.getShortName(), shortName) 
				&& Objects.equals(other.getLongName(), longName) 
				&& Objects.equals(other.getStatus(), status)
				&& Objects.equals(other.getIdentificationCode(), identificationCode)
				&& Objects.equals(other.getType(), type);
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(id, shortName, longName, status, identificationCode, type, createdAt, updatedAt);
	}
	
	@Override
	public String toString() { 
		return String.format("[id:%d shortName:%s longName:%s identificationCode:%s type:%s]", id, shortName, longName, identificationCode, type);
	}
}
