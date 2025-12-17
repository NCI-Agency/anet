package mil.dds.anet.beans;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class AuditTrail extends GenericRelatedObject {

  public enum AuditTrailUpdateType {
    CREATE, UPDATE, DELETE
  }

  @GraphQLQuery
  @GraphQLInputField
  private String uuid;
  @GraphQLQuery
  @GraphQLInputField
  private AuditTrailUpdateType updateType;
  @GraphQLQuery
  @GraphQLInputField
  private String updateDescription;
  @GraphQLQuery
  @GraphQLInputField
  private String updateDetails;
  @GraphQLQuery
  @GraphQLInputField
  protected Instant createdAt;
  // see below
  private Person person;

  public AuditTrail() {
    super();
  }

  private AuditTrail(Instant createdAt, AuditTrailUpdateType updateType, String updateDescription,
      String updateDetails, String personUuid, String relatedObjectType, String relatedObjectUuid) {
    this();
    this.setCreatedAt(createdAt);
    this.setUpdateType(updateType);
    this.setUpdateDescription(updateDescription);
    this.setUpdateDetails(updateDetails);
    this.setObjectUuid(personUuid);
    this.setRelatedObjectType(relatedObjectType);
    this.setRelatedObjectUuid(relatedObjectUuid);
  }

  public static AuditTrail getInstance(Instant timestamp, AuditTrailUpdateType updateType,
      String updateDescription, String updateDetails, Person p, String relatedObjectType,
      AbstractAnetBean o) {
    return new AuditTrail(timestamp, updateType, updateDescription, updateDetails,
        DaoUtils.getUuid(p), relatedObjectType, DaoUtils.getUuid(o));
  }

  public static AuditTrail getCreateInstance(Person p, String relatedObjectType,
      AbstractAnetBean o) {
    return getCreateInstance(p, relatedObjectType, o, null);
  }

  public static AuditTrail getCreateInstance(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription) {
    return getCreateInstance(p, relatedObjectType, o, updateDescription, null);
  }

  public static AuditTrail getCreateInstance(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription, String updateDetails) {
    return getInstance(o.getCreatedAt(), AuditTrailUpdateType.CREATE, updateDescription,
        updateDetails, p, relatedObjectType, o);
  }

  public static AuditTrail getUpdateInstance(Person p, Instant timestamp,
      String updateDescription) {
    return getUpdateInstance(p, timestamp, null, null, updateDescription, null);
  }

  public static AuditTrail getUpdateInstance(Person p, String relatedObjectType,
      AbstractAnetBean o) {
    return getUpdateInstance(p, relatedObjectType, o, null);
  }

  public static AuditTrail getUpdateInstance(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription) {
    return getUpdateInstance(p, relatedObjectType, o, updateDescription, null);
  }

  public static AuditTrail getUpdateInstance(Person p, Instant timestamp, String relatedObjectType,
      AbstractAnetBean o, String updateDescription) {
    return getUpdateInstance(p, timestamp, relatedObjectType, o, updateDescription, null);
  }

  public static AuditTrail getUpdateInstance(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription, String updateDetails) {
    return getUpdateInstance(p, o.getUpdatedAt(), relatedObjectType, o, updateDescription,
        updateDetails);
  }

  public static AuditTrail getUpdateInstance(Person p, Instant timestamp, String relatedObjectType,
      AbstractAnetBean o, String updateDescription, String updateDetails) {
    return getInstance(timestamp, AuditTrailUpdateType.UPDATE, updateDescription, updateDetails, p,
        relatedObjectType, o);
  }

  public static AuditTrail getDeleteInstance(Person p, String relatedObjectType,
      AbstractAnetBean o) {
    return getDeleteInstance(p, relatedObjectType, o, null);
  }

  public static AuditTrail getDeleteInstance(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription) {
    return getDeleteInstance(p, relatedObjectType, o, updateDescription, null);
  }

  public static AuditTrail getDeleteInstance(Person p, String relatedObjectType, AbstractAnetBean o,
      String updateDescription, String updateDetails) {
    return getInstance(Instant.now(), AuditTrailUpdateType.DELETE, updateDescription, updateDetails,
        p, relatedObjectType, o);
  }

  @Override
  public String getUuid() {
    return uuid;
  }

  @Override
  public void setUuid(String uuid) {
    this.uuid = uuid;
  }

  public AuditTrailUpdateType getUpdateType() {
    return updateType;
  }

  public void setUpdateType(AuditTrailUpdateType updateType) {
    this.updateType = updateType;
  }

  public String getUpdateDescription() {
    return updateDescription;
  }

  public void setUpdateDescription(String updateDescription) {
    this.updateDescription = updateDescription;
  }

  public String getUpdateDetails() {
    return updateDetails;
  }

  public void setUpdateDetails(String updateDetails) {
    this.updateDetails = updateDetails;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  @GraphQLQuery(name = "person")
  public CompletableFuture<Person> loadPerson(@GraphQLRootContext GraphQLContext context) {
    if (person != null) {
      return CompletableFuture.completedFuture(person);
    }
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, getObjectUuid())
        .thenApply(o -> {
          person = o;
          return o;
        });
  }

}
