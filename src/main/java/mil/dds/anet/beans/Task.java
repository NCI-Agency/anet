package mil.dds.anet.beans;

import java.util.List;
import java.util.Objects;

import org.joda.time.DateTime;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLIgnore;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Task extends AbstractAnetBean {

	public enum TaskStatus { ACTIVE, INACTIVE }
	
	DateTime plannedCompletion;
	DateTime projectedCompletion;

	String shortName;
	String longName;
	String category;
	String customField;
	String customFieldEnum;

	Task parentTask;
	List<Task> childrenTasks;

	TaskStatus status;

	Organization responsibleOrg;

	public void setPlannedCompletion(DateTime plannedCompletion) {
		this.plannedCompletion = plannedCompletion;
	}

	public DateTime getPlannedCompletion() {
		return plannedCompletion;
	}

	public void setProjectedCompletion(DateTime projectedCompletion) {
		this.projectedCompletion = projectedCompletion;
	}

	public DateTime getProjectedCompletion() {
		return projectedCompletion;
	}

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

	public String getCustomField() {
		return customField;
	}

	public void setCustomField(String customField) {
		this.customField = Utils.trimStringReturnNull(customField);
	}

	public String getCustomFieldEnum() {
		return customFieldEnum;
	}

	public void setCustomFieldEnum(String customFieldEnum) {
		this.customFieldEnum = Utils.trimStringReturnNull(customFieldEnum);
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = Utils.trimStringReturnNull(category);
	}

	@GraphQLFetcher("parentTask")
	public Task loadParentTask() {
		if (parentTask == null || parentTask.getLoadLevel() == null) { return parentTask; }
		if (parentTask.getLoadLevel().contains(LoadLevel.PROPERTIES) == false) { 
			this.parentTask = AnetObjectEngine.getInstance()
					.getTaskDao().getById(parentTask.getId());
		}
		return parentTask;
	}

	public void setParentTask(Task parent) {
		this.parentTask = parent;
	}

	@GraphQLIgnore
	public Task getParentTask() { 
		return this.parentTask;
	}

	@GraphQLFetcher("childrenTasks")
	public List<Task> loadChildrenTasks() { 
		if (childrenTasks == null) { 
			childrenTasks = AnetObjectEngine.getInstance()
					.getTaskDao().getTasksByParentId(this.getId());
		}
		return childrenTasks;
	}

	@GraphQLIgnore
	public List<Task> getChildrenTasks() { 
		return childrenTasks;
	}

	public void setChildrenTasks(List<Task> childrenTasks) { 
		this.childrenTasks = childrenTasks;
	}

	public TaskStatus getStatus() {
		return status;
	}

	public void setStatus(TaskStatus status) {
		this.status = status;
	}

	public void setResponsibleOrg(Organization org) { 
		this.responsibleOrg = org;
	}

	@GraphQLFetcher("responsibleOrg")
	public Organization loadResponsibleOrg() {
		if (responsibleOrg == null || responsibleOrg.getLoadLevel() == null) { return responsibleOrg; } 
		if (responsibleOrg.getLoadLevel().contains(LoadLevel.PROPERTIES) == false) { 
			this.responsibleOrg = AnetObjectEngine.getInstance()
					.getOrganizationDao().getById(responsibleOrg.getId());
		}
		return responsibleOrg;
	}

	@GraphQLIgnore
	public Organization getResponsibleOrg() { 
		return responsibleOrg;
	}

	public static Task createWithId(Integer id) { 
		Task p = new Task();
		p.setId(id);
		p.setLoadLevel(LoadLevel.ID_ONLY);
		return p;
	}

	@Override
	public boolean equals(Object o) { 
		if (o == null || o.getClass() != this.getClass()) { 
			return false;
		}
		Task other = (Task) o;
		return Objects.equals(other.getId(), id) 
				&& Objects.equals(other.getShortName(), shortName) 
				&& Objects.equals(other.getLongName(), longName) 
				&& Objects.equals(other.getCategory(), category) 
				&& idEqual(other.getParentTask(), parentTask);
	}

	@Override
	public int hashCode() { 
		return Objects.hash(id, shortName, longName, category, parentTask);
	}

	@Override
	public String toString() { 
		return String.format("[id:%d shortName:%s category:%s parentTask:%d]", id, shortName, category, DaoUtils.getId(parentTask));
	}

}
