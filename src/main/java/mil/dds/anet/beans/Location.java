package mil.dds.anet.beans;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.M2mBatchParams;
import mil.dds.anet.beans.search.RecursiveM2mBatchParams;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Location extends AbstractCustomizableAnetBean
    implements RelatableObject, SubscribableObject, WithStatus {

  /** Pseudo uuid to represent 'no location'. */
  public static final String DUMMY_LOCATION_UUID = "-1";

  public enum LocationType {
    PHYSICAL_LOCATION("P"), // -
    GEOGRAPHICAL_AREA("PA"), // -
    COUNTRY("PAC"), // -
    MUNICIPALITY("PAM"), // -
    TOWN("PAT"), // -
    POINT_LOCATION("PP"), // -
    VIRTUAL_LOCATION("V");

    private static final Map<String, LocationType> BY_CODE = new HashMap<>();
    static {
      for (final LocationType e : values()) {
        BY_CODE.put(e.code, e);
      }
    }

    public static LocationType valueOfCode(String code) {
      return BY_CODE.get(code);
    }

    private final String code;

    LocationType(String code) {
      this.code = code;
    }

    @Override
    public String toString() {
      return code;
    }
  }

  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private Status status;
  @GraphQLQuery
  @GraphQLInputField
  private Double lat;
  @GraphQLQuery
  @GraphQLInputField
  private Double lng;
  @GraphQLQuery
  @GraphQLInputField
  private String geoJson;
  @GraphQLQuery
  @GraphQLInputField
  private LocationType type;
  @GraphQLQuery
  @GraphQLInputField
  private String digram;
  @GraphQLQuery
  @GraphQLInputField
  private String trigram;
  @GraphQLQuery
  @GraphQLInputField
  private String description;
  // annotated below
  private EntityAvatar entityAvatar;
  /* The following are all Lazy Loaded */
  // annotated below
  List<ApprovalStep> planningApprovalSteps; /* Planning approval process for this Task */
  // annotated below
  List<ApprovalStep> approvalSteps; /* Approval process for this Task */
  // annotated below
  List<Location> parentLocations;

  @Override
  @AllowUnverifiedUsers
  public String getUuid() {
    return super.getUuid();
  }

  @AllowUnverifiedUsers
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  public Double getLat() {
    return lat;
  }

  public void setLat(Double lat) {
    this.lat = lat;
  }

  public Double getLng() {
    return lng;
  }

  public void setLng(Double lng) {
    this.lng = lng;
  }

  public String getGeoJson() {
    return geoJson;
  }

  public void setGeoJson(String geoJson) {
    this.geoJson = geoJson;
  }

  @AllowUnverifiedUsers
  public LocationType getType() {
    return type;
  }

  public void setType(LocationType type) {
    this.type = type;
  }

  @AllowUnverifiedUsers
  public String getDigram() {
    return digram;
  }

  public void setDigram(String digram) {
    this.digram = digram;
  }

  @AllowUnverifiedUsers
  public String getTrigram() {
    return trigram;
  }

  public void setTrigram(String trigram) {
    this.trigram = trigram;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  @GraphQLQuery(name = "planningApprovalSteps")
  public CompletableFuture<List<ApprovalStep>> loadPlanningApprovalSteps(
      @GraphQLRootContext GraphQLContext context) {
    if (planningApprovalSteps != null) {
      return CompletableFuture.completedFuture(planningApprovalSteps);
    }
    return engine().getApprovalStepDao().getPlanningApprovalStepsForRelatedObject(context, uuid)
        .thenApply(o -> {
          planningApprovalSteps = o;
          return o;
        });
  }

  public List<ApprovalStep> getPlanningApprovalSteps() {
    return planningApprovalSteps;
  }

  @GraphQLInputField(name = "planningApprovalSteps")
  public void setPlanningApprovalSteps(List<ApprovalStep> steps) {
    this.planningApprovalSteps = steps;
  }

  @GraphQLQuery(name = "approvalSteps")
  public CompletableFuture<List<ApprovalStep>> loadApprovalSteps(
      @GraphQLRootContext GraphQLContext context) {
    if (approvalSteps != null) {
      return CompletableFuture.completedFuture(approvalSteps);
    }
    return engine().getApprovalStepDao().getApprovalStepsForRelatedObject(context, uuid)
        .thenApply(o -> {
          approvalSteps = o;
          return o;
        });
  }

  public List<ApprovalStep> getApprovalSteps() {
    return approvalSteps;
  }

  @GraphQLInputField(name = "approvalSteps")
  public void setApprovalSteps(List<ApprovalStep> steps) {
    this.approvalSteps = steps;
  }

  @GraphQLQuery(name = "childrenLocations")
  public CompletableFuture<List<Location>> loadChildrenLocations(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") LocationSearchQuery query) {
    if (query == null) {
      query = new LocationSearchQuery();
    }
    // Note: no recursion, only direct children!
    query.setBatchParams(new M2mBatchParams<>("locations", "uuid", "\"locationRelationships\"",
        "\"childLocationUuid\"", "\"parentLocationUuid\""));
    return engine().getLocationDao().getLocationsBySearch(context, uuid, query);
  }

  @GraphQLQuery(name = "parentLocations")
  public CompletableFuture<List<Location>> loadParentLocations(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") LocationSearchQuery query) {
    if (parentLocations != null) {
      return CompletableFuture.completedFuture(parentLocations);
    }
    if (query == null) {
      query = new LocationSearchQuery();
    }
    // Note: no recursion, only direct parents!
    query.setBatchParams(new M2mBatchParams<>("locations", "uuid", "\"locationRelationships\"",
        "\"parentLocationUuid\"", "\"childLocationUuid\""));
    return engine().getLocationDao().getLocationsBySearch(context, uuid, query).thenApply(o -> {
      parentLocations = o;
      return o;
    });
  }

  public List<Location> getParentLocations() {
    return parentLocations;
  }

  @GraphQLInputField(name = "parentLocations")
  public void setParentLocations(List<Location> parentLocations) {
    this.parentLocations = parentLocations;
  }

  @GraphQLQuery(name = "descendantLocations")
  public CompletableFuture<List<Location>> loadDescendantLocations(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") LocationSearchQuery query) {
    if (query == null) {
      query = new LocationSearchQuery();
    }
    // Note: recursion, includes transitive children!
    query.setBatchParams(
        new RecursiveM2mBatchParams<>("locations", "uuid", "\"locationRelationships\"",
            "\"childLocationUuid\"", "\"parentLocationUuid\"", "\"locationRelationships\"",
            "\"parentLocationUuid\"", ISearchQuery.RecurseStrategy.CHILDREN));
    return engine().getLocationDao().getLocationsBySearch(context, uuid, query);
  }

  @GraphQLQuery(name = "ascendantLocations")
  public CompletableFuture<List<Location>> loadAscendantLocations(
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") LocationSearchQuery query) {
    if (parentLocations != null) {
      return CompletableFuture.completedFuture(parentLocations);
    }
    if (query == null) {
      query = new LocationSearchQuery();
    }
    // Note: recursion, includes transitive parents!
    query.setBatchParams(
        new RecursiveM2mBatchParams<>("locations", "uuid", "\"locationRelationships\"",
            "\"childLocationUuid\"", "\"parentLocationUuid\"", "\"locationRelationships\"",
            "\"parentLocationUuid\"", ISearchQuery.RecurseStrategy.PARENTS));
    return engine().getLocationDao().getLocationsBySearch(context, uuid, query);
  }

  @GraphQLQuery(name = "entityAvatar")
  public CompletableFuture<EntityAvatar> loadEntityAvatar(
      @GraphQLRootContext GraphQLContext context) {
    if (entityAvatar != null) {
      return CompletableFuture.completedFuture(entityAvatar);
    }
    return new UuidFetcher<EntityAvatar>().load(context, IdDataLoaderKey.ENTITY_AVATARS, uuid)
        .thenApply(o -> {
          entityAvatar = o;
          return o;
        });
  }

  @GraphQLInputField(name = "entityAvatar")
  public void setEntityAvatar(EntityAvatar entityAvatar) {
    this.entityAvatar = entityAvatar;
  }

  public EntityAvatar getEntityAvatar() {
    return this.entityAvatar;
  }

  @Override
  public String customFieldsKey() {
    return "fields.location.customFields";
  }

  @Override
  public String customSensitiveInformationKey() {
    return "fields.location.customSensitiveInformation";
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Location other)) {
      return false;
    }
    return super.equals(o) && Objects.equals(other.getUuid(), uuid)
        && Objects.equals(other.getName(), name) && Objects.equals(other.getStatus(), status)
        && Objects.equals(other.getLat(), lat) && Objects.equals(other.getLng(), lng)
        && Objects.equals(other.getType(), type) && Objects.equals(other.digram, digram)
        && Objects.equals(other.trigram, trigram) && Objects.equals(other.getCreatedAt(), createdAt)
        && Objects.equals(other.getDescription(), description);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), uuid, name, type, status, lat, lng, digram, trigram,
        createdAt, description);
  }

  @Override
  public String toString() {
    return String.format("(%s) - %s [%f, %f]", uuid, name, lat, lng);
  }

  @Override
  public String getObjectLabel() {
    return getName();
  }

}
