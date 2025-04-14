package mil.dds.anet.database;

import java.time.Instant;
import java.util.List;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.beans.AccessToken.TokenScope;
import mil.dds.anet.database.mappers.AccessTokenMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AccessTokenDao extends AbstractDao {

  public AccessTokenDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Transactional
  public int insert(AccessToken accessToken) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* insertAccessToken */ INSERT INTO \"accessTokens\" "
              + "(uuid, name, description, \"tokenHash\", \"createdAt\", \"expiresAt\", scope) "
              + "VALUES (:uuid, :name, :description, :tokenHash, :createdAt, :expiresAt, :scope)")
          .bindBean(accessToken).bind("uuid", DaoUtils.getNewUuid())
          .bind("scope", DaoUtils.getEnumId(accessToken.getScope()))
          .bind("createdAt", DaoUtils.asLocalDateTime(Instant.now()))
          .bind("expiresAt", DaoUtils.asLocalDateTime(accessToken.getExpiresAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int update(AccessToken accessToken) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* updateAccessToken */ UPDATE \"accessTokens\" "
              + "SET name = :name, description = :description, \"expiresAt\" = :expiresAt, "
              + "scope = :scope WHERE uuid = :uuid")
          .bindBean(accessToken).bind("scope", DaoUtils.getEnumId(accessToken.getScope()))
          .bind("expiresAt", DaoUtils.asLocalDateTime(accessToken.getExpiresAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int delete(AccessToken accessToken) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* deleteAccessToken */ DELETE FROM \"accessTokens\" WHERE uuid = :uuid")
          .bindBean(accessToken).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public AccessToken getByTokenValueAndScope(String tokenValue, TokenScope scope) {
    final Handle handle = getDbHandle();
    try {
      final String tokenHash = AccessToken.computeTokenHash(tokenValue);
      try {
        return handle.createQuery("/* getAccessTokenByValue */ "
            + "SELECT * FROM \"accessTokens\" WHERE \"tokenHash\" = :tokenHash AND scope = :scope")
            .bind("tokenHash", tokenHash).bind("scope", DaoUtils.getEnumId(scope))
            .map(new AccessTokenMapper()).one();
      } catch (IllegalStateException e) {
        return null;
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public List<AccessToken> getAll() {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery("/* getAccessTokens */ SELECT * FROM \"accessTokens\" ORDER BY name")
          .map(new AccessTokenMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }
}
