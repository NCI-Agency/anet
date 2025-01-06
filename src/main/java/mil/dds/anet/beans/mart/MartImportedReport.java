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
  @GraphQLQuery
  private Instant createdAt;
  @GraphQLQuery
  private boolean success;
  @GraphQLQuery
  private String errors;

  // annotated below
  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>();
  private ForeignObjectHolder<Report> report = new ForeignObjectHolder<>();

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public boolean isSuccess() {
    return success;
  }

  public void setSuccess(boolean success) {
    this.success = success;
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
