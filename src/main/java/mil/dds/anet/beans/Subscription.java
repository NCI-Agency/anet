package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Subscription extends AbstractAnetBean {

  // annotated below
  private ForeignObjectHolder<Position> subscriber = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  private String subscribedObjectType;
  @GraphQLQuery
  @GraphQLInputField
  private String subscribedObjectUuid;
  // annotated below
  private SubscribableObject subscribedObject;

  @GraphQLQuery(name = "subscriber")
  public CompletableFuture<Position> loadSubscriber(
      @GraphQLRootContext Map<String, Object> context) {
    if (subscriber.hasForeignObject()) {
      return CompletableFuture.completedFuture(subscriber.getForeignObject());
    }
    return new UuidFetcher<Position>()
        .load(context, IdDataLoaderKey.POSITIONS, subscriber.getForeignUuid()).thenApply(o -> {
          subscriber.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setSubscriberUuid(String subscriberUuid) {
    this.subscriber = new ForeignObjectHolder<>(subscriberUuid);
  }

  @JsonIgnore
  public String getSubscriberUuid() {
    return subscriber.getForeignUuid();
  }

  @GraphQLInputField(name = "subscriber")
  public void setSubscriber(Position subscriber) {
    this.subscriber = new ForeignObjectHolder<>(subscriber);
  }

  public Position getSubscriber() {
    return subscriber.getForeignObject();
  }

  public String getSubscribedObjectType() {
    return subscribedObjectType;
  }

  public void setSubscribedObjectType(String subscribedObjectType) {
    this.subscribedObjectType = subscribedObjectType;
  }

  public String getSubscribedObjectUuid() {
    return subscribedObjectUuid;
  }

  public void setSubscribedObjectUuid(String subscribedObjectUuid) {
    this.subscribedObjectUuid = subscribedObjectUuid;
  }

  @GraphQLQuery(name = "subscribedObject")
  public CompletableFuture<SubscribableObject> loadSubscribedObject(
      @GraphQLRootContext Map<String, Object> context) {
    if (subscribedObject != null) {
      return CompletableFuture.completedFuture(subscribedObject);
    }
    return new UuidFetcher<AbstractAnetBean>()
        .load(context, IdDataLoaderKey.valueOfTableName(subscribedObjectType), subscribedObjectUuid)
        .thenApply(o -> {
          subscribedObject = (SubscribableObject) o;
          return subscribedObject;
        });
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || o.getClass() != this.getClass()) {
      return false;
    }
    final Subscription s = (Subscription) o;
    return Objects.equals(s.getUuid(), uuid)
        && Objects.equals(s.getSubscriberUuid(), getSubscriberUuid())
        && Objects.equals(s.getSubscribedObjectType(), subscribedObjectType)
        && Objects.equals(s.getSubscribedObjectUuid(), subscribedObjectUuid)
        && Objects.equals(s.getCreatedAt(), createdAt)
        && Objects.equals(s.getUpdatedAt(), updatedAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, getSubscriberUuid(), subscribedObjectType, subscribedObjectUuid,
        createdAt, updatedAt);
  }

  @Override
  public String toString() {
    return String.format(
        "[uuid:%s, subscriberUuid:%s, subscribedObjectType:%s, subscribedObjectUuid:%s]", uuid,
        getSubscriberUuid(), subscribedObjectType, subscribedObjectUuid);
  }

}
