package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class ReportAction extends AbstractAnetBean {

  public enum ActionType {
    APPROVE, REJECT, SUBMIT, PUBLISH
  }

  private ForeignObjectHolder<ApprovalStep> step = new ForeignObjectHolder<>();
  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>();
  private ForeignObjectHolder<Report> report = new ForeignObjectHolder<>();
  ActionType type;

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new WebApplicationException("no UUID field on ReportAction");
  }

  @GraphQLQuery(name = "step")
  public CompletableFuture<ApprovalStep> loadStep(@GraphQLRootContext Map<String, Object> context) {
    if (step.hasForeignObject()) {
      return CompletableFuture.completedFuture(step.getForeignObject());
    }
    return new UuidFetcher<ApprovalStep>()
        .load(context, IdDataLoaderKey.APPROVAL_STEPS, step.getForeignUuid()).thenApply(o -> {
          step.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setStepUuid(String stepUuid) {
    this.step = new ForeignObjectHolder<>(stepUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getStepUuid() {
    return step.getForeignUuid();
  }

  public void setStep(ApprovalStep step) {
    this.step = new ForeignObjectHolder<>(step);
  }

  @GraphQLIgnore
  public ApprovalStep getStep() {
    return step.getForeignObject();
  }

  @GraphQLQuery(name = "person")
  public CompletableFuture<Person> loadPerson(@GraphQLRootContext Map<String, Object> context) {
    if (person.hasForeignObject()) {
      return CompletableFuture.completedFuture(person.getForeignObject());
    }
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, person.getForeignUuid())
        .thenApply(o -> {
          person.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setPersonUuid(String personUuid) {
    this.person = new ForeignObjectHolder<>(personUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getPersonUuid() {
    return person.getForeignUuid();
  }

  public void setPerson(Person person) {
    this.person = new ForeignObjectHolder<>(person);
  }

  @GraphQLIgnore
  public Person getPerson() {
    return person.getForeignObject();
  }

  // Note: there's *no* loader for report, it should not be necessary

  @JsonIgnore
  @GraphQLIgnore
  public void setReportUuid(String reportUuid) {
    this.report = new ForeignObjectHolder<>(reportUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getReportUuid() {
    return report.getForeignUuid();
  }

  // So this one will probably be unused
  @GraphQLQuery(name = "report")
  public Report getReport() {
    return report.getForeignObject();
  }

  public void setReport(Report report) {
    this.report = new ForeignObjectHolder<>(report);
  }

  @GraphQLQuery(name = "type")
  public ActionType getType() {
    return type;
  }

  public void setType(ActionType type) {
    this.type = type;
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || o.getClass() != this.getClass()) {
      return false;
    }
    ReportAction other = (ReportAction) o;
    return Objects.equals(getStepUuid(), other.getStepUuid())
        && Objects.equals(getPersonUuid(), other.getPersonUuid())
        && Objects.equals(getReportUuid(), other.getReportUuid())
        && Objects.equals(createdAt, other.getCreatedAt()) && Objects.equals(type, other.getType());
  }

  @Override
  public int hashCode() {
    return Objects.hash(step, person, report, createdAt, type);
  }

  @Override
  public String toString() {
    return String.format("[ReportAction: step:%s, type:%s, person:%s, report:%s]", getStepUuid(),
        type, getPersonUuid(), getReportUuid());
  }
}
