package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class EventSeries extends AbstractCustomizableAnetBean
    implements RelatableObject, SubscribableObject, WithStatus {
  @GraphQLQuery
  @GraphQLInputField
  private Status status;
  @GraphQLQuery
  @GraphQLInputField
  String name;
  @GraphQLQuery
  @GraphQLInputField
  String description;
  // Lazy Loaded
  // annotated below
  private ForeignObjectHolder<Organization> hostOrg = new ForeignObjectHolder<>();
  // Lazy Loaded
  // annotated below
  private ForeignObjectHolder<Organization> adminOrg = new ForeignObjectHolder<>();

  @GraphQLQuery(name = "hostOrg")
  public CompletableFuture<Organization> loadHostOrg(@GraphQLRootContext GraphQLContext context) {
    if (hostOrg.hasForeignObject()) {
      return CompletableFuture.completedFuture(hostOrg.getForeignObject());
    }
    return new UuidFetcher<Organization>()
        .load(context, IdDataLoaderKey.ORGANIZATIONS, hostOrg.getForeignUuid()).thenApply(o -> {
          hostOrg.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setHostOrgUuid(String hostOrgUuid) {
    this.hostOrg = new ForeignObjectHolder<>(hostOrgUuid);
  }

  @JsonIgnore
  public String getHostOrgUuid() {
    return hostOrg.getForeignUuid();
  }

  @GraphQLInputField(name = "hostOrg")
  public void setHostOrg(Organization hostOrg) {
    this.hostOrg = new ForeignObjectHolder<>(hostOrg);
  }

  public Organization getHostOrg() {
    return hostOrg.getForeignObject();
  }

  @GraphQLQuery(name = "adminOrg")
  public CompletableFuture<Organization> loadAdminOrg(@GraphQLRootContext GraphQLContext context) {
    if (adminOrg.hasForeignObject()) {
      return CompletableFuture.completedFuture(adminOrg.getForeignObject());
    }
    return new UuidFetcher<Organization>()
        .load(context, IdDataLoaderKey.ORGANIZATIONS, adminOrg.getForeignUuid()).thenApply(o -> {
          adminOrg.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setAdminOrgUuid(String adminOrgUuid) {
    this.adminOrg = new ForeignObjectHolder<>(adminOrgUuid);
  }

  @JsonIgnore
  public String getAdminOrgUuid() {
    return adminOrg.getForeignUuid();
  }

  @GraphQLInputField(name = "adminOrg")
  public void setAdminOrg(Organization adminOrg) {
    this.adminOrg = new ForeignObjectHolder<>(adminOrg);
  }

  public Organization getAdminOrg() {
    return adminOrg.getForeignObject();
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    if (!super.equals(o))
      return false;
    EventSeries that = (EventSeries) o;
    return status == that.status && Objects.equals(name, that.name)
        && Objects.equals(description, that.description) && Objects.equals(hostOrg, that.hostOrg)
        && Objects.equals(adminOrg, that.adminOrg);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), status, name, description, hostOrg, adminOrg);
  }
}