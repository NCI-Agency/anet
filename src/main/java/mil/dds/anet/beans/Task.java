package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLIgnore;
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
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Task extends AbstractAnetBean {

  /** Pseudo uuid to represent 'no task'. */
  @GraphQLIgnore
  public static final String DUMMY_TASK_UUID = "-1";

  public enum TaskStatus {
    ACTIVE, INACTIVE
  }

  private Instant plannedCompletion;
  private Instant projectedCompletion;

  private String shortName;
  private String longName;
  private String category;
  private String customField;
  private String customFieldEnum1;
  private String customFieldEnum2;

  private List<Report> reports;

  private ForeignObjectHolder<Task> customFieldRef1 = new ForeignObjectHolder<>();

  TaskStatus status;

  private ForeignObjectHolder<Organization> responsibleOrg = new ForeignObjectHolder<>();

  private List<Position> responsiblePositions;

  public void setPlannedCompletion(Instant plannedCompletion) {
    this.plannedCompletion = plannedCompletion;
  }

  @GraphQLQuery(name = "plannedCompletion")
  public Instant getPlannedCompletion() {
    return plannedCompletion;
  }

  public void setProjectedCompletion(Instant projectedCompletion) {
    this.projectedCompletion = projectedCompletion;
  }

  @GraphQLQuery(name = "projectedCompletion")
  public Instant getProjectedCompletion() {
    return projectedCompletion;
  }

  @GraphQLQuery(name = "shortName")
  public String getShortName() {
    return shortName;
  }

  public void setShortName(String shortName) {
    this.shortName = Utils.trimStringReturnNull(shortName);
  }

  @GraphQLQuery(name = "longName")
  public String getLongName() {
    return longName;
  }

  public void setLongName(String longName) {
    this.longName = Utils.trimStringReturnNull(longName);
  }

  @GraphQLQuery(name = "customField")
  public String getCustomField() {
    return customField;
  }

  public void setCustomField(String customField) {
    this.customField = Utils.trimStringReturnNull(customField);
  }

  @GraphQLQuery(name = "customFieldEnum1")
  public String getCustomFieldEnum1() {
    return customFieldEnum1;
  }

  public void setCustomFieldEnum1(String customFieldEnum1) {
    this.customFieldEnum1 = Utils.trimStringReturnNull(customFieldEnum1);
  }

  @GraphQLQuery(name = "customFieldEnum2")
  public String getCustomFieldEnum2() {
    return customFieldEnum2;
  }

  public void setCustomFieldEnum2(String customFieldEnum2) {
    this.customFieldEnum2 = Utils.trimStringReturnNull(customFieldEnum2);
  }

  @GraphQLQuery(name = "category")
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
  @GraphQLIgnore
  public void setCustomFieldRef1Uuid(String customFieldRef1Uuid) {
    this.customFieldRef1 = new ForeignObjectHolder<>(customFieldRef1Uuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getCustomFieldRef1Uuid() {
    return customFieldRef1.getForeignUuid();
  }

  public void setCustomFieldRef1(Task customFieldRef1) {
    this.customFieldRef1 = new ForeignObjectHolder<>(customFieldRef1);
  }

  @GraphQLIgnore
  public Task getCustomFieldRef1() {
    return customFieldRef1.getForeignObject();
  }

  @GraphQLQuery(name = "status")
  public TaskStatus getStatus() {
    return status;
  }

  public void setStatus(TaskStatus status) {
    this.status = status;
  }

  @GraphQLQuery(name = "responsibleOrg")
  public CompletableFuture<Organization> loadResponsibleOrg(
      @GraphQLRootContext Map<String, Object> context) {
    if (responsibleOrg.hasForeignObject()) {
      return CompletableFuture.completedFuture(responsibleOrg.getForeignObject());
    }
    return new UuidFetcher<Organization>()
        .load(context, IdDataLoaderKey.ORGANIZATIONS, responsibleOrg.getForeignUuid())
        .thenApply(o -> {
          responsibleOrg.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setResponsibleOrgUuid(String responsibleOrgUuid) {
    this.responsibleOrg = new ForeignObjectHolder<>(responsibleOrgUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getResponsibleOrgUuid() {
    return responsibleOrg.getForeignUuid();
  }

  public void setResponsibleOrg(Organization org) {
    this.responsibleOrg = new ForeignObjectHolder<>(org);
  }

  @GraphQLIgnore
  public Organization getResponsibleOrg() {
    return responsibleOrg.getForeignObject();
  }

  @GraphQLQuery(name = "reports")
  public CompletableFuture<List<Report>> loadReports(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    if (reports != null) {
      return CompletableFuture.completedFuture(reports);
    }
    if (query == null) {
      query = new ReportSearchQuery();
    }
    query.setBatchParams(new M2mBatchParams<Report, ReportSearchQuery>("reports", "\"reportTasks\"",
        "\"reportUuid\"", "\"taskUuid\""));
    query.setUser(DaoUtils.getUserFromContext(context));
    return AnetObjectEngine.getInstance().getReportDao().getReportsBySearch(context, uuid, query)
        .thenApply(o -> {
          reports = o;
          return o;
        });
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

  @GraphQLIgnore
  public List<Position> getResponsiblePositions() {
    return responsiblePositions;
  }

  public void setResponsiblePositions(List<Position> positions) {
    this.responsiblePositions = positions;
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
        && Objects.equals(other.getResponsiblePositions(), responsiblePositions);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, shortName, longName, category, customFieldRef1, responsiblePositions);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s shortName:%s category:%s customFieldRef1:%s]", uuid, shortName,
        category, getCustomFieldRef1Uuid());
  }

}
