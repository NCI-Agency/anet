package mil.dds.anet.beans;

import java.util.List;
import java.util.Objects;

import org.joda.time.DateTime;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.ReportList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLIgnore;
import mil.dds.anet.graphql.GraphQLParam;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Organization extends AbstractAnetBean {

	public static final String DUMMY_ORG_UUID = "-1"; // pseudo uuid to represent all/top-level organization(s)

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
	
	public String getShortName() {
		return shortName;
	}
	
	public void setShortName(String shortName) {
		this.shortName = Utils.trimStringReturnNull(shortName);
	}

	public String getLongName() { 
		return longName;
	}
	
	public void setLongName(String longName) { 
		this.longName = Utils.trimStringReturnNull(longName);
	}
	
	public OrganizationStatus getStatus() {
		return status;
	}

	public void setStatus(OrganizationStatus status) {
		this.status = status;
	}

	public String getIdentificationCode() {
		return identificationCode;
	}

	public void setIdentificationCode(String identificationCode) {
		this.identificationCode = Utils.trimStringReturnNull(identificationCode);
	}

	@GraphQLFetcher("parentOrg")
	public Organization loadParentOrg() { 
		if (parentOrg == null || parentOrg.getLoadLevel() == null) { return parentOrg; }
		if (parentOrg.getLoadLevel().contains(LoadLevel.PROPERTIES) == false) { 
			this.parentOrg = AnetObjectEngine.getInstance()
					.getOrganizationDao().getByUuid(parentOrg.getUuid());
		}
		return parentOrg;
	}
	
	@GraphQLIgnore
	public Organization getParentOrg() {
		return parentOrg;
	}
	
	public void setParentOrg(Organization parentOrg) {
		this.parentOrg = parentOrg;
	}
	
	public OrganizationType getType() {
		return type;
	}
	
	public void setType(OrganizationType type) {
		this.type = type;
	}
	
	public DateTime getCreatedAt() {
		return createdAt;
	}
	
	public void setCreatedAt(DateTime createdAt) {
		this.createdAt = createdAt;
	}
	
	public DateTime getUpdatedAt() {
		return updatedAt;
	}
	
	public void setUpdatedAt(DateTime updatedAt) {
		this.updatedAt = updatedAt;
	}
	
	@GraphQLFetcher("positions")
	public List<Position> loadPositions() {
		if (positions == null) {
			positions = AnetObjectEngine.getInstance()
					.getPositionDao().getByOrganization(this);
		}
		return positions;
	}
	
	@GraphQLFetcher("approvalSteps")
	public List<ApprovalStep> loadApprovalSteps() { 
		if (approvalSteps == null) { 
			approvalSteps = AnetObjectEngine.getInstance()
					.getApprovalStepsForOrg(this);
		}
		return approvalSteps;
	}
	
	@GraphQLIgnore
	public List<ApprovalStep> getApprovalSteps() { 
		return approvalSteps;
	}
	
	public void setApprovalSteps(List<ApprovalStep> steps) { 
		this.approvalSteps = steps;
	}
	
	@GraphQLFetcher("childrenOrgs")
	public List<Organization> loadChildrenOrgs() { 
		if (childrenOrgs == null) { 
			OrganizationSearchQuery query = new OrganizationSearchQuery();
			query.setPageSize(Integer.MAX_VALUE);
			query.setParentOrgUuid(uuid);
			query.setParentOrgRecursively(false);
			childrenOrgs = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
		}
		return childrenOrgs;
	}
	
	@GraphQLFetcher("allDescendantOrgs")
	public List<Organization> loadAllDescendants() { 
		if (descendants == null) { 
			OrganizationSearchQuery query = new OrganizationSearchQuery();
			query.setPageSize(Integer.MAX_VALUE);
			query.setParentOrgUuid(uuid);
			query.setParentOrgRecursively(true);
			descendants = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
		}
		return descendants;
	}
	
	@GraphQLFetcher("tasks")
	public List<Task> loadTasks() { 
		if (tasks == null) { 
			tasks = AnetObjectEngine.getInstance().getTaskDao().getTasksByOrganizationUuid(this.getUuid());
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
	
	@GraphQLFetcher("reports")
	public ReportList fetchReports(@GraphQLParam("pageNum") int pageNum, @GraphQLParam("pageSize") int pageSize) {
		ReportSearchQuery query = new ReportSearchQuery();
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		if (this.getType() == OrganizationType.ADVISOR_ORG) { 
			query.setAdvisorOrgUuid(uuid);
		} else { 
			query.setPrincipalOrgUuid(uuid);
		}
		return AnetObjectEngine.getInstance().getReportDao().search(query);
	}

	public static Organization createWithUuid(String uuid) {
		final Organization ao = new Organization();
		ao.setUuid(uuid);
		ao.setLoadLevel(LoadLevel.ID_ONLY);
		return ao;
	}
	
	@Override
	public boolean equals(Object o) {
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		Organization other = (Organization) o;
		return Objects.equals(other.getUuid(), uuid)
				&& Objects.equals(other.getShortName(), shortName)
				&& Objects.equals(other.getLongName(), longName)
				&& Objects.equals(other.getStatus(), status)
				&& Objects.equals(other.getIdentificationCode(), identificationCode)
				&& Objects.equals(other.getType(), type);
	}
	
	@Override
	public int hashCode() {
		return Objects.hash(uuid, shortName, longName, status, identificationCode, type, createdAt, updatedAt);
	}
	
	@Override
	public String toString() {
		return String.format("[uuid:%s shortName:%s longName:%s identificationCode:%s type:%s]", uuid, shortName, longName, identificationCode, type);
	}
}
