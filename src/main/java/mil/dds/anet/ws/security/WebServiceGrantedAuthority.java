package mil.dds.anet.ws.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

public class WebServiceGrantedAuthority {

  public final static String SCOPE_GRAPHQL = "SCOPE_GRAPHQL";
  public final static String SCOPE_NVG = "SCOPE_NVG";

  public static SimpleGrantedAuthority GRAPHQL = new SimpleGrantedAuthority(SCOPE_GRAPHQL);
  public static SimpleGrantedAuthority NVG = new SimpleGrantedAuthority(SCOPE_NVG);
}
