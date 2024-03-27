package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;

public abstract class SubscribableObjectSearchQuery<T extends ISortBy>
    extends AbstractSearchQuery<T> {

  @GraphQLQuery
  @GraphQLInputField
  private Boolean subscribed;

  @GraphQLQuery
  @GraphQLInputField
  private String emailNetwork;

  public SubscribableObjectSearchQuery(T defaultSortBy) {
    super(defaultSortBy);
  }

  public boolean getSubscribed() {
    return Boolean.TRUE.equals(subscribed);
  }

  public void setSubscribed(Boolean subscribed) {
    this.subscribed = subscribed;
  }

  public String getEmailNetwork() {
    return emailNetwork;
  }

  public void setEmailNetwork(String emailNetwork) {
    this.emailNetwork = emailNetwork;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), subscribed, emailNetwork);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof SubscribableObjectSearchQuery)) {
      return false;
    }
    @SuppressWarnings("unchecked")
    final SubscribableObjectSearchQuery<T> other = (SubscribableObjectSearchQuery<T>) obj;
    return super.equals(obj) && Objects.equals(getSubscribed(), other.getSubscribed())
        && Objects.equals(getEmailNetwork(), other.getEmailNetwork());
  }

  @Override
  public SubscribableObjectSearchQuery<T> clone() throws CloneNotSupportedException {
    return (SubscribableObjectSearchQuery<T>) super.clone();
  }

}
