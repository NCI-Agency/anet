package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.search.M2mBatchParams;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Task extends AbstractCustomizableAnetBean {

  /** Pseudo uuid to represent 'no task'. */
  public static final String DUMMY_TASK_UUID = "-1";

  public enum TaskStatus {
    ACTIVE, INACTIVE
  }

  @GraphQLQuery
  @GraphQLInputField
  private Instant plannedCompletion;
  @GraphQLQuery
  @GraphQLInputField
  private Instant projectedCompletion;
  @GraphQLQuery
  @GraphQLInputField
  private String shortName;
  @GraphQLQuery
  @GraphQLInputField
  private String longName;
  @GraphQLQuery
  @GraphQLInputField
  private String category;
  @GraphQLQuery
  @GraphQLInputField
  private String customField;
  @GraphQLQuery
  @GraphQLInputField
  private String customFieldEnum1;
  @GraphQLQuery
  @GraphQLInputField
  private String customFieldEnum2;
  // annotated below
  private ForeignObjectHolder<Task> customFieldRef1 = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  TaskStatus status;
  // annotated below
  private List<Position> responsiblePositions;
  // annotated below
  private List<Organization> taskedOrganizations;

  public void setPlannedCompletion(Instant plannedCompletion) {
    this.plannedCompletion = plannedCompletion;
  }

  public Instant getPlannedCompletion() {
    return plannedCompletion;
  }

  public void setProjectedCompletion(Instant projectedCompletion) {
    this.projectedCompletion = projectedCompletion;
  }

  public Instant getProjectedCompletion() {
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

  public String getCustomFieldEnum1() {
    return customFieldEnum1;
  }

  public void setCustomFieldEnum1(String customFieldEnum1) {
    this.customFieldEnum1 = Utils.trimStringReturnNull(customFieldEnum1);
  }

  public String getCustomFieldEnum2() {
    return customFieldEnum2;
  }

  public void setCustomFieldEnum2(String customFieldEnum2) {
    this.customFieldEnum2 = Utils.trimStringReturnNull(customFieldEnum2);
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = Utils.trimStringReturnNull(category);
  }

  @GraphQLQuery(name = "customFieldRef1")
  public CompletableFuture<Task> loadCustomFieldRef1(
      @GraphQLRootContext Map<String, Object> context) {
    if (customFieldRef1.hasForeignObject()) {
      return CompletableFuture.completedFuture(customFieldRef1.getForeignObject());
    }
    return new UuidFetcher<Task>()
        .load(context, IdDataLoaderKey.TASKS, customFieldRef1.getForeignUuid()).thenApply(o -> {
          customFieldRef1.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setCustomFieldRef1Uuid(String customFieldRef1Uuid) {
    this.customFieldRef1 = new ForeignObjectHolder<>(customFieldRef1Uuid);
  }

  @JsonIgnore
  public String getCustomFieldRef1Uuid() {
    return customFieldRef1.getForeignUuid();
  }

  @GraphQLInputField(name = "customFieldRef1")
  public void setCustomFieldRef1(Task customFieldRef1) {
    this.customFieldRef1 = new ForeignObjectHolder<>(customFieldRef1);
  }

  public Task getCustomFieldRef1() {
    return customFieldRef1.getForeignObject();
  }

  public TaskStatus getStatus() {
    return status;
  }

  public void setStatus(TaskStatus status) {
    this.status = status;
  }

  @GraphQLQuery(name = "reports")
  public CompletableFuture<List<Report>> loadReports(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    if (query == null) {
      query = new ReportSearchQuery();
    }
    query.setBatchParams(new M2mBatchParams<Report, ReportSearchQuery>("reports", "\"reportTasks\"",
        "\"reportUuid\"", "\"taskUuid\""));
    query.setUser(DaoUtils.getUserFromContext(context));
    return AnetObjectEngine.getInstance().getReportDao().getReportsBySearch(context, uuid, query);
  }

  @GraphQLQuery(name = "responsiblePositions")
  public CompletableFuture<List<Position>> loadResponsiblePositions(
      @GraphQLRootContext Map<String, Object> context) {
    if (responsiblePositions != null) {
      return CompletableFuture.completedFuture(responsiblePositions);
    }
    return AnetObjectEngine.getInstance().getTaskDao().getResponsiblePositionsForTask(context, uuid)
        .thenApply(o -> {
          responsiblePositions = o;
          return o;
        });
  }

  public List<Position> getResponsiblePositions() {
    return responsiblePositions;
  }

  @GraphQLInputField(name = "responsiblePositions")
  public void setResponsiblePositions(List<Position> positions) {
    this.responsiblePositions = positions;
  }

  @GraphQLQuery(name = "taskedOrganizations")
  public CompletableFuture<List<Organization>> loadTaskedOrganizations(
      @GraphQLRootContext Map<String, Object> context) {
    if (taskedOrganizations != null) {
      return CompletableFuture.completedFuture(taskedOrganizations);
    }
    return AnetObjectEngine.getInstance().getTaskDao().getTaskedOrganizationsForTask(context, uuid)
        .thenApply(o -> {
          taskedOrganizations = o;
          return o;
        });
  }

  public List<Organization> getTaskedOrganizations() {
    return taskedOrganizations;
  }

  @GraphQLInputField(name = "taskedOrganizations")
  public void setTaskedOrganizations(List<Organization> organizations) {
    this.taskedOrganizations = organizations;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Task)) {
      return false;
    }
    Task other = (Task) o;
    return Objects.equals(other.getUuid(), uuid) && Objects.equals(other.getShortName(), shortName)
        && Objects.equals(other.getLongName(), longName)
        && Objects.equals(other.getCategory(), category)
        && Objects.equals(other.getCustomFieldRef1Uuid(), getCustomFieldRef1Uuid())
        && Objects.equals(other.getCustomFields(), customFields);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, shortName, longName, category, customFieldRef1);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s shortName:%s category:%s customFieldRef1:%s]", uuid, shortName,
        category, getCustomFieldRef1Uuid());
  }

}
