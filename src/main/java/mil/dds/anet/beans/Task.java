package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

import org.joda.time.DateTime;

import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.IdFetcher;

public class Task extends AbstractAnetBean {

	public static final String DUMMY_TASK_UUID = "-1"; // pseudo uuid to represent 'no task'

	public enum TaskStatus { ACTIVE, INACTIVE }
	
	DateTime plannedCompletion;
	DateTime projectedCompletion;

	String shortName;
	String longName;
	String category;
	String customField;
	String customFieldEnum1;
	String customFieldEnum2;

	Task customFieldRef1;

	TaskStatus status;

	Organization responsibleOrg;

	public void setPlannedCompletion(DateTime plannedCompletion) {
		this.plannedCompletion = plannedCompletion;
	}

	@GraphQLQuery(name="plannedCompletion")
	public DateTime getPlannedCompletion() {
		return plannedCompletion;
	}

	public void setProjectedCompletion(DateTime projectedCompletion) {
		this.projectedCompletion = projectedCompletion;
	}

	@GraphQLQuery(name="projectedCompletion")
	public DateTime getProjectedCompletion() {
		return projectedCompletion;
	}

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

	@GraphQLQuery(name="customField")
	public String getCustomField() {
		return customField;
	}

	public void setCustomField(String customField) {
		this.customField = Utils.trimStringReturnNull(customField);
	}

	@GraphQLQuery(name="customFieldEnum1")
	public String getCustomFieldEnum1() {
		return customFieldEnum1;
	}

	public void setCustomFieldEnum1(String customFieldEnum1) {
		this.customFieldEnum1 = Utils.trimStringReturnNull(customFieldEnum1);
	}

	@GraphQLQuery(name="customFieldEnum2")
	public String getCustomFieldEnum2() {
		return customFieldEnum2;
	}

	public void setCustomFieldEnum2(String customFieldEnum2) {
		this.customFieldEnum2 = Utils.trimStringReturnNull(customFieldEnum2);
	}

	@GraphQLQuery(name="category")
	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = Utils.trimStringReturnNull(category);
	}

	@GraphQLQuery(name="customFieldRef1")
	public CompletableFuture<Task> loadCustomFieldRef1(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Task>().load(context, "tasks", customFieldRef1)
				.thenApply(o -> { customFieldRef1 = o; return o; });
	}

	public void setCustomFieldRef1(Task customFieldRef1) {
		this.customFieldRef1 = customFieldRef1;
	}

	@GraphQLIgnore
	public Task getCustomFieldRef1() {
		return customFieldRef1;
	}

	@GraphQLQuery(name="status")
	public TaskStatus getStatus() {
		return status;
	}

	public void setStatus(TaskStatus status) {
		this.status = status;
	}

	public void setResponsibleOrg(Organization org) { 
		this.responsibleOrg = org;
	}

	@GraphQLQuery(name="responsibleOrg")
	public CompletableFuture<Organization> loadResponsibleOrg(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Organization>().load(context, "organizations", responsibleOrg)
				.thenApply(o -> { responsibleOrg = o; return o; });
	}

	@GraphQLIgnore
	public Organization getResponsibleOrg() { 
		return responsibleOrg;
	}

	public static Task createWithUuid(String uuid) {
		final Task p = new Task();
		p.setUuid(uuid);
		return p;
	}

	@Override
	public boolean equals(Object o) {
		if (o == null || o.getClass() != this.getClass()) {
			return false;
		}
		Task other = (Task) o;
		return Objects.equals(other.getUuid(), uuid)
				&& Objects.equals(other.getShortName(), shortName)
				&& Objects.equals(other.getLongName(), longName)
				&& Objects.equals(other.getCategory(), category)
				&& uuidEqual(other.getCustomFieldRef1(), customFieldRef1);
	}

	@Override
	public int hashCode() {
		return Objects.hash(uuid, shortName, longName, category, customFieldRef1);
	}

	@Override
	public String toString() {
		return String.format("[uuid:%s shortName:%s category:%s customFieldRef1:%s]", uuid, shortName, category, DaoUtils.getUuid(customFieldRef1));
	}

}
