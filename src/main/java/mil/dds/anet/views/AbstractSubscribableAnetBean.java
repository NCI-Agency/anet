package mil.dds.anet.views;

import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.AnetObjectEngine;

public abstract class AbstractSubscribableAnetBean extends AbstractAnetBean {

  // annotated below
  private Boolean isSubscribed;

  @GraphQLQuery(name = "isSubscribed")
  public synchronized Boolean isSubscribed(@GraphQLRootContext Map<String, Object> context) {
    if (isSubscribed == null) {
      isSubscribed =
          AnetObjectEngine.getInstance().getSubscriptionDao().isSubscribedObject(context, uuid);
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
