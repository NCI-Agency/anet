package mil.dds.anet.beans;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class EventSeries extends AbstractCommonEvent
    implements RelatableObject, SubscribableObject {
  // annotated below
  private List<GenericRelatedObject> hostRelatedObjects;

  @GraphQLQuery(name = "hostRelatedObjects")
  public CompletableFuture<List<GenericRelatedObject>> loadHostRelatedObjects(
      @GraphQLRootContext GraphQLContext context) {
    if (hostRelatedObjects != null) {
      return CompletableFuture.completedFuture(hostRelatedObjects);
    }
    return engine().getEventSeriesDao().getRelatedObjects(context, this).thenApply(o -> {
      hostRelatedObjects = o;
      return o;
    });
  }

  @GraphQLInputField(name = "hostRelatedObjects")
  public void setHostRelatedObjects(List<GenericRelatedObject> relatedObjects) {
    this.hostRelatedObjects = relatedObjects;
  }

  public List<GenericRelatedObject> getHostRelatedObjects() {
    return hostRelatedObjects;
  }

  @Override
  public String getObjectLabel() {
    return getName();
  }
}
