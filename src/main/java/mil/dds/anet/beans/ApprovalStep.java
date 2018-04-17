package mil.dds.anet.beans;

import java.util.List;
import java.util.Objects;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLIgnore;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class ApprovalStep extends AbstractAnetBean {

	List<Position> approvers;
	String nextStepUuid;
	String advisorOrganizationUuid;
	String name;

	@GraphQLFetcher("approvers")
	public List<Position> loadApprovers() { 
		if (approvers == null) { 
			approvers = AnetObjectEngine.getInstance().getApprovalStepDao().getApproversForStep(this);
		}
		return approvers;
	}
	
	@GraphQLIgnore
	public List<Position> getApprovers() { 
		return approvers;
	}
	
	public void setApprovers(List<Position> approvers) { 
		this.approvers = approvers;
	}

	public String getNextStepUuid() {
		return nextStepUuid;
	}
	
	public void setNextStepUuid(String nextStepUuid) {
		this.nextStepUuid = nextStepUuid;
	}
	
	public String getAdvisorOrganizationUuid() {
		return advisorOrganizationUuid;
	}
	
	public void setAdvisorOrganizationUuid(String advisorOrganizationUuid) {
		this.advisorOrganizationUuid = advisorOrganizationUuid;
	}
	
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = Utils.trimStringReturnNull(name);
	}

	@Override
	public boolean equals(Object o) {
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		ApprovalStep as = (ApprovalStep) o;
		return Objects.equals(uuid, as.getUuid())
			&& Objects.equals(name,  as.getName())
			&& Objects.equals(nextStepUuid, as.getNextStepUuid())
			&& Objects.equals(advisorOrganizationUuid, as.getAdvisorOrganizationUuid());
	}
	
	@Override
	public int hashCode() {
		return Objects.hash(uuid, approvers, name, nextStepUuid, advisorOrganizationUuid);
	}
	
	@Override
	public String toString() {
		return String.format("%s - %s, aoid: %d, nsid: %d", uuid, name, advisorOrganizationUuid, nextStepUuid);
	}

	public static ApprovalStep createWithUuid(String uuid) {
		final ApprovalStep step = new ApprovalStep();
		step.setUuid(uuid);
		step.setLoadLevel(LoadLevel.ID_ONLY);
		return step;
	}
	
	
}
