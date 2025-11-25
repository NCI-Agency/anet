package mil.dds.anet.ws.security;

import java.util.Optional;
import mil.dds.anet.database.AccessTokenDao;
import org.springframework.stereotype.Component;

/**
 * Service that extracts a bearer token from an HTTP Authorization header and resolves it to an
 * {@link AccessTokenPrincipal}.
 *
 * <p>
 * This class performs lightweight validation on the header format. A token is considered valid only
 * when all of the following conditions hold:
 * <ul>
 * <li>The header is not null</li>
 * <li>The header begins with the literal prefix {@code "Bearer "}</li>
 * <li>The extracted token value has the expected fixed length</li>
 * <li>The {@link AccessTokenDao} returns a non-empty result for the token</li>
 * </ul>
 *
 * <p>
 * If any of these checks fail, an empty {@link Optional} is returned. No exceptions are thrown for
 * invalid headers or failed lookups.
 */
@Component
public class BearerTokenService {

  public static final String BEARER_PREFIX = "Bearer ";

  private final AccessTokenDao accessTokenDao;

  /**
   * Creates a new {@code BearerTokenService} that consults the given DAO when resolving tokens.
   *
   * @param accessTokenDao DAO used to look up access token principals
   */
  public BearerTokenService(AccessTokenDao accessTokenDao) {
    this.accessTokenDao = accessTokenDao;
  }

  /**
   * Parses the given Authorization header, extracts a bearer token and resolves it to an
   * {@link AccessTokenPrincipal}.
   *
   * <p>
   * The method returns an empty result when:
   * <ul>
   * <li>the header is null</li>
   * <li>the header does not start with {@code "Bearer "}</li>
   * <li>the extracted token does not have the expected length</li>
   * <li>the DAO lookup yields no principal</li>
   * </ul>
   *
   * @param authHeader the full Authorization header, expected to start with {@code "Bearer "}
   * @return an {@link Optional} containing the resolved principal, or empty when no valid token is
   *         found
   */
  public Optional<AccessTokenPrincipal> getAccessPrincipalFromAuthHeader(String authHeader) {
    if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
      return accessTokenDao.getAccessTokenPrincipal(authHeader.substring(BEARER_PREFIX.length()));
    }
    return Optional.empty();
  }
}
