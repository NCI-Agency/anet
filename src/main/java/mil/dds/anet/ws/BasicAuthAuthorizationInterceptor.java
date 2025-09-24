package mil.dds.anet.ws;

import org.apache.cxf.binding.soap.interceptor.SoapHeaderInterceptor;
import org.apache.cxf.configuration.security.AuthorizationPolicy;
import org.apache.cxf.message.Message;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthenticationToken;

public class BasicAuthAuthorizationInterceptor extends SoapHeaderInterceptor {

  @Override
  public void handleMessage(Message message) {
    final AuthorizationPolicy policy = message.get(AuthorizationPolicy.class);
    if (policy != null) {
      // Inject the HTTP Basic Auth password field as a bearer token
      SecurityContextHolder.getContext()
          .setAuthentication(new BearerTokenAuthenticationToken(policy.getPassword()));
    }
  }

}
