package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class ReportAction extends AbstractAnetBean {

  public enum ActionType {
    APPROVE, REJECT, SUBMIT, PUBLISH, UNPUBLISH
  }

  // annotated below
  private ForeignObjectHolder<ApprovalStep> step = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Report> report = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  ActionType type;
  @GraphQLQuery
  @GraphQLInputField
  private boolean planned;

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
        "no UUID field on ReportAction");
  }

  @Override
  public void setUuid(String uuid) {
    // just ignore
  }

  @GraphQLQuery(name = "step")
  public CompletableFuture<ApprovalStep> loadStep(@GraphQLRootContext GraphQLContext context) {
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
  public void setStepUuid(String stepUuid) {
    this.step = new ForeignObjectHolder<>(stepUuid);
  }

  @JsonIgnore
  public String getStepUuid() {
    return step.getForeignUuid();
  }

  @GraphQLInputField(name = "step")
  public void setStep(ApprovalStep step) {
    this.step = new ForeignObjectHolder<>(step);
  }

  public ApprovalStep getStep() {
    return step.getForeignObject();
  }

  @GraphQLQuery(name = "person")
  public CompletableFuture<Person> loadPerson(@GraphQLRootContext GraphQLContext context) {
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
  public void setPersonUuid(String personUuid) {
    this.person = new ForeignObjectHolder<>(personUuid);
  }

  @JsonIgnore
  public String getPersonUuid() {
    return person.getForeignUuid();
  }

  @GraphQLInputField(name = "person")
  public void setPerson(Person person) {
    this.person = new ForeignObjectHolder<>(person);
  }

  public Person getPerson() {
    return person.getForeignObject();
  }

  // Note: there's *no* loader for report, it should not be necessary

  @JsonIgnore
  public void setReportUuid(String reportUuid) {
    this.report = new ForeignObjectHolder<>(reportUuid);
  }

  @JsonIgnore
  public String getReportUuid() {
    return report.getForeignUuid();
  }

  // So this one will probably be unused
  @GraphQLQuery(name = "report")
  public Report getReport() {
    return report.getForeignObject();
  }

  @GraphQLInputField(name = "report")
  public void setReport(Report report) {
    this.report = new ForeignObjectHolder<>(report);
  }

  public ActionType getType() {
    return type;
  }

  public void setType(ActionType type) {
    this.type = type;
  }

  public boolean isPlanned() {
    return planned;
  }

  public void setPlanned(boolean planned) {
    this.planned = planned;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof ReportAction)) {
      return false;
    }
    ReportAction other = (ReportAction) o;
    return Objects.equals(getStepUuid(), other.getStepUuid())
        && Objects.equals(getPersonUuid(), other.getPersonUuid())
        && Objects.equals(getReportUuid(), other.getReportUuid())
        && Objects.equals(planned, other.isPlanned())
        && Objects.equals(createdAt, other.getCreatedAt()) && Objects.equals(type, other.getType());
  }

  @Override
  public int hashCode() {
    return Objects.hash(step, person, report, createdAt, type, planned);
  }

  @Override
  public String toString() {
    return String.format("[ReportAction: step:%s, type:%s, planned:%s, person:%s, report:%s]",
        getStepUuid(), type, planned, getPersonUuid(), getReportUuid());
  }
}
