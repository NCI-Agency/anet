package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.google.common.base.Objects;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class SavedSearch extends AbstractAnetBean implements RelatableObject {

  public enum SearchObjectType {
    REPORTS, PEOPLE, TASKS, POSITIONS, ORGANIZATIONS, LOCATIONS, AUTHORIZATION_GROUPS, ATTACHMENTS,
    EVENTS
  }

  @GraphQLQuery
  @GraphQLInputField
  String name;
  // annotated below
  private ForeignObjectHolder<Person> owner = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  SearchObjectType objectType;
  @GraphQLQuery
  @GraphQLInputField
  String query;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean displayInHomepage = false;
  @GraphQLQuery
  @GraphQLInputField
  private Double priority;
  @GraphQLQuery
  @GraphQLInputField
  private Double homepagePriority;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Boolean getDisplayInHomepage() {
    return displayInHomepage;
  }

  public void setDisplayInHomepage(Boolean displayInHomepage) {
    this.displayInHomepage = displayInHomepage;
  }

  public Double getPriority() {
    return priority;
  }

  public void setPriority(Double priority) {
    this.priority = priority;
  }

  public Double getHomepagePriority() {
    return homepagePriority;
  }

  public void setHomepagePriority(Double homepagePriority) {
    this.homepagePriority = homepagePriority;
  }

  @GraphQLQuery(name = "owner")
  public CompletableFuture<Person> loadOwner(@GraphQLRootContext GraphQLContext context) {
    if (owner.hasForeignObject()) {
      return CompletableFuture.completedFuture(owner.getForeignObject());
    }
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, owner.getForeignUuid())
        .thenApply(o -> {
          owner.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setOwnerUuid(String ownerUuid) {
    this.owner = new ForeignObjectHolder<>(ownerUuid);
  }

  @JsonIgnore
  public String getOwnerUuid() {
    return owner.getForeignUuid();
  }

  public Person getOwner() {
    return owner.getForeignObject();
  }

  @GraphQLInputField(name = "owner")
  public void setOwner(Person owner) {
    this.owner = new ForeignObjectHolder<>(owner);
  }

  public SearchObjectType getObjectType() {
    return objectType;
  }

  public void setObjectType(SearchObjectType objectType) {
    this.objectType = objectType;
  }

  public String getQuery() {
    return query;
  }

  public void setQuery(String query) {
    this.query = query;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof SavedSearch)) {
      return false;
    }
    SavedSearch other = (SavedSearch) o;
    return super.equals(o) && Objects.equal(getUuid(), other.getUuid())
        && Objects.equal(name, other.getName())
        && Objects.equal(getOwnerUuid(), other.getOwnerUuid())
        && Objects.equal(objectType, other.getObjectType())
        && Objects.equal(query, other.getQuery())
        && Objects.equal(displayInHomepage, other.getDisplayInHomepage())
        && Objects.equal(priority, other.getPriority());
  }

  @Override
  public String toString() {
    return String.format("SavedSearch[uuid:%s, name:%s, query:%s, owner:%s]", getUuid(), name,
        query, getOwnerUuid());
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(super.hashCode(), uuid, name, owner, objectType, query,
        displayInHomepage, priority, homepagePriority);
  }
}
