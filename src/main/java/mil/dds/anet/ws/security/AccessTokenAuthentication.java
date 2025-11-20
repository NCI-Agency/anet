package mil.dds.anet.ws.security;

import java.util.Collection;
import mil.dds.anet.ws.AccessTokenPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/**
 * Custom Authentication object for Bearer token–based security.
 */
public class AccessTokenAuthentication implements Authentication {

  private boolean authenticated = false;
  private final AccessTokenPrincipal principal;

  public AccessTokenAuthentication(AccessTokenPrincipal principal) {
    if (principal == null)
      throw new UnsupportedOperationException("Principal cannot be null");
    this.principal = principal;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return this.principal.authorities();
  }

  @Override
  public Object getCredentials() {
    return null;
  }

  @Override
  public Object getDetails() {
    return this.principal.getUuid();
  }

  @Override
  public AccessTokenPrincipal getPrincipal() {
    return this.principal;
  }

  @Override
  public boolean isAuthenticated() {
    return authenticated;
  }

  @Override
  public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
    this.authenticated = isAuthenticated;
  }

  @Override
  public String getName() {
    return this.principal.getUuid();
  }
}
