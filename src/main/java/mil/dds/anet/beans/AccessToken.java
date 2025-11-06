package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;

public class AccessToken {

  public static final int ACCESS_TOKEN_LENGTH = 32;

  private static final Base64.Encoder BASE64_ENCODER = Base64.getEncoder();

  public enum TokenScope {
    NVG, GRAPHQL, MCP
  }

  @GraphQLQuery
  @GraphQLInputField
  private String uuid;
  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private String description;
  @GraphQLQuery
  @GraphQLInputField
  private String tokenHash;
  @GraphQLQuery
  @GraphQLInputField
  private Instant createdAt;
  @GraphQLQuery
  @GraphQLInputField
  private Instant expiresAt;
  @GraphQLQuery
  @GraphQLInputField
  private TokenScope scope;

  public String getUuid() {
    return uuid;
  }

  public void setUuid(String uuid) {
    this.uuid = uuid;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
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

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
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
