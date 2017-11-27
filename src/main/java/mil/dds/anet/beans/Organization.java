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

	public static enum OrganizationType { ADVISOR_ORG, PRINCIPAL_ORG }
	
	String shortName;
	String longName;
	private String identificationCode;
	Organization parentOrg;
	OrganizationType type;
	
	/* The following are all Lazy Loaded */
	List<Position> positions; /*Positions in this Org*/
	List<ApprovalStep> approvalSteps; /*Approval process for this Org */
	List<Organization> childrenOrgs; /* Immediate children */
	List<Organization> descendants; /* All descendants (children of children..)*/
	List<Poam> poams; 
	
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
					.getOrganizationDao().getById(parentOrg.getId());
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
			query.setParentOrgId(id);
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
			query.setParentOrgId(id);
			query.setParentOrgRecursively(true);
			descendants = AnetObjectEngine.getInstance().getOrganizationDao().search(query).getList();
		}
		return descendants;
	}
	
	@GraphQLFetcher("poams")
	public List<Poam> loadPoams() { 
		if (poams == null) { 
			poams = AnetObjectEngine.getInstance().getPoamDao().getPoamsByOrganizationId(this.getId());
		}
		return poams;
	}
	
	@GraphQLIgnore
	public List<Poam> getPoams() { 
		return poams;
	}
	
	public void setPoams(List<Poam> poams) { 
		this.poams = poams;
	}
	
	@GraphQLFetcher("reports")
	public ReportList fetchReports(@GraphQLParam("pageNum") int pageNum, @GraphQLParam("pageSize") int pageSize) {
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
	
	public static Organization create(String shortName, OrganizationType type) { 
		Organization org = new Organization();
		org.setShortName(shortName);
		org.setType(type);
		return org;
	}
	
	public static Organization createWithId(Integer id) { 
		Organization ao = new Organization();
		ao.setId(id);
		ao.setLoadLevel(LoadLevel.ID_ONLY);
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
				&& Objects.equals(other.getIdentificationCode(), identificationCode)
				&& Objects.equals(other.getType(), type);
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(id, shortName, longName, identificationCode, type, createdAt, updatedAt);
	}
	
	@Override
	public String toString() { 
		return String.format("[id:%d shortName:%s longName:%s identificationCode:%s type:%s]", id, shortName, longName, identificationCode, type);
	}
}
