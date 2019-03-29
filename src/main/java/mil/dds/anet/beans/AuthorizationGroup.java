package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class AuthorizationGroup extends AbstractAnetBean {

  public static enum AuthorizationGroupStatus {
    ACTIVE, INACTIVE
  }

  private String name;
  private String description;
  private List<Position> positions;
  private AuthorizationGroupStatus status;

  @GraphQLQuery(name = "name")
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  @GraphQLQuery(name = "description")
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

  @GraphQLIgnore
  public List<Position> getPositions() {
    return positions;
  }

  public void setPositions(List<Position> positions) {
    this.positions = positions;
  }

  @GraphQLQuery(name = "status")
  public AuthorizationGroupStatus getStatus() {
    return status;
  }

  public void setStatus(AuthorizationGroupStatus status) {
    this.status = status;
  }

  @GraphQLQuery(name = "reports") // TODO: batch load? (appears to be unused)
  public AnetBeanList<Report> fetchReports(@GraphQLArgument(name = "pageNum") int pageNum,
      @GraphQLArgument(name = "pageSize") int pageSize) {
    ReportSearchQuery query = new ReportSearchQuery();
    query.setPageNum(pageNum);
    query.setPageSize(pageSize);
    query.setAuthorizationGroupUuid(Arrays.asList(uuid));
    return AnetObjectEngine.getInstance().getReportDao().search(query);
  }

  @GraphQLQuery(name = "paginatedPositions") // TODO: batch load? (appears to be unused)
  public AnetBeanList<Position> fetchPositions(@GraphQLArgument(name = "pageNum") int pageNum,
      @GraphQLArgument(name = "pageSize") int pageSize) {
    PositionSearchQuery query = new PositionSearchQuery();
    query.setPageNum(pageNum);
    query.setPageSize(pageSize);
    query.setAuthorizationGroupUuid(uuid);
    return AnetObjectEngine.getInstance().getPositionDao().search(query);
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || o.getClass() != this.getClass()) {
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
