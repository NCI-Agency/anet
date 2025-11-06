package mil.dds.anet.ws.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;

/**
 * Custom Authentication object for Bearer token–based security.
 */
public class AccessTokenAuthentication extends AbstractAuthenticationToken {

  private final AccessTokenPrincipal principal;

  public AccessTokenAuthentication(AccessTokenPrincipal principal) {
    super(principal.authorities());
    this.principal = principal;
    this.setAuthenticated(true);
  }

  @Override
  public Object getCredentials() {
    return null; // bearer tokens do not expose credentials
  }

  @Override
  public AccessTokenPrincipal getPrincipal() {
    return this.principal;
  }
}
