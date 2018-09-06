package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class ApprovalStep extends AbstractAnetBean {

	List<Position> approvers;
	Integer nextStepId;
	Integer advisorOrganizationId;
	String name;

	@GraphQLQuery(name="approvers")
	public CompletableFuture<List<Position>> loadApprovers(@GraphQLRootContext Map<String, Object> context) {
		return AnetObjectEngine.getInstance().getApprovalStepDao().getApproversForStep(context, id)
				.thenApply(o -> { approvers = o; return o; });
	}
	
	@GraphQLIgnore
	public List<Position> getApprovers() { 
		return approvers;
	}
	
	public void setApprovers(List<Position> approvers) { 
		this.approvers = approvers;
	}

	@GraphQLQuery(name="nextStepId")
	public Integer getNextStepId() {
		return nextStepId;
	}
	
	public void setNextStepId(Integer nextStepId) {
		this.nextStepId = nextStepId;
	}
	
	@GraphQLQuery(name="advisorOrganizationId")
	public Integer getAdvisorOrganizationId() {
		return advisorOrganizationId;
	}
	
	public void setAdvisorOrganizationId(Integer advisorOrganizationId) {
		this.advisorOrganizationId = advisorOrganizationId;
	}
	
	@GraphQLQuery(name="name")
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
		return Objects.equals(id, as.getId()) 
			&& Objects.equals(name,  as.getName()) 
			&& Objects.equals(nextStepId, as.getNextStepId()) 
			&& Objects.equals(advisorOrganizationId, as.getAdvisorOrganizationId());
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(id, approvers, name, nextStepId, advisorOrganizationId);
	}
	
	@Override
	public String toString() { 
		return String.format("%d - %s, aoid: %d, nsid: %d", id, name, advisorOrganizationId, nextStepId);
	}

	public static ApprovalStep createWithId(Integer id) {
		ApprovalStep step = new ApprovalStep();
		step.setId(id);
		return step;
	}
	
	
}
