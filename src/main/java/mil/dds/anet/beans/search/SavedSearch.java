package mil.dds.anet.beans.search;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.google.common.base.Objects;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.ForeignObjectHolder;
import mil.dds.anet.beans.Person;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class SavedSearch extends AbstractAnetBean {

  public enum SearchObjectType {
    REPORTS, PEOPLE, TASKS, POSITIONS, ORGANIZATIONS, LOCATIONS
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

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  @GraphQLQuery(name = "owner")
  public CompletableFuture<Person> loadOwner(@GraphQLRootContext Map<String, Object> context) {
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
    return Objects.equal(getUuid(), other.getUuid()) && Objects.equal(name, other.getName())
        && Objects.equal(getOwnerUuid(), other.getOwnerUuid())
        && Objects.equal(objectType, other.getObjectType())
        && Objects.equal(query, other.getQuery());
  }

  @Override
  public String toString() {
    return String.format("SavedSearch[uuid:%s, name:%s, query:%s, owner:%s]", getUuid(), name,
        query, getOwnerUuid());
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(uuid, name, owner, objectType, query);
  }
}
