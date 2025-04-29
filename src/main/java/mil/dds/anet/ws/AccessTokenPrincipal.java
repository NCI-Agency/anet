package mil.dds.anet.ws;

import java.security.Principal;
import mil.dds.anet.beans.AccessToken;

public record AccessTokenPrincipal(AccessToken accessToken) implements Principal {

  @Override
  public String getName() {
    return accessToken.getName();
  }
}
