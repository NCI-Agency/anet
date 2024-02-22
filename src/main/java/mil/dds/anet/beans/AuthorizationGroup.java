package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
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
      @GraphQLRootContext Map<String, Object> context) {
    if (authorizationGroupRelatedObjects != null) {
      return CompletableFuture.completedFuture(authorizationGroupRelatedObjects);
    }
    return AnetObjectEngine.getInstance().getAuthorizationGroupDao()
        .getRelatedObjects(context, this).thenApply(o -> {
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
      @GraphQLRootContext Map<String, Object> context) {
    if (administrativePositions != null) {
      return CompletableFuture.completedFuture(administrativePositions);
    }
    return AnetObjectEngine.getInstance().getAuthorizationGroupDao()
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

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof AuthorizationGroup a)) {
      return false;
    }
    return Objects.equals(a.getUuid(), uuid) && Objects.equals(a.getName(), name)
        && Objects.equals(a.getDescription(), description)
        && Objects.equals(a.getAuthorizationGroupRelatedObjects(), authorizationGroupRelatedObjects)
        && Objects.equals(a.getStatus(), status);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, name, description, authorizationGroupRelatedObjects, status);
  }

  @Override
  public String toString() {
    return String.format("(%s) - %s", uuid, name);
  }

}
