package mil.dds.anet.ws.security;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.cxf.binding.soap.interceptor.SoapHeaderInterceptor;
import org.apache.cxf.configuration.security.AuthorizationPolicy;
import org.apache.cxf.message.Message;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthenticationToken;

public class AuthorizationHeaderInterceptor extends SoapHeaderInterceptor {

  @Override
  public void handleMessage(Message message) {
    final AuthorizationPolicy policy = message.get(AuthorizationPolicy.class);
    if (policy != null) {
      // Inject the HTTP Basic Auth password field as a bearer token
      SecurityContextHolder.getContext()
          .setAuthentication(new BearerTokenAuthenticationToken(policy.getPassword()));
    } else {
      // Inject the HTTP Bearer token if present
      getBearerToken(message).ifPresent(bearerToken -> SecurityContextHolder.getContext()
          .setAuthentication(new BearerTokenAuthenticationToken(bearerToken)));
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
