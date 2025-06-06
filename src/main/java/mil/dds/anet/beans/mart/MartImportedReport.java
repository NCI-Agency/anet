package mil.dds.anet.beans.mart;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.ForeignObjectHolder;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.UuidFetcher;


public class MartImportedReport {

  public enum State {
    SUBMITTED_OK, SUBMITTED_WARNINGS, NOT_SUBMITTED, NOT_RECEIVED
  }

  @GraphQLQuery
  private Long sequence;
  @GraphQLQuery
  private Instant submittedAt;
  @GraphQLQuery
  private Instant receivedAt;
  @GraphQLQuery
  private State state;
  @GraphQLQuery
  private String errors;

  // annotated below
  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>();
  private ForeignObjectHolder<Report> report = new ForeignObjectHolder<>();

  public Long getSequence() {
    return sequence;
  }

  public void setSequence(Long sequence) {
    this.sequence = sequence;
  }

  public void setPerson(ForeignObjectHolder<Person> person) {
    this.person = person;
  }

  public void setReport(ForeignObjectHolder<Report> report) {
    this.report = report;
  }

  public Instant getSubmittedAt() {
    return submittedAt;
  }

  public void setSubmittedAt(Instant submittedAt) {
    this.submittedAt = submittedAt;
  }

  public Instant getReceivedAt() {
    return receivedAt;
  }

  public void setReceivedAt(Instant receivedAt) {
    this.receivedAt = receivedAt;
  }

  public State getState() {
    return state;
  }

  public void setState(State state) {
    this.state = state;
  }

  @JsonIgnore
  public String getErrors() {
    return errors;
  }

  public void setErrors(final String errors) {
    this.errors = errors;
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

  public void setPerson(Person p) {
    this.person = new ForeignObjectHolder<>(p);
  }

  public Person getPerson() {
    return person.getForeignObject();
  }

  @GraphQLQuery(name = "report")
  public CompletableFuture<Report> loadReport(@GraphQLRootContext GraphQLContext context) {
    if (report.hasForeignObject()) {
      return CompletableFuture.completedFuture(report.getForeignObject());
    }
    return new UuidFetcher<Report>().load(context, IdDataLoaderKey.REPORTS, report.getForeignUuid())
        .thenApply(o -> {
          report.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setReportUuid(String reportUuid) {
    this.report = new ForeignObjectHolder<>(reportUuid);
  }

  @JsonIgnore
  public String getReportUuid() {
    return report.getForeignUuid();
  }

  public void setReport(Report r) {
    this.report = new ForeignObjectHolder<>(r);
  }

  public Report getReport() {
    return report.getForeignObject();
  }
}
