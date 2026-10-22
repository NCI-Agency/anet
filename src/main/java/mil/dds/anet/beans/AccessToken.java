package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class AccessToken extends AbstractAnetBean implements RelatableObject {

  public static final int ACCESS_TOKEN_LENGTH = 32;

  private static final Base64.Encoder BASE64_ENCODER = Base64.getEncoder();

  public enum TokenScope {
    NVG, GRAPHQL, MART
  }

  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private String pointOfContact;
  @GraphQLQuery
  @GraphQLInputField
  private String description;
  @GraphQLQuery
  @GraphQLInputField
  private String tokenHash;
  @GraphQLQuery
  @GraphQLInputField
  private Instant expiresAt;
  @GraphQLQuery
  @GraphQLInputField
  private TokenScope scope;
  // annotated below
  private ForeignObjectHolder<Tenant> tenant = new ForeignObjectHolder<>();
  // annotated below
  private List<AccessTokenActivity> accessTokenActivities;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getPointOfContact() {
    return pointOfContact;
  }

  public void setPointOfContact(String pointOfContact) {
    this.pointOfContact = pointOfContact;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getTokenHash() {
    return tokenHash;
  }

  public void setTokenHash(String tokenHash) {
    this.tokenHash = tokenHash;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }

  public TokenScope getScope() {
    return scope;
  }

  public void setScope(TokenScope scope) {
    this.scope = scope;
  }

  @GraphQLQuery(name = "tenant")
  @AllowUnverifiedUsers
  public CompletableFuture<Tenant> loadTenant(@GraphQLRootContext GraphQLContext context) {
    if (tenant.hasForeignObject()) {
      return CompletableFuture.completedFuture(tenant.getForeignObject());
    }
    return new UuidFetcher<Tenant>().load(context, IdDataLoaderKey.TENANTS, tenant.getForeignUuid())
        .thenApply(o -> {
          tenant.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setTenantUuid(String tenantUuid) {
    this.tenant = new ForeignObjectHolder<>(tenantUuid);
  }

  @JsonIgnore
  public String getTenantUuid() {
    return tenant.getForeignUuid();
  }

  @GraphQLInputField(name = "tenant")
  public void setTenant(Tenant tenant) {
    this.tenant = new ForeignObjectHolder<>(tenant);
  }

  public Tenant getTenant() {
    return tenant.getForeignObject();
  }

  @GraphQLQuery(name = "accessTokenActivities")
  public CompletableFuture<List<AccessTokenActivity>> loadAccessTokenActivities(
      @GraphQLRootContext GraphQLContext context) {
    if (accessTokenActivities != null) {
      return CompletableFuture.completedFuture(accessTokenActivities);
    } else {
      return engine().getAccessTokenActivityDao().getAccessTokenActivities(context, uuid)
          .thenApply(o -> {
            accessTokenActivities = o;
            return o;
          });
    }
  }

  public List<AccessTokenActivity> getAccessTokenActivities() {
    return accessTokenActivities;
  }


  public static String computeTokenHash(final String tokenValue) {
    try {
      final MessageDigest digest = MessageDigest.getInstance("SHA-256");
      final byte[] encodedHash = digest.digest(tokenValue.getBytes(StandardCharsets.UTF_8));
      return BASE64_ENCODER.encodeToString(encodedHash);
    } catch (final NoSuchAlgorithmException e) {
      throw new RuntimeException(e);
    }
  }

  public boolean isValid() {
    return Instant.now().isBefore(expiresAt);
  }
}
