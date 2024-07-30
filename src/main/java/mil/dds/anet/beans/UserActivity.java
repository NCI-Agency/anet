package mil.dds.anet.beans;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.UuidFetcher;

public class UserActivity {

  public enum AggregationPeriod {
    DAY, WEEK, MONTH
  }

  private String organizationUuid;
  private String personUuid;
  private Instant visitedAt;
  private long count;

  public UserActivity() {}

  public UserActivity(final String personUuid, final String organizationUuid,
      final Instant visitedAt) {
    this.personUuid = personUuid;
    this.organizationUuid = organizationUuid;
    this.visitedAt = visitedAt;
  }

  @GraphQLQuery
  public String getOrganizationUuid() {
    return organizationUuid;
  }

  @GraphQLQuery(name = "organization")
  public CompletableFuture<Organization> getOrganization(
      @GraphQLRootContext GraphQLContext context) {
    return new UuidFetcher<Organization>().load(context, IdDataLoaderKey.ORGANIZATIONS,
        getOrganizationUuid());
  }

  public void setOrganizationUuid(final String organizationUuid) {
    this.organizationUuid = organizationUuid;
  }

  @GraphQLQuery
  public String getPersonUuid() {
    return personUuid;
  }

  @GraphQLQuery(name = "person")
  public CompletableFuture<Person> getPerson(@GraphQLRootContext GraphQLContext context) {
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, getPersonUuid());
  }

  public void setPersonUuid(final String personUuid) {
    this.personUuid = personUuid;
  }

  @GraphQLQuery
  public Instant getVisitedAt() {
    return visitedAt;
  }

  public void setVisitedAt(final Instant visitedAt) {
    this.visitedAt = visitedAt;
  }

  @GraphQLQuery
  public long getCount() {
    return count;
  }

  public void setCount(final long count) {
    this.count = count;
  }
}
