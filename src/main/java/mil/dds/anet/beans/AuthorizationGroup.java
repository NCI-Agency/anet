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
import mil.dds.anet.views.AbstractAnetBean;

public class AuthorizationGroup extends AbstractAnetBean {

  public static enum AuthorizationGroupStatus {
    ACTIVE, INACTIVE
  }

  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private String description;
  // annotated below
  private List<Position> positions;
  @GraphQLQuery
  @GraphQLInputField
  private AuthorizationGroupStatus status;

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

  @GraphQLQuery(name = "positions")
  public CompletableFuture<List<Position>> loadPositions(
      @GraphQLRootContext Map<String, Object> context) {
    if (positions != null) {
      return CompletableFuture.completedFuture(positions);
    }
    return AnetObjectEngine.getInstance().getAuthorizationGroupDao()
        .getPositionsForAuthorizationGroup(context, uuid).thenApply(o -> {
          positions = o;
          return o;
        });
  }

  public List<Position> getPositions() {
    return positions;
  }

  @GraphQLInputField(name = "positions")
  public void setPositions(List<Position> positions) {
    this.positions = positions;
  }

  public AuthorizationGroupStatus getStatus() {
    return status;
  }

  public void setStatus(AuthorizationGroupStatus status) {
    this.status = status;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof AuthorizationGroup)) {
      return false;
    }
    AuthorizationGroup a = (AuthorizationGroup) o;
    return Objects.equals(a.getUuid(), uuid) && Objects.equals(a.getName(), name)
        && Objects.equals(a.getDescription(), description)
        && Objects.equals(a.getPositions(), positions) && Objects.equals(a.getStatus(), status);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, name, description, positions, status);
  }

  @Override
  public String toString() {
    return String.format("(%s) - %s", uuid, name);
  }

}
