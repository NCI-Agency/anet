package mil.dds.anet.views;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Objects;

public abstract class AbstractSubscribableAnetBean extends AbstractAnetBean {

  // annotated below
  private Boolean isSubscribed;

  @GraphQLQuery(name = "isSubscribed")
  public synchronized Boolean isSubscribed(@GraphQLRootContext GraphQLContext context) {
    if (isSubscribed == null) {
      isSubscribed = engine().getSubscriptionDao().isSubscribedObject(context, uuid);
    }
    return isSubscribed;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof AbstractSubscribableAnetBean)) {
      return false;
    }
    final AbstractSubscribableAnetBean other = (AbstractSubscribableAnetBean) o;
    return Objects.equals(isSubscribed, other.isSubscribed);
  }

  @Override
  public int hashCode() {
    return Objects.hash(isSubscribed);
  }

}
