package mil.dds.anet.database;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.database.mappers.AccessTokenMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.ws.security.AccessTokenPrincipal;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AccessTokenDao extends AbstractDao {

  public static final String TABLE_NAME = "accessTokens";

  public AccessTokenDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  class SelfIdBatcher extends IdBatcher<AccessToken> {
    private static final String SQL = "/* batch.getAccessTokensByUuids */ SELECT * FROM \""
        + TABLE_NAME + "\" WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(AccessTokenDao.this.databaseHandler, SQL, "uuids", new AccessTokenMapper());
    }
  }

  public AccessToken getByUuid(String uuid) {
    return getByIds(Collections.singletonList(uuid)).get(0);
  }

  public List<AccessToken> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Transactional
  public AccessToken insert(AccessToken accessToken) {
    DaoUtils.setInsertFields(accessToken);
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate("/* insertAccessToken */ INSERT INTO \"" + TABLE_NAME + "\" "
          + "(uuid, name, description, \"tokenHash\", \"createdAt\", \"updatedAt\", \"expiresAt\", scope) "
          + "VALUES (:uuid, :name, :description, :tokenHash, :createdAt, :updatedAt, :expiresAt, :scope)")
          .bindBean(accessToken).bind("scope", DaoUtils.getEnumId(accessToken.getScope()))
          .bind("createdAt", DaoUtils.asLocalDateTime(accessToken.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(accessToken.getUpdatedAt()))
          .bind("expiresAt", DaoUtils.asLocalDateTime(accessToken.getExpiresAt())).execute();
      return accessToken;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int update(AccessToken accessToken) {
    DaoUtils.setUpdateFields(accessToken);
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* updateAccessToken */ UPDATE \"" + TABLE_NAME + "\" "
              + "SET name = :name, description = :description, \"expiresAt\" = :expiresAt, "
              + "scope = :scope, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(accessToken).bind("scope", DaoUtils.getEnumId(accessToken.getScope()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(accessToken.getUpdatedAt()))
          .bind("expiresAt", DaoUtils.asLocalDateTime(accessToken.getExpiresAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int delete(String uuid) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate(
              "/* deleteAccessToken */ DELETE FROM \"" + TABLE_NAME + "\" WHERE uuid = :uuid")
          .bind("uuid", uuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  protected AccessToken getByTokenValue(String tokenValue) {
    final Handle handle = getDbHandle();
    try {
      final String tokenHash = AccessToken.computeTokenHash(tokenValue);
      try {
        return handle
            .createQuery("/* getAccessTokenByValue */ " + "SELECT * FROM \"" + TABLE_NAME
                + "\" WHERE \"tokenHash\" = :tokenHash")
            .bind("tokenHash", tokenHash).map(new AccessTokenMapper()).one();
      } catch (IllegalStateException e) {
        return null;
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public Optional<AccessTokenPrincipal> getAccessTokenPrincipal(String tokenValue) {
    if (tokenValue != null && tokenValue.length() == AccessToken.ACCESS_TOKEN_LENGTH) {
      final AccessToken dbAccessToken = this.getByTokenValue(tokenValue);
      if (dbAccessToken != null && dbAccessToken.isValid()) {
        return Optional.of(new AccessTokenPrincipal(dbAccessToken));
      }
    }
    return Optional.empty();
  }

  @Transactional
  public List<AccessToken> getAll() {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery("/* getAccessTokens */ SELECT * FROM \"" + TABLE_NAME + "\" ORDER BY name")
          .map(new AccessTokenMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }
}
