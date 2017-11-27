package mil.dds.anet.beans;

import java.util.Objects;

import javax.ws.rs.WebApplicationException;

import org.joda.time.DateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLIgnore;
import mil.dds.anet.views.AbstractAnetBean;

public class ApprovalAction extends AbstractAnetBean {

	public enum ApprovalType { APPROVE, REJECT }
	
	ApprovalStep step;
	Person person;
	Report report;
	ApprovalType type;
	
	@Override
	@JsonIgnore
	@GraphQLIgnore
	public Integer getId() { 
		throw new WebApplicationException("no ID field on Approval Action");
	}

	@GraphQLFetcher("step")
	public ApprovalStep loadStep() {
		if (step == null || step.getLoadLevel() == null) { return step; }
		if (step.getLoadLevel().contains(LoadLevel.PROPERTIES) == false) { 
			this.step = AnetObjectEngine.getInstance()
					.getApprovalStepDao().getById(step.getId());
		}
		return step;
	}
	
	public void setStep(ApprovalStep step) {
		this.step = step;
	}
	
	@GraphQLIgnore
	public ApprovalStep getStep() { 
		return step;
	}
	
	@GraphQLIgnore
	public Person getPerson() {
		return person;
	}
	
	public void setPerson(Person person) {
		this.person = person;
	}
	
	@GraphQLFetcher("person")
	public Person loadPerson() { 
		if (person == null || person.getLoadLevel() == null) { return person; } 
		if (person.getLoadLevel().contains(LoadLevel.PROPERTIES) == false) { 
			this.person = AnetObjectEngine.getInstance()
				.getPersonDao().getById(person.getId());
		}
		return person;
	}
	
	public Report getReport() {
		return report;
	}
	
	public void setReport(Report report) {
		this.report = report;
	}
	
	public DateTime getCreatedAt() {
		return createdAt;
	}
	
	public void setCreatedAt(DateTime createdAt) {
		this.createdAt = createdAt;
	}
	
	public ApprovalType getType() {
		return type;
	}
	
	public void setType(ApprovalType type) {
		this.type = type;
	}
	
	@Override
	public boolean equals(Object o) { 
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		ApprovalAction other = (ApprovalAction) o;
		return Objects.equals(step, other.getStep()) 
				&& AbstractAnetBean.idEqual(person, other.getPerson()) 
				&& Objects.equals(report, other.getReport()) 
				&& Objects.equals(createdAt, other.getCreatedAt()) 
				&& Objects.equals(type, other.getType());
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(step, person, report, createdAt, type);
	}
	
	@Override
	public String toString() { 
		return String.format("[ApprovalAction: step:%d, type:%s, person:%d, report:%d]", step.getId(), type, person.getId(), report.getId());
	}
}
