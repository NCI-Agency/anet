package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

import javax.ws.rs.WebApplicationException;

import com.fasterxml.jackson.annotation.JsonIgnore;

import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.IdFetcher;

public class ApprovalAction extends AbstractAnetBean {

	public enum ApprovalType { APPROVE, REJECT }
	
	ApprovalStep step;
	Person person;
	Report report;
	ApprovalType type;
	
	@Override
	@JsonIgnore
	@GraphQLIgnore
	public String getUuid() {
		throw new WebApplicationException("no UUID field on ApprovalAction");
	}

	@GraphQLQuery(name="step")
	public CompletableFuture<ApprovalStep> loadStep(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<ApprovalStep>().load(context, "approvalSteps", step)
				.thenApply(o -> { step = o; return o; });
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
	
	@GraphQLQuery(name="person")
	public CompletableFuture<Person> loadPerson(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Person>().load(context, "people", person)
				.thenApply(o -> { person = o; return o; });
	}
	
	@GraphQLQuery(name="report")
	public Report getReport() {
		return report;
	}
	
	public void setReport(Report report) {
		this.report = report;
	}
	
	@GraphQLQuery(name="type")
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
				&& AbstractAnetBean.uuidEqual(person, other.getPerson())
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
		return String.format("[ApprovalAction: step:%s, type:%s, person:%s, report:%s]", DaoUtils.getUuid(step), type, DaoUtils.getUuid(person), DaoUtils.getUuid(report));
	}
}
