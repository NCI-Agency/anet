package mil.dds.anet.beans;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.views.AbstractAnetBean;

public class Tenant extends AbstractAnetBean implements WithStatus {
  @GraphQLQuery
  @GraphQLInputField
  private Status status = Status.ACTIVE;
  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> emailAddresses;
  // annotated below
  private List<Position> administrativePositions;
  // annotated below
  private List<Person> members;

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public List<String> getEmailAddresses() {
    return emailAddresses;
  }

  public void setEmailAddresses(List<String> emailAddresses) {
    this.emailAddresses = emailAddresses;
  }

  @GraphQLQuery(name = "administrativePositions")
  public CompletableFuture<List<Position>> loadAdministrativePositions(
      @GraphQLRootContext GraphQLContext context) {
    if (administrativePositions != null) {
      return CompletableFuture.completedFuture(administrativePositions);
    }
    return engine().getTenantDao().getAdministrativePositionsForTenant(context, uuid)
        .thenApply(o -> {
          administrativePositions = o;
          return o;
        });
  }

  public List<Position> getAdministrativePositions() {
    return administrativePositions;
  }

  @GraphQLInputField(name = "administrativePositions")
  public void setAdministrativePositions(List<Position> positions) {
    this.administrativePositions = positions;
  }

  @GraphQLQuery(name = "members")
  public CompletableFuture<List<Person>> loadMembers(@GraphQLRootContext GraphQLContext context) {
    if (members != null) {
      return CompletableFuture.completedFuture(members);
    }
    return engine().getTenantDao().getMembersForTenant(context, uuid).thenApply(o -> {
      members = o;
      return o;
    });
  }

  public List<Person> getMembers() {
    return members;
  }

  @GraphQLInputField(name = "members")
  public void setMembers(List<Person> members) {
    this.members = members;
  }
}
