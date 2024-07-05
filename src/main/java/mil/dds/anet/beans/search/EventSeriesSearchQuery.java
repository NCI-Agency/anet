package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.List;
import java.util.Objects;

public class EventSeriesSearchQuery extends SubscribableObjectSearchQuery<EventSeriesSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private List<String> hostOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> adminOrgUuid;

  public EventSeriesSearchQuery() {
    super(EventSeriesSearchSortBy.NAME);
  }

  public List<String> getHostOrgUuid() {
    return hostOrgUuid;
  }

  public void setHostOrgUuid(List<String> hostOrgUuid) {
    this.hostOrgUuid = hostOrgUuid;
  }

  public List<String> getAdminOrgUuid() {
    return adminOrgUuid;
  }

  public void setAdminOrgUuid(List<String> adminOrgUuid) {
    this.adminOrgUuid = adminOrgUuid;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), hostOrgUuid, adminOrgUuid);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof EventSeriesSearchQuery other)) {
      return false;
    }
    return super.equals(obj) && Objects.equals(getHostOrgUuid(), other.getHostOrgUuid())
        && Objects.equals(getAdminOrgUuid(), other.getAdminOrgUuid());
  }

  @Override
  public EventSeriesSearchQuery clone() throws CloneNotSupportedException {
    return (EventSeriesSearchQuery) super.clone();
  }
}
