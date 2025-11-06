package mil.dds.anet.ws;

import java.security.Principal;
import java.util.Collection;
import java.util.Collections;
import mil.dds.anet.beans.AccessToken;
import mil.dds.anet.ws.security.WebServiceGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;


public record AccessTokenPrincipal(AccessToken accessToken,
    Collection<? extends GrantedAuthority> authorities) implements Principal {

  public static GrantedAuthority toAuthority(AccessToken.TokenScope scope) {
    return switch (scope) {
      case GRAPHQL -> WebServiceGrantedAuthority.GRAPHQL;
      case NVG -> WebServiceGrantedAuthority.NVG;
      case MCP -> WebServiceGrantedAuthority.MCP;
    };
  }

  public AccessTokenPrincipal(AccessToken accessToken) {
    this(accessToken, Collections.singleton(toAuthority(accessToken.getScope())));
  }

  @Override
  public String getName() {
    return this.accessToken.getName();
  }

  public String getDescription() {
    return this.accessToken.getDescription();
  }

  public String getUuid() {
    return this.accessToken.getUuid();
  }
}
