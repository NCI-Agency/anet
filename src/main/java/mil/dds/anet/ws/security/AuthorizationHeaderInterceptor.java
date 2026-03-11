package mil.dds.anet.ws.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import mil.dds.anet.database.AccessTokenActivityDao;
import mil.dds.anet.database.AccessTokenDao;
import mil.dds.anet.utils.ResponseUtils;
import org.apache.cxf.binding.soap.interceptor.SoapHeaderInterceptor;
import org.apache.cxf.configuration.security.AuthorizationPolicy;
import org.apache.cxf.message.Message;
import org.apache.cxf.transport.http.AbstractHTTPDestination;
import org.springframework.http.HttpHeaders;

public class AuthorizationHeaderInterceptor extends SoapHeaderInterceptor {

  private final AccessTokenDao accessTokenDao;
  private final AccessTokenActivityDao accessTokenActivityDao;

  public AuthorizationHeaderInterceptor(AccessTokenDao accessTokenDao,
      AccessTokenActivityDao accessTokenActivityDao) {
    this.accessTokenDao = accessTokenDao;
    this.accessTokenActivityDao = accessTokenActivityDao;
  }

  @Override
  public void handleMessage(Message message) {
    final Optional<String> tokenString;
    final AuthorizationPolicy policy = message.get(AuthorizationPolicy.class);

    if (policy != null) {
      // Inject the HTTP Basic Auth password field as a bearer token
      tokenString = Optional.of(policy.getPassword());
    } else {
      // Inject the HTTP Bearer token if present
      tokenString = getBearerToken(message);
    }
    if (tokenString.isPresent()) {
      final var tokenOpt = accessTokenDao.getAccessTokenPrincipal(tokenString.get());
      final HttpServletRequest request =
          (HttpServletRequest) message.get(AbstractHTTPDestination.HTTP_REQUEST);
      ResponseUtils.logAccessTokenActivity(accessTokenActivityDao, tokenOpt, request);
    }
  }

  private Optional<String> getBearerToken(Message message) {
    // Check headers for Bearer token authorization
    @SuppressWarnings("unchecked")
    final Map<String, List<String>> headers =
        (Map<String, List<String>>) message.get(Message.PROTOCOL_HEADERS);
    if (headers != null && headers.containsKey(HttpHeaders.AUTHORIZATION)) {
      final List<String> authorizationHeaders = headers.get(HttpHeaders.AUTHORIZATION);
      if (authorizationHeaders != null) {
        return authorizationHeaders.stream()
            .filter(ah -> ah.startsWith(BearerTokenService.BEARER_PREFIX))
            .map(ah -> ah.substring(BearerTokenService.BEARER_PREFIX.length()))
            // findFirst so it is deterministic if there are multiple authorization headers
            .findFirst();
      }
    }
    return Optional.empty();
  }
}
