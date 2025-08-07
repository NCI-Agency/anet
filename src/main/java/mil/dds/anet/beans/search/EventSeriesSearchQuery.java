package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class EventSeriesSearchQuery extends SubscribableObjectSearchQuery<EventSeriesSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private List<String> ownerOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> hostOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> adminOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> anyOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> eventTaskUuid;

  public EventSeriesSearchQuery() {
    super(EventSeriesSearchSortBy.NAME);
  }

  public List<String> getOwnerOrgUuid() {
    return ownerOrgUuid;
  }

  public void setOwnerOrgUuid(List<String> ownerOrgUuid) {
    this.ownerOrgUuid = ownerOrgUuid;
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

  public List<String> getAnyOrgUuid() {
    return anyOrgUuid;
  }

  public void setAnyOrgUuid(List<String> anyOrgUuid) {
    this.anyOrgUuid = anyOrgUuid;
  }

  public List<String> getEventTaskUuid() {
    return eventTaskUuid;
  }

  public void setEventTaskUuid(List<String> eventTaskUuid) {
    this.eventTaskUuid = eventTaskUuid;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), ownerOrgUuid, hostOrgUuid, adminOrgUuid, anyOrgUuid,
        eventTaskUuid);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof EventSeriesSearchQuery other)) {
      return false;
    }
    return super.equals(obj) && Objects.equals(getOwnerOrgUuid(), other.getOwnerOrgUuid())
        && Objects.equals(getHostOrgUuid(), other.getHostOrgUuid())
        && Objects.equals(getAdminOrgUuid(), other.getAdminOrgUuid())
        && Objects.equals(getAnyOrgUuid(), other.getAnyOrgUuid())
        && Objects.equals(getEventTaskUuid(), other.getEventTaskUuid());
  }

  @Override
  public EventSeriesSearchQuery clone() throws CloneNotSupportedException {
    final EventSeriesSearchQuery clone = (EventSeriesSearchQuery) super.clone();
    if (ownerOrgUuid != null) {
      clone.setOwnerOrgUuid(new ArrayList<>(ownerOrgUuid));
    }
    if (hostOrgUuid != null) {
      clone.setHostOrgUuid(new ArrayList<>(hostOrgUuid));
    }
    if (adminOrgUuid != null) {
      clone.setAdminOrgUuid(new ArrayList<>(adminOrgUuid));
    }
    if (anyOrgUuid != null) {
      clone.setAnyOrgUuid(new ArrayList<>(anyOrgUuid));
    }
    if (eventTaskUuid != null) {
      clone.setEventTaskUuid(new ArrayList<>(eventTaskUuid));
    }
    return clone;
  }
}
