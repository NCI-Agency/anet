package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class SubscriptionUpdate extends AbstractAnetBean {

  // annotated below
  private ForeignObjectHolder<Subscription> subscription = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  private String updatedObjectType;
  @GraphQLQuery
  @GraphQLInputField
  private String updatedObjectUuid;
  // annotated below
  private SubscribableObject updatedObject;
  @GraphQLQuery
  @GraphQLInputField
  private boolean isNote;

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new WebApplicationException("no UUID field on SubscriptionUpdate");
  }

  @Override
  public void setUuid(String uuid) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getUpdatedAt() {
    throw new WebApplicationException("no updatedAt field on SubscriptionUpdate");
  }

  @Override
  public void setUpdatedAt(Instant updatedAt) {
    // just ignore
  }

  @GraphQLQuery(name = "subscription")
  public CompletableFuture<Subscription> loadSubscription(
      @GraphQLRootContext Map<String, Object> context) {
    if (subscription.hasForeignObject()) {
      return CompletableFuture.completedFuture(subscription.getForeignObject());
    }
    return new UuidFetcher<Subscription>()
        .load(context, IdDataLoaderKey.SUBSCRIPTIONS, subscription.getForeignUuid())
        .thenApply(o -> {
          subscription.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setSubscriptionUuid(String subscriberUuid) {
    this.subscription = new ForeignObjectHolder<>(subscriberUuid);
  }

  @JsonIgnore
  public String getSubscriptionUuid() {
    return subscription.getForeignUuid();
  }

  public void setSubscription(Subscription subscription) {
    this.subscription = new ForeignObjectHolder<>(subscription);
  }

  public Subscription getSubscription() {
    return subscription.getForeignObject();
  }

  public String getUpdatedObjectType() {
    return updatedObjectType;
  }

  public void setUpdatedObjectType(String updatedObjectType) {
    this.updatedObjectType = updatedObjectType;
  }

  public String getUpdatedObjectUuid() {
    return updatedObjectUuid;
  }

  public void setUpdatedObjectUuid(String updatedObjectUuid) {
    this.updatedObjectUuid = updatedObjectUuid;
  }

  @GraphQLQuery(name = "updatedObject")
  public CompletableFuture<SubscribableObject> loadUpdatedObject(
      @GraphQLRootContext Map<String, Object> context) {
    if (updatedObject != null) {
      return CompletableFuture.completedFuture(updatedObject);
    }
    return new UuidFetcher<AbstractAnetBean>()
        .load(context, IdDataLoaderKey.valueOfTableName(updatedObjectType), updatedObjectUuid)
        .thenApply(o -> {
          updatedObject = (SubscribableObject) o;
          return updatedObject;
        });
  }

  public boolean getIsNote() {
    return isNote;
  }

  public void setIsNote(boolean isNote) {
    this.isNote = isNote;
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || o.getClass() != this.getClass()) {
      return false;
    }
    final SubscriptionUpdate s = (SubscriptionUpdate) o;
    return Objects.equals(s.getUuid(), uuid)
        && Objects.equals(s.getSubscriptionUuid(), getSubscriptionUuid())
        && Objects.equals(s.getUpdatedObjectType(), updatedObjectType)
        && Objects.equals(s.getUpdatedObjectUuid(), updatedObjectUuid)
        && Objects.equals(s.getIsNote(), isNote) && Objects.equals(s.getCreatedAt(), createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(getSubscriptionUuid(), updatedObjectType, updatedObjectUuid, isNote,
        createdAt);
  }

  @Override
  public String toString() {
    return String.format(
        "[subscriptionUuid:%s, updatedObjectType:%s, updatedObjectUuid:%s, isNote:%b]",
        getSubscriptionUuid(), updatedObjectType, updatedObjectUuid, isNote);
  }

}
