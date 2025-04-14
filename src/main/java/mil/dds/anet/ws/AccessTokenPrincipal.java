package mil.dds.anet.ws;

import java.security.Principal;
import javax.security.auth.Subject;
import mil.dds.anet.beans.AccessToken;

public record AccessTokenPrincipal(AccessToken accessToken) implements Principal {

  @Override
  public String getName() {
    return "AccessTokenPrincipal";
  }

  @Override
  public boolean implies(Subject subject) {
    return Principal.super.implies(subject);
  }
}
