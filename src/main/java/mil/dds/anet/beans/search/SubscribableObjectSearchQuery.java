package mil.dds.anet.beans.search;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;
import mil.dds.anet.beans.Person;

public abstract class SubscribableObjectSearchQuery<T extends ISortBy>
    extends AbstractSearchQuery<T> {

  @GraphQLQuery
  @GraphQLInputField
  private Boolean subscribed;
  // internal search parameter:
  private Person user;

  public SubscribableObjectSearchQuery(T defaultSortBy) {
    super(defaultSortBy);
  }

  public boolean getSubscribed() {
    return Boolean.TRUE.equals(subscribed);
  }

  public void setSubscribed(Boolean subscribed) {
    this.subscribed = subscribed;
  }

  @JsonIgnore
  public Person getUser() {
    return user;
  }

  @JsonIgnore
  public void setUser(Person user) {
    this.user = user;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), subscribed, user);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof SubscribableObjectSearchQuery)) {
      return false;
    }
    @SuppressWarnings("unchecked")
    final SubscribableObjectSearchQuery<T> other = (SubscribableObjectSearchQuery<T>) obj;
    return super.equals(obj) && Objects.equals(getSubscribed(), other.getSubscribed())
        && Objects.equals(getUser(), other.getUser());
  }

  @Override
  public Object clone() throws CloneNotSupportedException {
    @SuppressWarnings("unchecked")
    final SubscribableObjectSearchQuery<T> clone = (SubscribableObjectSearchQuery<T>) super.clone();
    return clone;
  }

}
