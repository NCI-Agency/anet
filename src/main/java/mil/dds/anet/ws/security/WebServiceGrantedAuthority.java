package mil.dds.anet.ws.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

public class WebServiceGrantedAuthority {

  public static final String SCOPE_GRAPHQL = "SCOPE_GRAPHQL";
  public static final String SCOPE_NVG = "SCOPE_NVG";

  public static final SimpleGrantedAuthority GRAPHQL = new SimpleGrantedAuthority(SCOPE_GRAPHQL);
  public static final SimpleGrantedAuthority NVG = new SimpleGrantedAuthority(SCOPE_NVG);

  private WebServiceGrantedAuthority() {}
}
