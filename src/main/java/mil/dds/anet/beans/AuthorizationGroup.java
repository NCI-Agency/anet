package mil.dds.anet.beans;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractSubscribableAnetBean;

public class AuthorizationGroup extends AbstractSubscribableAnetBean
    implements RelatableObject, SubscribableObject, WithStatus {

  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private String description;
  // annotated below
  private List<GenericRelatedObject> authorizationGroupRelatedObjects;
  // annotated below
  private List<Position> administrativePositions;
  @GraphQLQuery
  @GraphQLInputField
  private Status status;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean distributionList = false;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean forSensitiveInformation = false;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = Utils.trimStringReturnNull(description);
  }

  @GraphQLQuery(name = "authorizationGroupRelatedObjects")
  public CompletableFuture<List<GenericRelatedObject>> loadAuthorizationGroupRelatedObjects(
      @GraphQLRootContext GraphQLContext context) {
    if (authorizationGroupRelatedObjects != null) {
      return CompletableFuture.completedFuture(authorizationGroupRelatedObjects);
    }
    return engine().getAuthorizationGroupDao().getRelatedObjects(context, this).thenApply(o -> {
      authorizationGroupRelatedObjects = o;
      return o;
    });
  }

  @GraphQLInputField(name = "authorizationGroupRelatedObjects")
  public void setAuthorizationGroupRelatedObjects(List<GenericRelatedObject> relatedObjects) {
    this.authorizationGroupRelatedObjects = relatedObjects;
  }

  public List<GenericRelatedObject> getAuthorizationGroupRelatedObjects() {
    return authorizationGroupRelatedObjects;
  }

  @GraphQLQuery(name = "administrativePositions")
  public CompletableFuture<List<Position>> loadAdministrativePositions(
      @GraphQLRootContext GraphQLContext context) {
    if (administrativePositions != null) {
      return CompletableFuture.completedFuture(administrativePositions);
    }
    return engine().getAuthorizationGroupDao()
        .getAdministrativePositionsForAuthorizationGroup(context, uuid).thenApply(o -> {
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

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  public Boolean getDistributionList() {
    return distributionList;
  }

  public void setDistributionList(Boolean distributionList) {
    this.distributionList = distributionList;
  }

  public Boolean getForSensitiveInformation() {
    return forSensitiveInformation;
  }

  public void setForSensitiveInformation(Boolean forSensitiveInformation) {
    this.forSensitiveInformation = forSensitiveInformation;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof AuthorizationGroup a)) {
      return false;
    }
    return Objects.equals(a.getUuid(), uuid) && Objects.equals(a.getName(), name)
        && Objects.equals(a.getDescription(), description)
        && Objects.equals(a.getAuthorizationGroupRelatedObjects(), authorizationGroupRelatedObjects)
        && Objects.equals(a.getStatus(), status)
        && Objects.equals(a.getDistributionList(), distributionList)
        && Objects.equals(a.getForSensitiveInformation(), forSensitiveInformation);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, name, description, authorizationGroupRelatedObjects, status,
        distributionList, forSensitiveInformation);
  }

  @Override
  public String toString() {
    return String.format("(%s) - %s", uuid, name);
  }
}
